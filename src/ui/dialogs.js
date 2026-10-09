import { missions, tracks } from '../missions.js';
import { $ } from './dom.js';

const perfect = score => !score.mistakes && !score.hints;

export function showComplete(mission, state) {
  $('#complete-title').textContent = mission.title;
  $('#result').textContent =
    `${state.mistakes} incorrect attempts · ${state.hints} hints used${perfect(state) ? ' · ★ Perfect' : ''}`;
  $('#next').hidden = !missions[missions.indexOf(mission) + 1];
  $('#complete').showModal();
}

// Missions grouped by track. ★ marks a perfect best score, ✓ any finish.
export function showMissionList(currentId, best) {
  const item = (m, i) => {
    const mark = best[m.id] ? (perfect(best[m.id]) ? '★' : '✓') : '';
    return `<li><button data-mission="${m.id}" class="${m.id === currentId ? 'current' : ''}"><span>${String(i + 1).padStart(2, '0')}</span>${m.title}<em>${mark}</em></button></li>`;
  };
  $('#mission-groups').innerHTML = tracks
    .map(
      track =>
        `<section><h3>${track}</h3><ol>${missions.map((m, i) => (m.track === track ? item(m, i) : '')).join('')}</ol></section>`,
    )
    .join('');
  $('#mission-list').showModal();
}
