// Browser check with synthetic household only; no external network or billing.
import assert from 'node:assert/strict';
import {readFileSync, mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
const html=readFileSync(new URL('../app/index.html',import.meta.url),'utf8');
const raw=readFileSync(new URL('../app/app.js',import.meta.url),'utf8');
const app=raw.replace(/\bbootstrapFarefully\(\);\s*$/,'');
assert.notEqual(app,raw);
const browser=await chromium.launch({headless:true});
try{
 for(const width of [320,390,768]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:width<500,deviceScaleFactor:1,hasTouch:width<500});
  await page.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.origin!=='http://farefully.test')return route.abort();
   if(u.pathname==='/app/')return route.fulfill({contentType:'text/html',body:html});
   if(u.pathname==='/app/app.js')return route.fulfill({contentType:'text/javascript',body:app});
   if(['/app/onboarding-polish.css','/app/onboarding-polish.js','/app/nutrition-data.js'].includes(u.pathname)){
     return route.fulfill({contentType:u.pathname.endsWith('.css')?'text/css':'text/javascript',body:readFileSync(new URL('..'+u.pathname,import.meta.url),'utf8')});
   }
   return route.abort();
  });
  await page.goto('http://farefully.test/app/',{waitUntil:'load'});
  await page.evaluate(()=>{
   state=def();active='synthetic_mobile_test';state.supermarket='Aldi';state.plan=[D.find(m=>!hardBlocked(m)).id];calc();state.budget=state.total+10;
   document.getElementById('cloudAccountGate').style.display='none';
   document.querySelectorAll('.overlay,.welcome').forEach(x=>x.classList.remove('show'));
   go('basket');renderWholeShopBudget(true);
  });
  const form=page.locator('#wholeShopBudgetForm');
  await form.locator('#extrasAllowance').fill('25');
  await form.getByRole('button',{name:'Save allowance'}).click();
  await page.waitForFunction(()=>document.getElementById('wholeShopBudgetResult').textContent.includes('£15.00 above target'));
  assert.ok((await form.innerText()).includes(await page.evaluate(()=>money(state.total+25))),'Combined estimate must include the real calculated recipe basket and reserve');
  assert.equal(await page.locator('#budgetRescuePanel').isVisible(),true);
  const bounds=await form.evaluate(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,scroll:el.scrollWidth,client:el.clientWidth,viewport:document.documentElement.clientWidth}));
  assert.ok(bounds.left>=0&&bounds.right<=bounds.viewport+1&&bounds.scroll<=bounds.client+1,'Budget form overflows at width '+width+': '+JSON.stringify(bounds));
  assert.equal(await page.evaluate(()=>JSON.parse(store.get(sk(active))).extrasAllowance),25,'Allowance should persist in synthetic household');
  if(width===390){mkdirSync('test-results',{recursive:true});await form.screenshot({path:'test-results/whole-shop-mobile.png'});}
  await page.close();
 }
}finally{await browser.close();}
console.log('Whole-shop budget browser checks passed at 320, 390 and 768px.');
