// Chapters, star ratings and unlocks. `best` maps mission id to its best {mistakes, hints}.
import { missions, tracks } from './missions.js';

// Each track is a chapter. A chapter opens once every mission in the chapter before it is finished.
export const chapters = tracks.map((title, i) => ({
  number: i + 1,
  title,
  missions: missions.filter(m => m.track === title),
}));
export const chapterOf = m => chapters.find(c => c.title === m.track);

// 3 stars: no mistakes or hints. 2 stars: two slips at most. 1 star: finished.
export function stars(score) {
  if (!score) return 0;
  const slips = score.mistakes + score.hints;
  return slips === 0 ? 3 : slips <= 2 ? 2 : 1;
}
export const starText = n => '★'.repeat(n) + '☆'.repeat(3 - n);

export const chapterDone = (c, best) => c.missions.every(m => best[m.id]);
export const chapterStars = (c, best) => c.missions.reduce((n, m) => n + stars(best[m.id]), 0);
export const totalStars = best => missions.reduce((n, m) => n + stars(best[m.id]), 0);

export function chapterUnlocked(c, best) {
  const before = chapters[c.number - 2];
  return !before || (chapterDone(before, best) && chapterUnlocked(before, best));
}
export const missionUnlocked = (m, best) => chapterUnlocked(chapterOf(m), best);

// Where "Next mission" goes: the following mission if it is open, otherwise the first
// unfinished mission that is open. Returns undefined when there is nothing left to play.
export function nextMission(m, best) {
  const after = missions[missions.indexOf(m) + 1];
  if (after && missionUnlocked(after, best)) return after;
  return missions.find(x => x !== m && !best[x.id] && missionUnlocked(x, best));
}
