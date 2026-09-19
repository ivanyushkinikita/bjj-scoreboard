import { test, expect } from '@playwright/test';

test('defaults to red and blue, formats names, and prompts for a winner when time expires', async ({ page }) => {
  await page.goto('/');
  const colors = page.locator('.color-select select');
  await expect(colors.nth(0)).toHaveValue('red');
  await expect(colors.nth(1)).toHaveValue('blue');
  const names = page.locator('.athlete-field input');
  await names.nth(0).fill('iVAN iVANOV');
  await names.nth(1).fill('pETR pETROV');
  await expect(names.nth(0)).toHaveValue('Ivan Ivanov');
  await expect(names.nth(1)).toHaveValue('Petr Petrov');
  await page.locator('.time-input').fill('00:01');
  await page.locator('.setup-start').click();
  await page.locator('.competitor').first().locator('.score-increment').click();
  await page.locator('.clock-control').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 5000 });
  const selected = dialog.locator('.winner-option[aria-pressed="true"]');
  await expect(selected).toHaveCount(1);
  await expect(selected).toContainText('Ivan Ivanov');
});