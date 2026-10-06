const { chromium, expect } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  const errors = [], writes = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(r.method())) writes.push(r.url()); });
  await page.goto('http://127.0.0.1:3000/teste/avatar');
  const preview = page.getByRole('region', { name: 'Prévia do personagem' }).getByRole('img');
  const skins = [['Pele clara','#f6d8b7'],['Pele bege','#eac095'],['Pele dourada','#dba071'],['Pele castanha','#b97950'],['Pele marrom','#885638'],['Pele retinta','#593d32']];
  const outfits = [['Túnica clássica','tunic'],['Armadura heroica','armor'],['Manto do Egeu','cape']];
  const hats = [['Coroa de louros','laurel'],['Elmo grego','helmet'],['Chapéu de viajante','hat']];
  let combinations = 0;
  for (const [skin,color] of skins) {
    await page.getByRole('button', {name:skin,exact:true}).click();
    for (const [outfit,id] of outfits) {
      await page.getByRole('button', {name:outfit,exact:true}).click();
      for (const [hat,head] of hats) {
        await page.getByRole('button', {name:hat,exact:true}).click();
        await expect(preview.locator('[data-layer=body]')).toHaveAttribute('fill',color);
        await expect(preview.locator('[data-layer=outfit]')).toHaveAttribute('data-outfit',id);
        await expect(preview.locator('[data-layer=headwear]')).toHaveAttribute('data-headwear',head);
        await expect(page.getByRole('button',{name:hat,exact:true})).toHaveAttribute('aria-pressed','true');
        combinations++;
      }
    }
  }
  await page.getByRole('button',{name:'Esse sou eu!',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Combinação pronta');
  await page.getByRole('button',{name:'Restaurar avatar inicial'}).click();
  await expect(preview.locator('[data-layer=outfit]')).toHaveAttribute('data-outfit','tunic');
  await expect(preview.locator('[data-layer=body]')).toHaveAttribute('fill','#dba071');
  await expect(preview.locator('[data-layer=headwear]')).toHaveAttribute('data-headwear','laurel');
  await page.getByRole('button',{name:'Surpreenda-me'}).click();
  await expect(preview.locator('[data-layer=outfit]')).not.toHaveAttribute('data-outfit','tunic');
  await page.reload();
  await expect(preview.locator('[data-layer=outfit]')).toHaveAttribute('data-outfit','tunic');
  await page.locator('summary').click();
  const frames = await page.locator('details svg[viewBox]').evaluateAll(xs => xs.filter(x=>x.querySelector('[data-layer]')).map(x=>x.getAttribute('viewBox')));
  if(frames.length!==4 || frames.some(f=>f!=='0 0 320 400')) throw new Error('Inconsistent modular coordinates');
  await page.locator('summary').click();
  await page.screenshot({path:'validation/avatar-study/interactive-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Armadura heroica',exact:true}).click();
  await page.getByRole('button',{name:'Elmo grego',exact:true}).click();
  await page.screenshot({path:'validation/avatar-study/interactive-armor.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Manto do Egeu',exact:true}).click();
  await page.getByRole('button',{name:'Chapéu de viajante',exact:true}).click();
  await expect(preview.locator('[data-layer=outfit]')).toHaveAttribute('data-outfit','cape');
  await page.screenshot({path:'validation/avatar-study/interactive-mobile.png',fullPage:true});
  if(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth)) throw new Error('Horizontal overflow');
  await page.getByRole('button',{name:'Pele clara',exact:true}).focus();
  await page.keyboard.press('Enter');
  await expect(preview.locator('[data-layer=body]')).toHaveAttribute('fill','#f6d8b7');
  await page.getByRole('button',{name:'Pele bege',exact:true}).focus();
  await page.keyboard.press('Space');
  await expect(preview.locator('[data-layer=body]')).toHaveAttribute('fill','#eac095');
  if(errors.length || writes.length) throw new Error(JSON.stringify({errors,writes}));
  console.log(JSON.stringify({combinations, mobile:'passed',keyboard:'passed',reset:'passed',shuffle:'passed',reloadResetsState:true,modularFrames:frames,errors,writes}));
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
