import {test,expect} from '@playwright/test';
test('tied expiry configures a separate extra clock, syncs display and survives reload',async({page,context})=>{
  await page.goto('/');await page.getByLabel('Спортсмен A',{exact:true}).fill('Иван');await page.getByLabel('Спортсмен B',{exact:true}).fill('Пётр');await page.getByLabel('Длительность схватки',{exact:true}).fill('05:00');await page.getByRole('button',{name:'СОЗДАТЬ СХВАТКУ'}).click();
  const popup=context.waitForEvent('page');await page.getByRole('button',{name:'Открыть зрительское табло'}).click();const display=await popup;
  await page.getByLabel('A: плюс 2',{exact:true}).click();await page.getByLabel('B: плюс 2',{exact:true}).click();
  await page.getByLabel('Изменить оставшееся время').click();await page.getByRole('textbox',{name:/Оставшееся время/}).fill('00:01');await page.getByRole('button',{name:'Подтвердить изменение'}).click();await page.keyboard.press('Space');
  const modal=page.getByRole('dialog',{name:'Настроить дополнительное время'});await expect(modal).toBeVisible();await expect(display.locator('.timer')).toHaveText('00:00');
  await modal.getByRole('button',{name:'Отмена',exact:true}).click();await expect(modal).not.toBeVisible();await page.waitForTimeout(200);await expect(modal).not.toBeVisible();
  await page.getByRole('button',{name:'Настроить дополнительное время'}).click();
  const time=modal.getByRole('textbox',{name:'Длительность дополнительного времени'});await time.fill('00:00');await expect(modal.getByRole('button',{name:'Установить дополнительное время'})).toBeDisabled();
  await time.fill('01:29');await time.press('End');await time.press('ArrowUp');await expect(time).toHaveValue('01:30');await modal.getByRole('button',{name:'Установить дополнительное время'}).click();
  await expect(page.locator('.timer')).toHaveText('01:30');await expect(display.locator('.timer')).toHaveText('01:30');await expect(display.getByTestId('regulation-clock')).toHaveCount(0);await expect(display.locator('.overtime-label')).toContainText('Дополнительное время');await expect(display.getByTestId('score-A')).toHaveText('2');
  for(const surface of [page,display]){
    for(const [width,height] of surface===page?[[1000,680],[1366,768],[1920,1080]]:[[800,500],[1280,720],[1920,1080]]){
      await surface.setViewportSize({width,height});await expect(surface.getByTestId('regulation-clock')).toHaveCount(0);await expect(surface.locator('.overtime-label')).toContainText('Дополнительное время');await expect(surface.locator('.overtime-label')).toBeInViewport();
    }
  }
  await page.screenshot({path:'test-results/overtime-control.png'});await display.screenshot({path:'test-results/overtime-display.png'});
  await page.keyboard.press('Space');await expect(page.locator('.timer')).not.toHaveText('01:30');await page.keyboard.press('Space');const paused=await page.locator('.timer').innerText();await expect(display.locator('.timer')).toHaveText(paused);await expect(page.getByTestId('regulation-clock')).toHaveCount(0);
  await page.reload();await page.getByRole('button',{name:'ВОССТАНОВИТЬ СХВАТКУ'}).click();await expect(page.locator('.timer')).toHaveText(paused);await expect(page.locator('.overtime-label')).toContainText('Дополнительное время');
  await page.keyboard.press('Backspace');await page.getByRole('button',{name:'Подтвердить',exact:true}).click();await expect(page.locator('.timer')).toHaveText('01:30');
  await page.getByLabel('A: плюс 2',{exact:true}).click();await page.getByLabel('Изменить оставшееся время').click();await page.getByRole('textbox',{name:/Оставшееся время/}).fill('00:01');await page.getByRole('button',{name:'Подтвердить изменение'}).click();await page.keyboard.press('Space');await expect(page.locator('.timer')).toHaveText('00:00');await expect(modal).not.toBeVisible();await expect(page.getByRole('button',{name:'Настроить дополнительное время'})).toHaveCount(0);await page.getByRole('dialog').locator('.dialog-actions button').first().click();
  await page.getByRole('button',{name:'Новая схватка',exact:true}).click();await page.getByRole('button',{name:'Подтвердить',exact:true}).click();await expect(page.getByLabel('Длительность схватки',{exact:true})).toHaveValue('05:00');
});
