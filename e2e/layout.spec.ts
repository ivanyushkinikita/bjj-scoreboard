import {test,expect,type Page} from '@playwright/test';
async function assertScoreFits(page:Page){
  for(const side of ['A','B']){
    const score=page.getByTestId(`score-${side}`), panel=score.locator('..');
    const frame=await score.boundingBox(), number=await score.locator('span').boundingBox(), stats=await panel.locator('.stats').boundingBox();
    expect(number!.height).toBeGreaterThan(20);
    expect(number!.y).toBeGreaterThanOrEqual(frame!.y-1);
    expect(number!.y+number!.height).toBeLessThanOrEqual(frame!.y+frame!.height+1);
    expect(number!.x).toBeGreaterThanOrEqual(frame!.x-1);
    expect(number!.x+number!.width).toBeLessThanOrEqual(frame!.x+frame!.width+1);
    expect(stats!.y-(number!.y+number!.height)).toBeGreaterThanOrEqual(10);
  }
}
test('large submission beside timer and score numerals stay above stats at supported sizes',async({page,context})=>{
  await page.goto('/');
  await page.getByLabel('Спортсмен A',{exact:true}).fill('Александр Иванов');
  await page.getByLabel('Спортсмен B',{exact:true}).fill('Максим Петров');
  await page.getByRole('button',{name:'СОЗДАТЬ СХВАТКУ'}).click();
  const popup=context.waitForEvent('page');await page.getByRole('button',{name:'Открыть зрительское табло'}).click();const display=await popup;
  for(let i=0;i<25;i++)await page.getByLabel('A: плюс 4',{exact:true}).click();
  await page.getByLabel('B: плюс 4',{exact:true}).click();
  await expect(display.getByTestId('score-A')).toHaveText('100');
  for(const [width,height] of [[1000,680],[1366,768],[1920,1080]]){
    await page.setViewportSize({width,height});
    await assertScoreFits(page);
    const button=await page.getByRole('button',{name:'Сабмишн',exact:true}).boundingBox(),timer=await page.getByLabel('Изменить оставшееся время').boundingBox();
    expect(button!.width).toBeGreaterThanOrEqual(180);expect(button!.height).toBeGreaterThanOrEqual(76);
    expect(button!.x).toBeGreaterThan(timer!.x+timer!.width);
    expect(button!.x+button!.width).toBeLessThan(width);
    expect(Math.abs(button!.y+button!.height/2-(timer!.y+timer!.height/2))).toBeLessThan(40);
    await page.screenshot({path:`test-results/layout-control-${width}.png`});
  }
  for(const [width,height] of [[800,500],[1280,720],[1920,1080]]){
    await display.setViewportSize({width,height});await assertScoreFits(display);
    await expect(display.getByRole('button',{name:'Сабмишн',exact:true})).toHaveCount(0);
    await display.screenshot({path:`test-results/layout-display-${width}.png`});
  }
  await page.getByRole('button',{name:'Сабмишн',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Победа сабмишном'})).toBeVisible();
});
