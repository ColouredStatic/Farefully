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
  // Exercise preview, explicit apply and restore on the actual mobile page.
  await page.evaluate(()=>{
   state.setupComplete=state.tasteComplete=state.dietComplete=true;
   state.checked={};state.plan=D.filter(m=>!hardBlocked(m)).slice(0,7).map(m=>m.id);state.days=7;state.budget=100;state.extrasAllowance=10;calc();renderPayday();
  });
  const regular=await page.evaluate(()=>JSON.stringify([state.plan,state.days,state.budget,state.extrasAllowance]));
  const payday=page.locator('#paydayPanel');
  await payday.locator('#paydayDays').selectOption('3');
  await payday.locator('#paydayCash').fill('25');
  await payday.locator('#paydayReserve').fill('5');
  await payday.locator('#previewPayday').click();
  await page.waitForFunction(()=>document.getElementById('paydayMessage').textContent.includes('estimated for 3 day'));
  assert.equal(await page.evaluate(()=>JSON.stringify([state.plan,state.days,state.budget,state.extrasAllowance])),regular);
  const pb=await payday.evaluate(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,scroll:el.scrollWidth,client:el.clientWidth,viewport:document.documentElement.clientWidth}));
  assert.ok(pb.left>=0&&pb.right<=pb.viewport+1&&pb.scroll<=pb.client+1,'Payday controls overflow at '+width);
  await payday.locator('#applyPayday').click();
  assert.deepEqual(await page.evaluate(()=>[state.plan.length,state.days,state.budget,state.extrasAllowance,!!state.paydayBackup]),[3,3,25,5,true]);
  await page.evaluate(()=>go('basket'));
  await payday.locator('#restoreRegularPlan').click();
  assert.equal(await page.evaluate(()=>JSON.stringify([state.plan,state.days,state.budget,state.extrasAllowance])),regular);
  assert.equal(await page.evaluate(()=>state.paydayBackup),null);
  // Exercise the new home shortcuts, household lunch mode and basket review.
  await page.evaluate(()=>{go('home');render();});
  await page.locator('#ffQuickBasket').click();
  assert.equal(await page.locator('#basket').evaluate(el=>el.classList.contains('active')),true);
  await page.locator('#wholeShopBudgetForm #ffFamilyAllowance summary').click();
  await page.locator('#ffFamilyCost0').fill('12.50');
  await page.locator('#ffFamilyCost2').fill('5.25');
  await page.locator('#ffFamilyAllowanceUse').click();
  assert.equal(await page.locator('#extrasAllowance').inputValue(),'17.75');
  await form.getByRole('button',{name:'Save allowance'}).click();
  assert.equal(await page.evaluate(()=>state.extrasAllowance),17.75);
  await page.evaluate(()=>go('plan'));
  await page.locator('#ffPackedLunchMode').check();
  assert.equal(await page.evaluate(()=>state.packedLunchMode),true);
  assert.ok(await page.evaluate(()=>state.plan.every((_,i)=>{const m=slotFor(lunch,i);return !m||PACKED_LUNCH_NAMES.has(m.n)})));
  await page.evaluate(()=>go('basket'));
  const review=page.locator('#ffBasketReview');
  await review.locator('summary').first().click();
  assert.ok(await page.locator('#ffCostDrivers .ff-review-row').count()>0);
  assert.ok(await page.locator('#ffPackSurplus').innerText());
  assert.ok(await page.locator('#ffSurplusIdeas').innerText());
  const rb=await review.evaluate(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,scroll:el.scrollWidth,client:el.clientWidth,viewport:document.documentElement.clientWidth}));
  assert.ok(rb.left>=0&&rb.right<=rb.viewport+1&&rb.scroll<=rb.client+1,'Smart review overflows at '+width+': '+JSON.stringify(rb));
  if(width===390){await review.screenshot({path:'test-results/smart-basket-mobile.png'});}
  // Actual trolley: edit a price, include an extra, record checkout total.
  page.on('dialog',d=>d.accept());
  await page.evaluate(()=>{state.shoppingExtras=[{id:'testsoap',name:'Soap'}];render();});
  const trolley=page.locator('#actualTrolleyPanel');
  await trolley.locator('#startActualTrolley').click();
  const key=await page.evaluate(()=>Object.keys(state.basket)[0]);
  await trolley.locator('#actualItem').selectOption(key);
  await trolley.locator('#actualItemPrice').fill('4.49');
  await trolley.getByRole('button',{name:'Save item price'}).click();
  await trolley.locator('#actualItemPrice').fill('3.49');
  await trolley.getByRole('button',{name:'Save item price'}).click();
  await trolley.locator('#actualItem').selectOption('extra:testsoap');
  await trolley.locator('#actualItemPrice').fill('1.25');
  await trolley.getByRole('button',{name:'Save item price'}).click();
  assert.equal(await page.evaluate(()=>trolleyTotal()),474);
  assert.match(await trolley.locator('#actualTrolleySummary').innerText(),/£4\.74/);
  const tb=await trolley.evaluate(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,scroll:el.scrollWidth,client:el.clientWidth,viewport:document.documentElement.clientWidth}));
  assert.ok(tb.left>=0&&tb.right<=tb.viewport+1&&tb.scroll<=tb.client+1,'Trolley controls overflow at '+width);
  await trolley.locator('#actualReceiptTotal').fill('5.10');
  await trolley.getByRole('button',{name:'Record final shop'}).click();
  assert.equal(await page.evaluate(()=>state.trolley),null);
  assert.equal(await page.evaluate(()=>JSON.parse(store.get(sk(active))).receiptHistory[0].actual),510);
  assert.match(await trolley.locator('#actualReceiptHistory').innerText(),/£5\.10/);
  assert.match(await trolley.locator('#ffReceiptComparison').innerText(),/£5\.10/);
  // Cupboard meals use exact quantities and open a recipe without replacing the plan.
  const cupboard=await page.evaluate(()=>{
   const m=allDinners().find(x=>!hardBlocked(x));state.pantry=Object.fromEntries(Object.entries(effectiveIngredients(m.i)).map(([id,q])=>[id,q*pf()]));render();go('pantry');return {id:m.id,name:m.n,plan:JSON.stringify(state.plan),pantry:JSON.stringify(state.pantry)};
  });
  const panel=page.locator('#cupboardMealPanel');
  await panel.locator('#cupboardMealLimit').fill('0');
  await page.waitForFunction(()=>document.getElementById('cupboardMealResults').textContent.includes('£0 estimated top-up'));
  const cb=await panel.evaluate(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,scroll:el.scrollWidth,client:el.clientWidth,viewport:document.documentElement.clientWidth}));
  assert.ok(cb.left>=0&&cb.right<=cb.viewport+1&&cb.scroll<=cb.client+1,'Cupboard controls overflow at '+width);
  await panel.getByRole('button',{name:'View recipe'}).first().click();
  assert.equal(await page.locator('#recipe').evaluate(el=>el.classList.contains('active')),true);
  assert.equal(await page.evaluate(()=>JSON.stringify(state.plan)),cupboard.plan);
  assert.equal(await page.evaluate(()=>JSON.stringify(state.pantry)),cupboard.pantry);
  await page.locator('#recipe .recipeback').click();
  assert.equal(await page.locator('#pantry').evaluate(el=>el.classList.contains('active')),true);
  await page.close();
 }
}finally{await browser.close();}
console.log('Whole-shop budget browser checks passed at 320, 390 and 768px.');
