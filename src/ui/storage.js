import { restore } from '../game.js';

const KEY = 'it-master-missions-v1';

// Saved progress: the mission in play and the best score for each finished mission.
export function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    const best = saved?.best && typeof saved.best === 'object' ? saved.best : {};
    return { state: restore(saved?.current), best };
  } catch {
    return { state: null, best: {} };
  }
}

export function saveProgress(state, best) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ current: state, best }));
  } catch {}
}
