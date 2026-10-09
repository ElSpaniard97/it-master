import test from 'node:test';
import assert from 'node:assert/strict';
import { devices, required, cables, joins } from '../src/engine.js';
import { missions, tracks } from '../src/missions.js';
import { newState, attempt, hint, complete, undo, goal, targets, tasks } from '../src/game.js';
const port = (d, p) => devices.find(x => x.id === d)?.ports.includes(p);
test('there are 30 missions with unique ids in known tracks', () => {
  assert.equal(missions.length, 30);
  assert.equal(new Set(missions.map(m => m.id)).size, 30);
  for (const m of missions) assert.ok(tracks.includes(m.track), m.id);
});
test('mission data is well formed', () => {
  for (const m of missions) {
    for (const i of [...m.start, ...m.add]) assert.ok(i >= 0 && i < required.length, m.id);
    assert.ok(m.add.length, m.id);
    assert.ok(!m.add.some(i => m.start.includes(i)), `${m.id} adds a prewired link`);
    for (const f of m.faults) {
      assert.ok(port(f.a, f.ap) && port(f.b, f.bp), `${m.id} fault port`);
      assert.ok(cables.some(c => c.id === f.cable));
      const ends = [
        { device: f.a, port: f.ap },
        { device: f.b, port: f.bp },
      ];
      assert.ok(
        !required.some(r => r.cable === f.cable && joins(r, ...ends)),
        `${m.id} fault is a correct link`,
      );
    }
    assert.ok(targets(m).length, m.id);
  }
});
test('following hints solves every mission', () => {
  for (const m of missions) {
    const s = newState(m);
    assert.ok(!complete(s), `${m.id} starts complete`);
    let steps = 0,
      h;
    while ((h = hint(s)) && steps++ < 40) {
      const r = attempt(s, h.a, h.b, h.cable);
      assert.ok(r.ok, `${m.id}: ${r.text}`);
    }
    assert.ok(complete(s), m.id);
    assert.deepEqual(tasks(s), {
      total: m.add.length + m.faults.length,
      done: m.add.length + m.faults.length,
    });
    assert.equal(s.mistakes, 0);
  }
});
test('a fault blocks its port until unplugged, and undo restores it', () => {
  const m = missions.find(m => m.id === 'wrong-side'),
    s = newState(m),
    modem = { device: 'modem', port: 'eth' },
    wan = { device: 'router', port: 'wan' },
    lan = { device: 'router', port: 'lan' };
  assert.match(attempt(s, modem, wan, 'ethernet').text, /already plugged/);
  assert.ok(attempt(s, modem, lan, 'unplug').ok);
  assert.ok(attempt(s, modem, wan, 'ethernet').ok);
  assert.ok(complete(s));
  undo(s);
  undo(s);
  assert.equal(s.faults.length, 1);
});
test('links outside the mission are refused without counting a mistake', () => {
  const s = newState(missions[0]);
  const r = attempt(
    s,
    { device: 'modem', port: 'eth' },
    { device: 'router', port: 'wan' },
    'ethernet',
  );
  assert.ok(!r.ok);
  assert.match(r.text, /not part of this mission/);
  assert.equal(s.mistakes, 0);
});
test('goal never loses prewired links', () => {
  for (const m of missions) for (const i of m.start) assert.ok(goal(m).includes(i));
});
