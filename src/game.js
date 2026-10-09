import {
  required,
  match,
  online,
  diagnose,
  joins,
  plugsInto,
  portLabel,
  deviceById,
  cableById,
} from './engine.js';
import { missions } from './missions.js';
// Ports that represent several sockets, so one cable there never blocks another.
const shared = ['switch:eth', 'ups:power'];
const end = (device, port) => `${deviceById(device).name} (${portLabel(port)})`;
export const cableName = id => cableById(id).name;
export const goal = m => [...new Set([...m.start, ...m.add])];
// Devices the mission is about: everything a finished mission brings online, minus the always-on sources.
export const targets = m =>
  [...online(goal(m))].filter(id => id !== 'isp' && id !== 'ups' && !deviceById(id).passive);
// The patch panel only appears in missions that use it.
export const usesPatch = m =>
  [...goal(m).map(i => required[i]), ...m.faults].some(r => r.a === 'patch' || r.b === 'patch');
export function newState(m) {
  return {
    mission: m.id,
    connected: [...m.start],
    faults: m.faults.map((_, i) => i),
    history: [],
    mistakes: 0,
    hints: 0,
  };
}
export const missionOf = s => missions.find(m => m.id === s.mission);
export const faultLinks = s => s.faults.map(i => missionOf(s).faults[i]);
export function tasks(s) {
  const m = missionOf(s);
  return {
    total: m.add.length + m.faults.length,
    done: m.add.filter(i => s.connected.includes(i)).length + m.faults.length - s.faults.length,
  };
}
export function complete(s) {
  const m = missionOf(s);
  return !s.faults.length && goal(m).every(i => s.connected.includes(i));
}
// Apply a connect or unplug attempt. Returns {ok, text, fresh} where fresh lists devices that just came online.
export function attempt(s, a, b, cable) {
  const m = missionOf(s);
  if (cable === 'unplug') {
    const f = s.faults.find(i => joins(m.faults[i], a, b));
    if (f !== undefined) {
      s.faults = s.faults.filter(i => i !== f);
      s.history.push({ unplug: f });
      return { ok: true, text: `Faulty cable removed. ${m.faults[f].why}`, fresh: [] };
    }
    const i = s.connected.find(i => joins(required[i], a, b));
    if (i !== undefined) {
      s.connected = s.connected.filter(x => x !== i);
      s.history.push({ removed: i });
      return {
        ok: true,
        text: 'That cable was working. It is unplugged now, so plug it back in to finish the mission.',
        fresh: [],
      };
    }
    return { ok: false, text: 'No cable runs between those two ports.' };
  }
  const i = match(a, b, cable);
  if (i < 0) {
    s.mistakes++;
    return { ok: false, text: diagnose(a, b, cable) };
  }
  if (s.connected.includes(i)) return { ok: false, text: 'That link is already connected.' };
  const blocker = faultLinks(s).find(f =>
    [a, b].some(e => !shared.includes(`${e.device}:${e.port}`) && plugsInto(f, e)),
  );
  if (blocker)
    return {
      ok: false,
      text: 'A cable is already plugged into that port. Use Unplug on both of its ends first.',
    };
  if (!goal(m).includes(i))
    return {
      ok: false,
      text:
        usesPatch(m) && required[i].a === 'switch' && required[i].b !== 'patch'
          ? 'In this office, desks reach the switch through the patch panel. Patch their jack instead.'
          : 'That is a valid link, but it is not part of this mission.',
    };
  const before = online(s.connected);
  s.connected.push(i);
  s.history.push({ connected: i });
  return {
    ok: true,
    text: required[i].lesson,
    fresh: [...online(s.connected)].filter(id => !before.has(id)),
  };
}
export function undo(s) {
  const h = s.history.pop();
  if (!h) return false;
  if ('connected' in h) s.connected = s.connected.filter(i => i !== h.connected);
  if ('removed' in h) s.connected.push(h.removed);
  if ('unplug' in h) s.faults.push(h.unplug);
  return true;
}
// Next step toward completion: unplug faults first, then make missing links.
export function hint(s) {
  const m = missionOf(s);
  if (s.faults.length) {
    const f = m.faults[s.faults[0]];
    return {
      cable: 'unplug',
      a: { device: f.a, port: f.ap },
      b: { device: f.b, port: f.bp },
      text: `Hint: the ${cableName(f.cable)} cable from ${end(f.a, f.ap)} to ${end(f.b, f.bp)} is wrong. Select Unplug and click both ends.`,
    };
  }
  const i = goal(m).find(i => !s.connected.includes(i));
  if (i === undefined) return null;
  const r = required[i];
  return {
    cable: r.cable,
    a: { device: r.a, port: r.ap },
    b: { device: r.b, port: r.bp },
    text: `Hint: use ${cableName(r.cable)} from ${end(r.a, r.ap)} to ${end(r.b, r.bp)}.`,
  };
}
export function restore(saved) {
  const m = missions.find(m => m.id === saved?.mission);
  if (!m) return null;
  const s = newState(m);
  const ok = (list, max) =>
    Array.isArray(list) && list.every(i => Number.isInteger(i) && i >= 0 && i < max);
  if (ok(saved.connected, required.length)) s.connected = [...new Set(saved.connected)];
  if (ok(saved.faults, m.faults.length)) s.faults = [...new Set(saved.faults)];
  s.mistakes = Number(saved.mistakes) || 0;
  s.hints = Number(saved.hints) || 0;
  return s;
}
// Keep the better of a mission's previous best and this finished attempt (fewer mistakes + hints).
export function recordBest(best, s) {
  const prev = best[s.mission],
    score = { mistakes: s.mistakes, hints: s.hints };
  if (!prev || score.mistakes + score.hints < prev.mistakes + prev.hints) best[s.mission] = score;
  return best;
}
