import {test,expect} from '@playwright/test';
test('last match colors and duration survive new match and restart; duration input and arrows coexist',async({page})=>{
  await page.goto('/');
  const time=page.getByLabel('Длительность схватки',{exact:true});
  await time.fill('07:35');
  await page.getByRole('button',{name:'Увеличить длительность на 1 минуту'}).click();await expect(time).toHaveValue('08:35');
  await page.getByRole('button',{name:'Уменьшить длительность на 1 минуту'}).click();await expect(time).toHaveValue('07:35');
  await page.getByLabel('Цвет спортсмена A').selectOption('red');await page.getByLabel('Цвет спортсмена B').selectOption('blue');
  await page.getByLabel('Спортсмен A',{exact:true}).fill('Иван');await page.getByLabel('Спортсмен B',{exact:true}).fill('Пётр');
  await page.getByRole('button',{name:'СОЗДАТЬ СХВАТКУ'}).click();
  await page.getByRole('button',{name:'Новая схватка',exact:true}).click();await page.getByRole('button',{name:'Подтвердить',exact:true}).click();
  await expect(time).toHaveValue('07:35');await expect(page.getByLabel('Цвет спортсмена A')).toHaveValue('red');await expect(page.getByLabel('Цвет спортсмена B')).toHaveValue('blue');
  await page.reload();await expect(time).toHaveValue('07:35');await expect(page.getByLabel('Цвет спортсмена A')).toHaveValue('red');
  await time.fill('00:01');await expect(page.getByRole('button',{name:'Уменьшить длительность на 1 минуту'})).toBeDisabled();
  await time.fill('999:59');await expect(page.getByRole('button',{name:'Увеличить длительность на 1 минуту'})).toBeDisabled();
  await time.fill('07:35');await page.screenshot({path:'test-results/saved-match-defaults.png'});
});
test('custom rules can be found and reused from Settings after restart',async({page})=>{
  await page.goto('/');await page.getByLabel('Настройки',{exact:true}).click();
  await page.getByLabel('Добавить свои правила',{exact:true}).click();
  let editor=page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Свои правила начисления очков'})});
  await editor.getByLabel('Действие',{exact:true}).fill('Удержание');await editor.getByLabel('Баллы',{exact:true}).fill('5');
  await editor.getByRole('button',{name:'Добавить действие'}).click();await editor.getByRole('button',{name:'Сохранить правила'}).click();
  await page.reload();await page.getByLabel('Настройки',{exact:true}).click();
  await page.getByRole('button',{name:'Мои сохранённые правила'}).click();
  editor=page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Свои правила начисления очков'})});
  await expect(editor.getByText('Удержание',{exact:true})).toBeVisible();await expect(editor.getByText('+5',{exact:true})).toBeVisible();
  await editor.getByRole('button',{name:'Сохранить правила'}).click();await expect(page.getByLabel('Добавить свои правила',{exact:true})).toBeChecked();
});
