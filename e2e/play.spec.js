import { test, expect } from '@playwright/test';

const port = (page, key) => page.locator(`[data-key="${key}"]`);
const cable = (page, id) => page.locator(`[data-cable="${id}"]`);
async function connect(page, cableId, a, b) {
  await cable(page, cableId).click();
  await port(page, a).click();
  await port(page, b).click();
}
// Save progress as if the given missions were finished perfectly, then reload.
async function finished(page, ids) {
  await page.evaluate(ids => {
    const best = Object.fromEntries(ids.map(id => [id, { mistakes: 0, hints: 0 }]));
    localStorage.setItem('it-master-missions-v1', JSON.stringify({ best }));
  }, ids);
  await page.reload();
}
const chapterIds = page =>
  page.evaluate(async n => {
    const { chapters } = await import('/src/progress.js');
    return chapters.slice(0, n).flatMap(c => c.missions.map(m => m.id));
  }, 4);
async function openMission(page, id) {
  await page.locator('#missions').click();
  await page.locator(`[data-mission="${id}"]`).click();
}

test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => {
    throw error;
  });
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('it-master-sound', 'off');
  });
  await page.reload();
});

test('first mission can be finished with a perfect score', async ({ page }) => {
  await expect(page.locator('#mission-title')).toHaveText('Light up the fiber');
  await connect(page, 'fiber', 'isp:fiber', 'modem:fiber');
  await expect(page.locator('#count')).toHaveText('1 / 2 tasks');
  await connect(page, 'power', 'ups:power', 'modem:power');
  await expect(page.locator('#complete')).toBeVisible();
  await expect(page.locator('#complete-stars')).toHaveText('★★★');
  await page.locator('#next').click();
  await expect(page.locator('#mission-title')).toHaveText('Router on the edge');
});

test('a wrong cable is explained, counted, and can be undone', async ({ page }) => {
  await connect(page, 'ethernet', 'isp:fiber', 'modem:fiber');
  await expect(page.locator('#feedback')).toHaveClass(/error/);
  await expect(page.locator('#feedback')).toContainText('Right ports, wrong cable');
  await connect(page, 'fiber', 'isp:fiber', 'modem:fiber');
  await expect(port(page, 'modem:fiber')).toHaveClass(/connected/);
  await page.locator('#undo').click();
  await expect(port(page, 'modem:fiber')).not.toHaveClass(/connected/);
  await expect(page.locator('#count')).toHaveText('0 / 2 tasks');
});

test('a faulty cable must be unplugged before rewiring', async ({ page }) => {
  await finished(page, await chapterIds(page));
  await openMission(page, 'wrong-side');
  await expect(page.locator('#objectives')).toContainText('Unplug 1 faulty cable');
  await connect(page, 'ethernet', 'modem:eth', 'router:wan');
  await expect(page.locator('#feedback')).toContainText('already plugged');
  await connect(page, 'unplug', 'modem:eth', 'router:lan');
  await connect(page, 'ethernet', 'modem:eth', 'router:wan');
  await expect(page.locator('#complete')).toBeVisible();
});

test('progress survives a reload', async ({ page }) => {
  await connect(page, 'fiber', 'isp:fiber', 'modem:fiber');
  await page.reload();
  await expect(port(page, 'modem:fiber')).toHaveClass(/connected/);
  await expect(page.locator('#count')).toHaveText('1 / 2 tasks');
});

test('best scores show in the mission list', async ({ page }) => {
  await page.locator('#hint').click();
  await connect(page, 'fiber', 'isp:fiber', 'modem:fiber');
  await connect(page, 'power', 'ups:power', 'modem:power');
  await page.locator('#all-missions').click();
  await expect(page.locator('[data-mission="fiber"] em')).toHaveText('★★☆');
});

test('later chapters stay locked until the previous one is finished', async ({ page }) => {
  await page.locator('#missions').click();
  await expect(page.locator('[data-mission="fiber"]')).toBeEnabled();
  await expect(page.locator('[data-mission="closet"]')).toBeDisabled();
  await page.locator('#close-missions').click();
  const ids = await chapterIds(page);
  await finished(
    page,
    ids.slice(0, 10).filter(id => id !== 'fiber'),
  );
  await connect(page, 'fiber', 'isp:fiber', 'modem:fiber');
  await connect(page, 'power', 'ups:power', 'modem:power');
  await expect(page.locator('#unlocked')).toHaveText('Chapter 2 unlocked: Builds');
});

test('patch panel missions route desks through labeled jacks', async ({ page }) => {
  await finished(page, await chapterIds(page));
  await expect(page.locator('[data-inspect="patch"]')).toHaveCount(0);
  await openMission(page, 'first-jack');
  await expect(page.locator('[data-inspect="patch"]')).toBeVisible();
  await connect(page, 'ethernet', 'switch:eth', 'pc:eth');
  await expect(page.locator('#feedback')).toContainText('through the patch panel');
  await connect(page, 'ethernet', 'switch:eth', 'patch:j1');
  await expect(page.locator('#count')).toHaveText('0 / 1 tasks');
  await connect(page, 'ethernet', 'switch:eth', 'patch:j2');
  await expect(page.locator('#complete')).toBeVisible();
});

test('sound toggle remembers its setting', async ({ page }) => {
  await expect(page.locator('#sound')).toHaveText('Sound: off');
  await page.locator('#sound').click();
  await expect(page.locator('#sound')).toHaveText('Sound: on');
  await page.reload();
  await expect(page.locator('#sound')).toHaveText('Sound: on');
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test('the page does not scroll sideways and a mission can be played', async ({ page }) => {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);
    await expect(page.locator('.mission')).toBeInViewport();
    await connect(page, 'fiber', 'isp:fiber', 'modem:fiber');
    await connect(page, 'power', 'ups:power', 'modem:power');
    await expect(page.locator('#complete')).toBeVisible();
  });
});
