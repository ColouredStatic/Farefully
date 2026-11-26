// Launch-ready guardrails: weekly dinner variety and honest price estimates.
// Synthetic households only; no customer data, billing changes or external price requests.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../app/index.html',import.meta.url),'utf8');
const raw=readFileSync(new URL('../app/app.js',import.meta.url),'utf8');
const stripped=raw.replace(/\bbootstrapFarefully\(\);\s*$/,'');
assert.notEqual(stripped,raw,'Test should run without network login');
const el={style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},dataset:{},
 value:'',checked:false,innerHTML:'',textContent:'',addEventListener(){},setAttribute(){},querySelectorAll(){return []}};
const store=new Map();
const ctx=vm.createContext({
 document:{documentElement:el,body:el,getElementById:()=>el,querySelectorAll:()=>[],querySelector:()=>el,addEventListener(){}},
 window:{addEventListener(){},location:{reload(){}}},
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
 navigator:{},console:{warn(){},error(){},log(){}},setTimeout:()=>0,clearTimeout(){},
 fetch:async()=>{throw Error('Network requests blocked in regression test')}
});
vm.runInContext(stripped,ctx);
const run=code=>vm.runInContext(code,ctx,{timeout:20000});
run("FAREFULLY_FEATURES={plus:true,may_generate_14_day:true,paid_plan_limits_live:true,available:true}");
assert.match(html,/id="basketBudgetInsights"/,'Basket should explain how estimates are assembled');
assert.match(html,/app\.js\?v=1201/,'Release must invalidate the cached planner JavaScript');
assert.match(raw,/Model difference/,'Retailer model comparisons must not claim real savings');
assert.match(raw,/hasFreshRetailerRows\(x\.name\)/,'No live badge on stale price data');
assert.match(raw,/No current supermarket price matches/,'No real-time pricing claims from stale data');
assert.match(raw,/function weeklyVarietyPenalty/,'Weekly staple/protein diversity needs to be scored');
assert.equal(run("liveRowFresh({fetchedAt:new Date(Date.now()+86400000).toISOString()})"),false,'Future-dated records cannot count as current');
assert.equal(run("liveRowFresh({fetchedAt:new Date(Date.now()-3600000).toISOString()})"),true,'Recent records count as fresh');
const stale=run("hasFreshRetailerRows('Aldi')");assert.equal(stale,false);
run("LIVE_ROWS=[{retailer:'Aldi',fetchedAt:'2026-10-08T19:35:00Z',price:1,productName:'Test product',packSize:'500g'}]");
assert.equal(run("hasFreshRetailerRows('Aldi')"),false,'October product prices cannot be shown as fresh for a November launch');
const oldSnapshot=JSON.parse(readFileSync(new URL('../app/live-prices.json',import.meta.url),'utf8'));
assert.ok(oldSnapshot.length>10,'Historical snapshot should be present for an expiry regression');
assert.ok(oldSnapshot.every(row=>Number.isFinite(Date.parse(row.fetchedAt))&&row.price>0&&row.url),'Every repository price needs a source, valid timestamp and positive price');
const expiredSnapshot=oldSnapshot.map(row=>({...row,fetchedAt:'2026-10-08T19:35:00Z',scrapedAt:undefined,updatedAt:undefined}));
run('state=def();LIVE_ROWS='+JSON.stringify(expiredSnapshot)+';OFFER_CACHE.key=""');
assert.equal(run("weeklyOffers('Aldi').length"),0,'Stale October promotional rows must not be advertised as live November offers');
run("LIVE_ROWS=[];state=def()");
const local=JSON.parse(run("JSON.stringify({rice:D.find(m=>mealStaple(m)==='rice'&&mealProtein(m)==='Chicken')?.id,alternative:D.find(m=>mealStaple(m)!=='rice'&&mealProtein(m)==='Beef')?.id})"));
assert.ok(local.rice&&local.alternative,'Expected different staple/protein test dinners');
const repeated=run("weeklyVarietyPenalty(D.find(m=>m.id==="+JSON.stringify(local.rice)+"),1,["+JSON.stringify(local.rice)+","+JSON.stringify(local.rice)+"],new Map(D.map(x=>[x.id,x])))");
const alternative=run("weeklyVarietyPenalty(D.find(m=>m.id==="+JSON.stringify(local.alternative)+"),1,["+JSON.stringify(local.rice)+","+JSON.stringify(local.alternative)+"],new Map(D.map(x=>[x.id,x])))");
assert.ok(repeated>alternative,'Consecutive matching protein/staple should receive a stronger penalty');
for(const days of [7,14]){
 for(const priority of ['variety','budget','balance']){
  run("state=def();state.days="+days+";state.adults=2;state.children=3;state.supermarket='Aldi';state.budget=10000;state.useWeeklyOffers=false;state.priority="+JSON.stringify(priority)+";state.taste.ingredients.polenta=-2;build()");
  const meals=JSON.parse(run("JSON.stringify(state.plan.map((id,i)=>({id,protein:mealProtein(meal(i)),staple:mealStaple(meal(i)),styles:mealStyles(meal(i)),blocked:hardBlocked(meal(i))})))"));
  assert.equal(meals.length,days,'Plan should fill '+days+' days for '+priority);
  assert.equal(new Set(meals.map(x=>x.id)).size,days,'Avoid identical dinners for '+priority);
  assert.ok(meals.every(m=>!m.blocked),'Strict exclusions were bypassed');
  for(let w=0;w<days/7;w++){
   const week=meals.slice(w*7,w*7+7);
   for(const side of ['wedges','chips']){
    assert.ok(week.filter(m=>m.styles.includes(side)).length<=1,'Repeat '+side+' week '+w);
   }
  }
 }
}
// Budget swaps rank whole-basket estimated reductions ahead of cost increases.
assert.equal(run("compareSwapOptions({delta:-4,fit:60},{delta:2,fit:99},true)"),-1);
assert.ok(run("compareSwapOptions({delta:-4,fit:60},{delta:-1,fit:99},true)")<0);
assert.ok(run("compareSwapOptions({delta:-4,fit:60},{delta:2,fit:99},false)")>0);
assert.match(raw,/Estimated whole basket:/);
assert.match(html,/id="wholeShopBudgetForm"/);
assert.deepEqual(JSON.parse(run("JSON.stringify(wholeShopBudgetEstimate(83.42,25,100))")),{combined:108.42,remaining:-8.42});
assert.deepEqual(JSON.parse(run("JSON.stringify(wholeShopBudgetEstimate(83.42,10,100))")),{combined:93.42,remaining:6.58});
assert.match(html,/id="ffSurplusIdeas"/);
assert.match(html,/id="ffReceiptComparison"/);
assert.deepEqual(JSON.parse(run("JSON.stringify(receiptComparison({actual:8300,budget:10000,estimate:8000}))")),{actual:8300,budget:10000,estimate:8000,budgetDifference:1700,estimateDifference:-300});
assert.equal(run("receiptComparison({actual:-1,budget:100,estimate:100})"),null);
run("state=def();state.supermarket='Aldi';state.pantry={rice:900};globalThis.reuseMeal=allDinners().find(m=>!hardBlocked(m)&&Object.keys(effectiveIngredients(m.i)).length>1)");
const reuseBefore=run("JSON.stringify(state)");
run("globalThis.reuseRows=Object.entries(effectiveIngredients(reuseMeal.i)).map(([id,q])=>({id,surplus:q*pf()}))");
assert.ok(run("surplusMealOptions(reuseRows).some(x=>x.total===0)"));
assert.equal(run("JSON.stringify(state)"),reuseBefore,'Reuse preview must not consume pantry stock or edit the plan');
assert.equal(run("surplusMealOptions([]).length"),0);
run("state.ratings[reuseMeal.id]='never'");
assert.ok(run("surplusMealOptions(reuseRows).every(x=>x.id!==reuseMeal.id)"));
assert.match(html,/id="ffBasketReview"/);
run("state=def();state.plan=[]");
const review=JSON.parse(run("JSON.stringify(basketReviewRows({rice:{line:2,packs:2},bread:{line:1,packs:1}},{rice:P.rice.pack*1.5,bread:P.bread.pack/2},{rice:P.rice.pack/4}))"));
assert.equal(review.length,2);assert.equal(review[0].id,'rice');
assert.equal(review[0].surplus,run("P.rice.pack*.75"));
assert.equal(review[0].unusedValue,.75);
assert.equal(run("basketReviewRows({rice:{line:2,packs:1}},{rice:P.rice.pack*2},{})[0].surplus"),null);
assert.equal(run("basketReviewRows({rice:{line:2,packs:1,live:true,liveQuote:{items:[{packs:2,row:{_qty:250}},{packs:1,row:{_qty:100}}]}}},{rice:450},{})[0].surplus"),150);
assert.equal(run("state.checked={rice:true};basketReviewLocked()"),true);
assert.equal(run("state.checked={};state.trolley={};basketReviewLocked()"),true);
assert.equal(run("state.trolley=null;basketReviewLocked()"),false);
assert.match(html,/id="ffPackedLunchMode"/);
run("state=def();state.supermarket='Aldi';state.budget=100;build();state.packedLunchMode=true;calc()");
assert.equal(run("state.plan.length"),7);
assert.ok(run("Array.from({length:7},(_,i)=>slotFor(lunch,i)).every(m=>m&&PACKED_LUNCH_NAMES.has(m.n)&&!objectBlocked(m.i,m.n))"));
assert.ok(run("state.need.bread>0||state.need.wraps>0"));
run("state.dietPattern='vegan';state.allergens=['gluten','sesame'];state.taste.ingredients.cheese=-2");
assert.ok(run("Array.from({length:7},(_,i)=>slotFor(lunch,i)).every(m=>!m||!objectBlocked(m.i,m.n))"));
run("state=def();delete state.packedLunchMode;normalizeState()");
assert.equal(run("state.packedLunchMode"),false);
assert.match(html,/id="ffFamilyAllowance"/);
assert.equal(run("familyAllowanceTotal(['12.50','10','15','4','8.25',''])"),49.75);
assert.equal(run("familyAllowanceTotal(['0.10','0.20','','','',''])"),0.30);
assert.equal(run("familyAllowanceTotal(['-1','','','','',''])"),null);
assert.equal(run("familyAllowanceTotal(['0.001','','','','',''])"),null);
assert.equal(run("familyAllowanceTotal(['4000','2000','','','',''])"),null);
assert.equal(run("normaliseExtrasAllowance(-10)"),0);
assert.equal(run("normaliseExtrasAllowance(Infinity)"),0);
assert.equal(run("state=def();delete state.extrasAllowance;normalizeState();state.extrasAllowance"),0);
assert.equal(run("state=def();state.budget=25;state.extrasAllowance=10;mealBudgetTarget()"),15);
assert.equal(run("state.budget=0;mealBudgetTarget()"),0);
assert.equal(run("state=def();state.supermarket='Aldi';state.pantry={rice:P.rice.pack};modelPackIncrement({}, {rice:P.rice.pack/pf()}, 'Aldi')"),0,'Owned pack should cover the ingredient');
assert.equal(run("state.pantry={};modelPackIncrement({rice:P.rice.pack/2},{rice:P.rice.pack/(2*pf())},'Aldi')"),0,'Shared pack should cover both meals without a second purchase');
run("state=def();state.supermarket='Aldi';state.budget=10000;state.priority='balance';state.taste.ingredients.polenta=-2;build();state.budget=0;calc()");
const beforePlan=run("JSON.stringify(state.plan)"), beforeCost=run("state.total");
run("previewBudgetRescue()");
assert.equal(run("JSON.stringify(state.plan)"),beforePlan,'Preview cannot change the saved plan');
assert.equal(run("state.total"),beforeCost,'Preview must restore the full basket');
if(run("!!budgetRescuePreview")){
 assert.ok(run("budgetRescuePreview.after<budgetRescuePreview.before"));
 assert.ok(run("budgetRescuePreview.candidate.every(id=>!hardBlocked(allDinners().find(m=>m.id===id)))"));
 run("state.checked={rice:true};applyBudgetRescue()");
 assert.equal(run("JSON.stringify(state.plan)"),beforePlan,'Reject stale preview once shopping has started');
}
run("state=def();state.setupComplete=state.tasteComplete=state.dietComplete=true;state.supermarket='Aldi';state.budget=100;state.taste.ingredients.polenta=-2;build()");
const usual=run("JSON.stringify(state)");
for(const days of [1,3,6]){
 const p=JSON.parse(run("JSON.stringify(createPaydayPreview("+days+",25,5))"));
 assert.equal(p.plan.length,days);
 assert.equal(p.cash,25);assert.equal(p.reserve,5);
 assert.equal(run("JSON.stringify(state)"),usual,'Preview cannot mutate usual plan or budget');
 assert.ok(p.plan.every(id=>run("!hardBlocked(allDinners().find(m=>m.id==="+JSON.stringify(id)+"))")));
}
assert.equal(run("createPaydayPreview(3,10,20)"),null);
assert.equal(run("createPaydayPreview(7,25,0)"),null);
run("state.checked={rice:true}");
assert.equal(run("createPaydayPreview(3,25,0)"),null);
run("state.checked={};state.paydayBackup={days:7,budget:100,extrasAllowance:0,priority:'balance',plan:state.plan.slice()};state.days=3;normalizeState()");
assert.equal(run("state.days"),3,'Saved short plan survives normalisation');
assert.match(html,/id="paydayPanel"/);
assert.equal(run("actualPennies('2.49')"),249);
assert.equal(run("actualPennies('0')"),0);
assert.equal(run("actualPennies('')"),null);
assert.equal(run("actualPennies('-1')"),null);
assert.equal(run("actualPennies('2.499')"),null);
run("state=def();state.basket={rice:{line:1}};state.shoppingExtras=[{id:'soap',name:'Soap'}];state.trolley={budget:2500,estimate:2300,retailer:'Aldi',lines:[]}");
assert.equal(run("setActualLine('rice',249)"),true);
assert.equal(run("setActualLine('rice',199)"),true);
assert.equal(run("setActualLine('extra:soap',150)"),true);
assert.equal(run("trolleyTotal()"),349,'Edit replaces price; extras count in actual total');
assert.equal(run("setActualLine('unknown',200)"),false);
assert.equal(run("recordActualReceipt(420,'2026-11-25T12:00:00Z')"),true);
assert.equal(run("state.trolley"),null);
assert.equal(run("state.receiptHistory[0].actual"),420);
assert.equal(run("state.receiptHistory[0].budget"),2500);
assert.equal(run("state.receiptHistory[0].estimate"),2300);
assert.match(html,/id="actualTrolleyPanel"/);
run("state=def();state.supermarket='Aldi';state.pantry={};state.taste.ingredients.polenta=-2;globalThis.cupTest=allDinners().find(m=>!hardBlocked(m)&&Object.keys(effectiveIngredients(m.i)).length>1)");
assert.ok(run("cupboardMealQuote(cupTest).total>0"));
run("state.pantry=Object.fromEntries(Object.entries(effectiveIngredients(cupTest.i)).map(([id,q])=>[id,q*pf()]))");
assert.equal(run("cupboardMealQuote(cupTest).total"),0,'Exact pantry stock covers all listed ingredients');
assert.ok(run("cupboardMealOptions(0).some(x=>x.id===cupTest.id)"));
const pantryBefore=run("JSON.stringify(state.pantry)");
run("cupboardMealOptions(500)");
assert.equal(run("JSON.stringify(state.pantry)"),pantryBefore,'Browsing alternatives cannot deduct stock');
run("globalThis.shortKey=Object.keys(effectiveIngredients(cupTest.i))[0];state.pantry[shortKey]=0");
assert.ok(run("cupboardMealQuote(cupTest).total>0"));
assert.ok(run("cupboardMealQuote(cupTest).missing.some(x=>x.id===shortKey&&x.packs>=1)"));
run("state.ratings[cupTest.id]='never'");
assert.equal(run("cupboardMealQuote(cupTest)"),null);
assert.match(html,/id="cupboardMealPanel"/);
assert.match(raw,/Average planned grocery cost per day/);
assert.match(raw,/function chooseSwap\(id\)\{const candidate=allDinners\(\).find\(m=>m.id===id\);if\(!candidate\|\|hardBlocked\(candidate\)/);
console.log('Farefully launch variety/budget checks passed: 7/14-day choices, strict exclusions, stale-price labels, model explanations, budget swap ranking.');
