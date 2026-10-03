import { expect, test } from '@playwright/test';

test('long spectator matchup names stay within their columns at supported sizes', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Одна схватка', exact: true }).click();
  await page.getByLabel('Спортсмен A', { exact: true }).fill('ИВАНЮШКИН АНДРЕЙ');
  await page.getByLabel('Спортсмен B', { exact: true }).fill('АНДРЕЙ ИВАНЮШКИН');
  await page.getByRole('button', { name: 'СОЗДАТЬ СХВАТКУ' }).click();
  const popup = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Открыть зрительское табло' }).click();
  const display = await popup;
  const names = display.locator('.tournament-display-matchup__name');

  for (const [width, height] of [[1000, 680], [1366, 768], [1920, 1080]]) {
    await display.setViewportSize({ width, height });
    await expect(names).toHaveCount(2);
    const [left, right] = await names.all();
    const leftBox = await left.boundingBox();
    const rightBox = await right.boundingBox();
    const vsBox = await display.locator('.tournament-display-matchup__vs').boundingBox();
    expect(leftBox).not.toBeNull();
    expect(rightBox).not.toBeNull();
    expect(vsBox).not.toBeNull();
    expect(leftBox!.x + leftBox!.width).toBeLessThanOrEqual(vsBox!.x + 1);
    expect(rightBox!.x).toBeGreaterThanOrEqual(vsBox!.x + vsBox!.width - 1);
    for (const name of [left, right]) {
      expect(await name.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    }
  }
});
