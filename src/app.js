import { cables, devices, required, online } from './engine.js';
import { missions, tracks } from './missions.js';
import {
  newState,
  restore,
  attempt,
  undo,
  hint,
  complete,
  tasks,
  targets,
  faultLinks,
  missionOf,
} from './game.js';
const positions = {
  isp: [27, 28],
  modem: [18, 48],
  router: [29, 49],
  switch: [44, 26],
  ups: [44, 65],
  ap: [66, 31],
  pc: [63, 58],
  phone: [78, 62],
  camera: [86, 30],
  printer: [89, 65],
  laptop: [18, 77],
};
const order = ['ethernet', 'fiber', 'hdmi', 'power', 'console', 'phone', 'wifi', 'unplug', 'tools'];
const subtitle = {
  wifi: 'Wireless',
  ethernet: '(Cat6)',
  console: '(USB)',
  phone: '(RJ11)',
  tools: 'Diagnostics',
  hdmi: 'Video',
  unplug: 'Remove',
};
const KEY = 'it-master-missions-v1';
const $ = s => document.querySelector(s);
let state = newState(missions[0]),
  best = {},
  selected = 'ethernet',
  start = null;
try {
  const saved = JSON.parse(localStorage.getItem(KEY));
  state = restore(saved?.current) || state;
  if (saved?.best && typeof saved.best === 'object') best = saved.best;
} catch {}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ current: state, best }));
  } catch {}
}
function message(text, error = false) {
  $('#feedback').textContent = text;
  $('#feedback').classList.toggle('error', error);
}
function inspect(name, info) {
  $('#inspect-name').textContent = name;
  $('#inspect-info').textContent = info;
}
function cableArt(c) {
  if (c.id === 'unplug')
    return `<svg viewBox="0 0 110 75"><path d="M8 40H38M72 40H102" stroke="#50a7ff" stroke-width="7" stroke-linecap="round"/><rect x="30" y="28" width="16" height="24" rx="3" fill="#b9c4d0"/><rect x="64" y="28" width="16" height="24" rx="3" fill="#b9c4d0"/><path d="M55 14V26M47 18l4 7M63 18l-4 7M55 66V54M47 62l4-7M63 62l-4-7" stroke="${c.color}" stroke-width="4" stroke-linecap="round"/></svg>`;
  if (c.id === 'tools')
    return `<svg viewBox="0 0 110 75"><rect x="17" y="25" width="78" height="42" rx="5" fill="#252d34" stroke="#647886"/><path d="M40 27V15H72V27" fill="none" stroke="#eb534a" stroke-width="7"/><path d="M34 36L33 57M56 34L57 60M77 36L75 58" stroke="#b9c4cc" stroke-width="4"/><path d="M31 50L31 61M54 50L54 63M76 49L76 62" stroke="#e95d50" stroke-width="7"/></svg>`;
  if (c.id === 'wifi')
    return `<svg viewBox="0 0 110 75"><path d="M18 27Q55 -4 92 27M31 40Q55 18 79 40M44 52Q55 42 66 52" fill="none" stroke="${c.color}" stroke-width="7" stroke-linecap="round"/><circle cx="55" cy="65" r="6" fill="${c.color}"/></svg>`;
  return `<svg viewBox="0 0 110 75"><defs><linearGradient id="coil-${c.id}" x2="0" y2="1"><stop stop-color="${c.color}"/><stop offset=".5" stop-color="${c.color}"/><stop offset="1" stop-color="#122737"/></linearGradient></defs><ellipse cx="54" cy="34" rx="37" ry="24" fill="#080d15" stroke="#07131c" stroke-width="8"/>${[0, 1, 2, 3].map(i => `<ellipse cx="54" cy="${32 + i * 2}" rx="${37 - i * 3}" ry="${23 - i * 3}" fill="none" stroke="url(#coil-${c.id})" stroke-width="3"/>`).join('')}<path d="M20 41Q14 53 24 62M86 40Q99 50 88 60" fill="none" stroke="${c.color}" stroke-width="5"/><path d="M20 58l6 9M86 58l-5 9" stroke="#b9c4d0" stroke-width="9"/><path d="M20 58l6 9M86 58l-5 9" stroke="#e7d7a1" stroke-width="3"/></svg>`;
}
const calm = matchMedia('(prefers-reduced-motion: reduce)');
function packet(svg, path, color) {
  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('r', '5');
  dot.setAttribute('fill', color);
  dot.setAttribute('class', 'packet');
  const move = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
  move.setAttribute('dur', '.9s');
  move.setAttribute('begin', 'indefinite');
  move.setAttribute('path', path);
  move.addEventListener('endEvent', () => dot.remove());
  dot.append(move);
  svg.append(dot);
  move.beginElement();
}
const links = () => [...state.connected.map(i => required[i]), ...faultLinks(state)];
function draw(fresh = []) {
  const svg = $('#wires'),
    rect = $('#scene').getBoundingClientRect();
  svg.replaceChildren();
  for (const r of links()) {
    const a = $(`[data-key="${r.a}:${r.ap}"]`).getBoundingClientRect(),
      b = $(`[data-key="${r.b}:${r.bp}"]`).getBoundingClientRect();
    const x = a.x + a.width / 2 - rect.x,
      y = a.y + a.height / 2 - rect.y,
      xx = b.x + b.width / 2 - rect.x,
      yy = b.y + b.height / 2 - rect.y;
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute(
      'd',
      `M${x},${y} C${x},${(y + yy) / 2 + 25} ${xx},${(y + yy) / 2 + 25} ${xx},${yy}`,
    );
    p.setAttribute('stroke', cables.find(c => c.id === r.cable).color);
    p.setAttribute('stroke-width', '3');
    p.setAttribute('fill', 'none');
    p.setAttribute('opacity', '.75');
    if (r.cable === 'wifi') p.setAttribute('stroke-dasharray', '5 7');
    svg.append(p);
    if (r.cable !== 'power' && fresh.includes(r.b) && !calm.matches)
      packet(svg, p.getAttribute('d'), p.getAttribute('stroke'));
  }
}
function objectives(live) {
  const m = missionOf(state),
    t = targets(m),
    list = [];
  if (m.faults.length)
    list.push([
      `Unplug ${m.faults.length} faulty cable${m.faults.length > 1 ? 's' : ''}`,
      !state.faults.length,
    ]);
  list.push([
    `Make ${m.add.length} connection${m.add.length > 1 ? 's' : ''}`,
    m.add.every(i => state.connected.includes(i)),
  ]);
  list.push([
    `Bring ${t.length} device${t.length > 1 ? 's' : ''} online`,
    t.every(id => live.has(id)),
  ]);
  return list;
}
function render(fresh = []) {
  const m = missionOf(state),
    live = online(state.connected),
    used = links(),
    t = targets(m),
    focus = document.activeElement?.closest?.('[data-key],[data-inspect],[data-cable]'),
    refocus =
      focus &&
      Object.entries(focus.dataset)
        .filter(([k]) => ['key', 'inspect', 'cable'].includes(k))
        .map(([k, v]) => `[data-${k}="${v}"]`)[0];
  $('#mission-num').textContent = `Mission ${missions.indexOf(m) + 1} · ${m.track}`;
  $('#mission-title').textContent = m.title;
  $('#mission-brief').textContent = m.brief;
  $('#objectives').innerHTML = objectives(live)
    .map(([text, done]) => `<li class="${done ? 'done' : ''}">${text}</li>`)
    .join('');
  $('#devices').innerHTML = devices
    .map(
      d =>
        `<article class="device ${live.has(d.id) ? 'online' : ''} ${fresh.includes(d.id) ? 'just-online' : ''}" style="left:${positions[d.id][0]}%;top:${positions[d.id][1]}%"><div class="device-top"><span class="device-icon">${d.icon}</span><span class="status">${live.has(d.id) ? '● ONLINE' : '○ OFFLINE'}</span></div><button class="device-name" data-inspect="${d.id}">${d.name}</button><div class="ports">${d.ports.map(p => `<button class="port ${start?.device === d.id && start?.port === p ? 'selected' : ''} ${used.some(r => (r.a === d.id && r.ap === p) || (r.b === d.id && r.bp === p)) ? 'connected' : ''}" data-device="${d.id}" data-port="${p}" data-key="${d.id}:${p}" aria-label="${d.name} ${p} port" aria-pressed="${start?.device === d.id && start?.port === p}">${p === 'power' ? 'PWR' : p.toUpperCase()}</button>`).join('')}</div></article>`,
    )
    .join('');
  $('#cables').innerHTML = [...cables]
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
    .map(
      c =>
        `<button class="cable ${selected === c.id ? 'active' : ''}" data-cable="${c.id}" aria-pressed="${selected === c.id}">${cableArt(c)}${c.name}<small>${subtitle[c.id] || 'Cable'}</small></button>`,
    )
    .join('');
  if (refocus) $(refocus)?.focus();
  const { done, total } = tasks(state),
    n = t.filter(id => live.has(id)).length;
  $('#count').textContent = `${done} / ${total} tasks`;
  $('#progress').max = total;
  $('#progress').value = done;
  $('#online').textContent = `${n} / ${t.length} mission devices online`;
  $('#undo').disabled = !state.history.length;
  save();
  requestAnimationFrame(() => draw(fresh));
}
function finish() {
  const m = missionOf(state),
    prev = best[m.id],
    score = { mistakes: state.mistakes, hints: state.hints };
  if (!prev || score.mistakes + score.hints < prev.mistakes + prev.hints) best[m.id] = score;
  save();
  const next = missions[missions.indexOf(m) + 1];
  $('#complete-title').textContent = m.title;
  $('#result').textContent =
    `${state.mistakes} incorrect attempts · ${state.hints} hints used${!state.mistakes && !state.hints ? ' · ★ Perfect' : ''}`;
  $('#next').hidden = !next;
  $('#complete').showModal();
}
function load(m) {
  state = newState(m);
  start = null;
  message(`${m.title}: ${m.brief}`);
  render();
}
function missionList() {
  $('#mission-groups').innerHTML = tracks
    .map(
      track =>
        `<section><h3>${track}</h3><ol>${missions.map((m, i) => (m.track !== track ? '' : `<li><button data-mission="${m.id}" class="${m.id === state.mission ? 'current' : ''}"><span>${String(i + 1).padStart(2, '0')}</span>${m.title}<em>${best[m.id] ? (best[m.id].mistakes + best[m.id].hints ? '✓' : '★') : ''}</em></button></li>`)).join('')}</ol></section>`,
    )
    .join('');
  $('#mission-list').showModal();
}
$('#devices').addEventListener('click', e => {
  const inspectButton = e.target.closest('[data-inspect]');
  if (inspectButton) {
    const d = devices.find(d => d.id === inspectButton.dataset.inspect);
    inspect(d.name, d.info);
    return;
  }
  const b = e.target.closest('[data-port]');
  if (!b) return;
  const end = { device: b.dataset.device, port: b.dataset.port };
  if (!start) {
    start = end;
    message(
      selected === 'unplug'
        ? 'First end selected. Click the other end of the cable to unplug it.'
        : 'Source selected. Click a destination port, or click the source again to cancel.',
    );
  } else if (start.device === end.device && start.port === end.port) {
    start = null;
    message('Selection cleared. Choose a source port.');
  } else {
    const from = start;
    start = null;
    const r = attempt(state, from, end, selected);
    message(r.text, !r.ok);
    render(r.fresh || []);
    if (r.ok && complete(state)) finish();
    return;
  }
  render();
});
$('#cables').addEventListener('click', e => {
  const b = e.target.closest('[data-cable]');
  if (!b) return;
  if (b.dataset.cable === 'tools') {
    $('#hint').click();
    inspect('Network tools', 'Use the hint tool to inspect the next missing connection.');
    return;
  }
  selected = b.dataset.cable;
  start = null;
  const c = cables.find(c => c.id === selected);
  $('#selected-art').innerHTML = cableArt(c);
  inspect(c.name, c.description);
  message(
    selected === 'unplug'
      ? 'Unplug selected. Click both ends of the cable to remove.'
      : `${c.name} selected. Choose two matching ports.`,
  );
  render();
});
$('#hint').onclick = () => {
  const h = hint(state);
  if (!h) {
    message('Everything is connected. Mission complete!');
    return;
  }
  state.hints++;
  message(h.text);
  save();
};
$('#undo').onclick = () => {
  if (undo(state)) {
    start = null;
    message('Last action undone.');
    render();
  }
};
$('#reset').onclick = () => {
  if (
    tasks(state).done &&
    !confirm('Restart this mission? This clears your connections, mistakes and hints.')
  )
    return;
  load(missionOf(state));
  message('New attempt started. Select a cable and connect two ports.');
};
$('#ports').onclick = () => {
  const hide = $('#scene').classList.toggle('hide-ports');
  $('#ports').textContent = hide ? 'Ports: hover' : 'Ports: on';
  $('#ports').setAttribute('aria-pressed', String(!hide));
};
$('#missions').onclick = missionList;
$('#all-missions').onclick = () => {
  $('#complete').close();
  missionList();
};
$('#mission-groups').addEventListener('click', e => {
  const b = e.target.closest('[data-mission]');
  if (!b) return;
  $('#mission-list').close();
  if (b.dataset.mission !== state.mission) load(missions.find(m => m.id === b.dataset.mission));
});
$('#close-missions').onclick = () => $('#mission-list').close();
$('#next').onclick = () => {
  $('#complete').close();
  load(missions[missions.indexOf(missionOf(state)) + 1]);
};
$('#selected-art').innerHTML = cableArt(cables.find(c => c.id === selected));
$('#continue').onclick = () => $('#complete').close();
window.addEventListener('resize', () => draw());
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && start) {
    start = null;
    message('Selection cleared. Choose a source port.');
    render();
  }
});
message(`${missionOf(state).title}: ${missionOf(state).brief}`);
render();
