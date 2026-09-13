import {test,expect} from '@playwright/test';
test('time arrows follow the cursor and preserve the active segment',async({page})=>{
  await page.goto('/');
  const time=page.getByLabel('Длительность схватки',{exact:true});
  await time.fill('07:59');await time.press('End');
  await page.getByRole('button',{name:'Увеличить длительность на 1 секунду'}).click();await expect(time).toHaveValue('08:00');
  await time.press('ArrowDown');await expect(time).toHaveValue('07:59');
  await time.press('Home');await time.press('ArrowUp');await expect(time).toHaveValue('08:59');
  await page.getByRole('button',{name:'Уменьшить длительность на 1 минуту'}).click();await expect(time).toHaveValue('07:59');
  await time.fill('99:59');await time.press('Home');await time.press('ArrowUp');await expect(time).toHaveValue('100:59');
  await time.press('ArrowUp');await expect(time).toHaveValue('101:59');
  await time.fill('00:01');await time.press('End');await time.press('ArrowDown');await expect(time).toHaveValue('00:01');
  await time.fill('999:59');await time.press('ArrowUp');await expect(time).toHaveValue('999:59');
  await time.fill('05:30');
  await page.getByLabel('Спортсмен A',{exact:true}).fill('Иван');await page.getByLabel('Спортсмен B',{exact:true}).fill('Пётр');
  await page.getByRole('button',{name:'СОЗДАТЬ СХВАТКУ'}).click();await page.getByLabel('Изменить оставшееся время').click();
  const remaining=page.getByRole('textbox',{name:/Оставшееся время/});
  await remaining.press('End');await remaining.press('ArrowUp');await expect(remaining).toHaveValue('05:31');
  await remaining.press('Home');await remaining.press('ArrowDown');await expect(remaining).toHaveValue('04:31');
});
test('submission choices retain athlete colors and setup label is centered',async({page})=>{
  await page.goto('/');await page.getByLabel('Спортсмен A',{exact:true}).fill('Иван');await page.getByLabel('Спортсмен B',{exact:true}).fill('Пётр');
  const start=page.getByRole('button',{name:'СОЗДАТЬ СХВАТКУ'});
  for(const [width,height] of [[1000,680],[1366,768],[1920,1080]]){
    await page.setViewportSize({width,height});
    const button=await start.boundingBox(),label=await start.locator('.setup-start-label').boundingBox();
    expect(button!.height).toBeGreaterThanOrEqual(64);expect(Math.abs(label!.x+label!.width/2-button!.x-button!.width/2)).toBeLessThan(1);await expect(start).toBeInViewport();
  }
  await page.screenshot({path:'test-results/setup-centered.png'});
  await page.getByLabel('Цвет спортсмена A').selectOption('red');await page.getByLabel('Цвет спортсмена B').selectOption('blue');
  await start.click();await page.getByRole('button',{name:'Сабмишн',exact:true}).click();
  const red=page.getByRole('button',{name:'КРАСНЫЙ Иван'}),blue=page.getByRole('button',{name:'СИНИЙ Пётр'});
  await expect(red).toHaveCSS('background-color','rgb(183, 42, 61)');await red.click();await expect(red).toHaveAttribute('aria-pressed','true');await expect(red).toHaveCSS('background-color','rgb(183, 42, 61)');
  await blue.click();await expect(blue).toHaveAttribute('aria-pressed','true');await expect(red).toHaveAttribute('aria-pressed','false');await expect(blue).toHaveCSS('background-color','rgb(20, 90, 195)');
  await page.screenshot({path:'test-results/submission-colors.png'});
});
