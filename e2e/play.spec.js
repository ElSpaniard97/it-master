import { test, expect } from '@playwright/test';

const port = (page, key) => page.locator(`[data-key="${key}"]`);
const cable = (page, id) => page.locator(`[data-cable="${id}"]`);
async function connect(page, cableId, a, b) {
  await cable(page, cableId).click();
  await port(page, a).click();
  await port(page, b).click();
}
async function openMission(page, id) {
  await page.locator('#missions').click();
  await page.locator(`[data-mission="${id}"]`).click();
}

test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => {
    throw error;
  });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('first mission can be finished with a perfect score', async ({ page }) => {
  await expect(page.locator('#mission-title')).toHaveText('Light up the fiber');
  await connect(page, 'fiber', 'isp:fiber', 'modem:fiber');
  await expect(page.locator('#count')).toHaveText('1 / 2 tasks');
  await connect(page, 'power', 'ups:power', 'modem:power');
  await expect(page.locator('#complete')).toBeVisible();
  await expect(page.locator('#result')).toContainText('★ Perfect');
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
  await expect(page.locator('[data-mission="fiber"] em')).toHaveText('✓');
});
