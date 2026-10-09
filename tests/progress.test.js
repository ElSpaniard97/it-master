import test from 'node:test';
import assert from 'node:assert/strict';
import { missions } from '../src/missions.js';
import {
  chapters,
  stars,
  starText,
  chapterUnlocked,
  missionUnlocked,
  nextMission,
  totalStars,
} from '../src/progress.js';

const finish = (list, score = { mistakes: 0, hints: 0 }) =>
  Object.fromEntries(list.map(m => [m.id, score]));

test('stars reward clean runs', () => {
  assert.equal(stars(undefined), 0);
  assert.equal(stars({ mistakes: 0, hints: 0 }), 3);
  assert.equal(stars({ mistakes: 1, hints: 1 }), 2);
  assert.equal(stars({ mistakes: 3, hints: 0 }), 1);
  assert.equal(starText(2), '★★☆');
});

test('every mission belongs to exactly one chapter', () => {
  assert.equal(
    chapters.reduce((n, c) => n + c.missions.length, 0),
    missions.length,
  );
  assert.deepEqual(
    chapters.map(c => c.number),
    chapters.map((_, i) => i + 1),
  );
});

test('chapters unlock in order once the previous chapter is finished', () => {
  assert.ok(chapterUnlocked(chapters[0], {}));
  assert.ok(!chapterUnlocked(chapters[1], {}));
  const partial = finish(chapters[0].missions.slice(1));
  assert.ok(!chapterUnlocked(chapters[1], partial));
  const done = finish(chapters[0].missions);
  assert.ok(chapterUnlocked(chapters[1], done));
  assert.ok(!chapterUnlocked(chapters[2], done));
  assert.ok(missionUnlocked(chapters[1].missions[0], done));
});

test('next mission skips locked chapters', () => {
  const ch1 = chapters[0].missions;
  const last = ch1[ch1.length - 1];
  // Finished the last mission of chapter 1 but skipped the first one.
  const best = finish(ch1.slice(1));
  assert.equal(nextMission(last, best), ch1[0]);
  assert.equal(nextMission(last, finish(ch1)), chapters[1].missions[0]);
  assert.equal(nextMission(missions.at(-1), finish(missions)), undefined);
});

test('total stars add up across missions', () => {
  assert.equal(totalStars(finish(missions)), missions.length * 3);
});
