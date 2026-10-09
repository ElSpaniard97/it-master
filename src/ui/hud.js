import { cables } from '../engine.js';
import { missions } from '../missions.js';
import { missionOf, targets, tasks } from '../game.js';
import { chapterOf, stars, starText } from '../progress.js';
import { $ } from './dom.js';
import { cableArt } from './art.js';

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
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

// Checklist shown in the mission panel: [text, done] pairs.
function objectives(state, live) {
  const m = missionOf(state),
    t = targets(m),
    list = [];
  if (m.faults.length)
    list.push([`Unplug ${plural(m.faults.length, 'faulty cable')}`, !state.faults.length]);
  list.push([
    `Make ${plural(m.add.length, 'connection')}`,
    m.add.every(i => state.connected.includes(i)),
  ]);
  list.push([`Bring ${plural(t.length, 'device')} online`, t.every(id => live.has(id))]);
  return list;
}

// Mission panel, progress panel and undo button.
export function renderMission(state, live, best) {
  const m = missionOf(state),
    t = targets(m);
  $('#mission-num').textContent =
    `Chapter ${chapterOf(m).number} · ${m.track} · Mission ${missions.indexOf(m) + 1}`;
  const n = stars(best[m.id]);
  $('#best-stars').textContent = n ? starText(n) : '';
  $('#best-stars').setAttribute('aria-label', n ? `Best: ${n} of 3 stars` : 'Not finished yet');
  $('#mission-title').textContent = m.title;
  $('#mission-brief').textContent = m.brief;
  $('#objectives').innerHTML = objectives(state, live)
    .map(([text, done]) => `<li class="${done ? 'done' : ''}">${text}</li>`)
    .join('');
  const { done, total } = tasks(state);
  $('#count').textContent = `${done} / ${total} tasks`;
  $('#progress').max = total;
  $('#progress').value = done;
  $('#online').textContent =
    `${t.filter(id => live.has(id)).length} / ${t.length} mission devices online`;
  $('#undo').disabled = !state.history.length;
}

// Cable and tool buttons in the tray.
export function renderCables(selected) {
  $('#cables').innerHTML = [...cables]
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
    .map(
      c =>
        `<button class="cable ${selected === c.id ? 'active' : ''}" data-cable="${c.id}" aria-pressed="${selected === c.id}">${cableArt(c)}${c.name}<small>${subtitle[c.id] || 'Cable'}</small></button>`,
    )
    .join('');
}

export function showSelected(cable) {
  $('#selected-art').innerHTML = cableArt(cable);
}
