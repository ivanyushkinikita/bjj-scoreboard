import {test,expect,type Page} from '@playwright/test';
async function noScroll(page:Page){
 expect(await page.evaluate(()=>({x:scrollX,y:scrollY,width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,viewportWidth:innerWidth,viewportHeight:innerHeight}))).toEqual(expect.objectContaining({x:0,y:0}));
 const dimensions=await page.evaluate(()=>[document.documentElement.scrollWidth-innerWidth,document.documentElement.scrollHeight-innerHeight]);expect(dimensions).toEqual([0,0]);
 const scrollers=await page.evaluate(()=>[...document.querySelectorAll('.match *')].filter(e=>{const css=getComputedStyle(e);return e.clientHeight>0&&((/auto|scroll/.test(css.overflowY)&&e.scrollHeight>e.clientHeight+1)||(/auto|scroll/.test(css.overflowX)&&e.scrollWidth>e.clientWidth+1));}).map(e=>e.className));expect(scrollers).toEqual([]);
}
test('score buttons do not introduce scrolling or move the match screen',async({page,context})=>{
 await page.goto('/');await page.getByLabel('Спортсмен A',{exact:true}).fill('Иван');await page.getByLabel('Спортсмен B',{exact:true}).fill('Пётр');await page.getByRole('button',{name:'СОЗДАТЬ СХВАТКУ'}).click();
 const popup=context.waitForEvent('page');await page.getByRole('button',{name:'Открыть зрительское табло'}).click();const display=await popup;
 for(const [width,height] of [[1000,680],[1366,768],[1920,1080]]){
  await page.setViewportSize({width,height});await display.setViewportSize({width,height});await noScroll(page);
  for(const side of ['A','B']){
   const button=page.getByLabel(`${side}: плюс 4`,{exact:true});const box=await button.boundingBox();await page.mouse.move(box!.x+box!.width/2,box!.y+box!.height/2);await page.mouse.down();await noScroll(page);await page.mouse.up();
   for(let i=0;i<25;i++)await button.click();await noScroll(page);await noScroll(display);await expect(button).toBeInViewport();
  }
  await page.keyboard.press('q');await noScroll(page);
  await page.getByRole('button',{name:'Действия и баллы'}).first().click();await page.getByRole('dialog').locator('.action-list button').first().click();await noScroll(page);
  await page.screenshot({path:`test-results/no-scroll-${width}.png`});
 }
});
