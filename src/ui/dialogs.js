import { $ } from './dom.js';
import {
  chapters,
  stars,
  starText,
  chapterDone,
  chapterStars,
  chapterUnlocked,
  totalStars,
  nextMission,
} from '../progress.js';
import { missions } from '../missions.js';

// `unlocked` is the chapter this finish opened, if any.
export function showComplete(mission, state, best, unlocked) {
  $('#complete-title').textContent = mission.title;
  const earned = stars(state);
  $('#complete-stars').textContent = starText(earned);
  $('#complete-stars').setAttribute('aria-label', `${earned} of 3 stars`);
  $('#result').textContent =
    `${state.mistakes} incorrect attempts · ${state.hints} hints used` +
    (stars(best[mission.id]) > earned ? ` · Best: ${starText(stars(best[mission.id]))}` : '');
  $('#unlocked').hidden = !unlocked;
  if (unlocked)
    $('#unlocked').textContent = `Chapter ${unlocked.number} unlocked: ${unlocked.title}`;
  $('#next').hidden = !nextMission(mission, best);
  $('#complete').showModal();
}

// Missions grouped by chapter, with stars earned and locked chapters greyed out.
export function showMissionList(currentId, best) {
  const item = (m, open) => {
    const n = stars(best[m.id]);
    return `<li><button data-mission="${m.id}" class="${m.id === currentId ? 'current' : ''}" ${open ? '' : 'disabled'}><span>${String(missions.indexOf(m) + 1).padStart(2, '0')}</span>${m.title}<em aria-label="${n} of 3 stars">${n ? starText(n) : ''}</em></button></li>`;
  };
  $('#total-stars').textContent = `${totalStars(best)} / ${missions.length * 3} ★`;
  $('#mission-groups').innerHTML = chapters
    .map(c => {
      const open = chapterUnlocked(c, best);
      const status = open
        ? `${chapterStars(c, best)} / ${c.missions.length * 3} ★${chapterDone(c, best) ? ' · Done' : ''}`
        : `🔒 Finish chapter ${c.number - 1}`;
      return `<section class="${open ? '' : 'locked'}"><h3>Chapter ${c.number} · ${c.title}<small>${status}</small></h3><ol>${c.missions.map(m => item(m, open)).join('')}</ol></section>`;
    })
    .join('');
  $('#mission-list').showModal();
}
