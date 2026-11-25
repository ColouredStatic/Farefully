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
assert.match(html,/app\.js\?v=1191/,'Release must invalidate the cached planner JavaScript');
assert.match(raw,/Model difference/,'Retailer model comparisons must not claim real savings');
assert.match(raw,/hasFreshRetailerRows\(x\.name\)/,'No live badge on stale price data');
assert.match(raw,/No current supermarket price matches/,'No real-time pricing claims from stale data');
assert.match(raw,/function weeklyVarietyPenalty/,'Weekly staple/protein diversity needs to be scored');
const stale=run("hasFreshRetailerRows('Aldi')");assert.equal(stale,false);
run("LIVE_ROWS=[{retailer:'Aldi',fetchedAt:'2026-10-08T19:35:00Z',price:1,productName:'Test product',packSize:'500g'}]");
assert.equal(run("hasFreshRetailerRows('Aldi')"),false,'October product prices cannot be shown as fresh for a November launch');
const oldSnapshot=JSON.parse(readFileSync(new URL('../app/live-prices.json',import.meta.url),'utf8'));
assert.ok(oldSnapshot.length>10,'Historical snapshot should be present for an expiry regression');
assert.ok(oldSnapshot.every(row=>row.fetchedAt?.startsWith('2026-10-08')),'Update the test if the repository refreshes product prices');
run('state=def();LIVE_ROWS='+JSON.stringify(oldSnapshot)+';OFFER_CACHE.key=""');
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
assert.equal(run("normaliseExtrasAllowance(-10)"),0);
assert.equal(run("normaliseExtrasAllowance(Infinity)"),0);
assert.equal(run("state=def();delete state.extrasAllowance;normalizeState();state.extrasAllowance"),0);
assert.match(raw,/Average planned grocery cost per day/);
assert.match(raw,/function chooseSwap\(id\)\{const candidate=allDinners\(\).find\(m=>m.id===id\);if\(!candidate\|\|hardBlocked\(candidate\)/);
console.log('Farefully launch variety/budget checks passed: 7/14-day choices, strict exclusions, stale-price labels, model explanations, budget swap ranking.');
