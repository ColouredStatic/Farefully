// Farefully Free/Plus planning gate regression. Synthetic households only.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync(new URL('../app/app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../app/index.html',import.meta.url),'utf8');
new vm.Script(app);
assert.match(html,/id="planDays"/);
assert.match(html,/id="planAccessNote"/);
assert.match(html,/id="savedFortnightNote"/);
assert.match(html,/id="plusBasketUpsell"/);
assert.match(app,/CLOUD_CLIENT\.rpc\('farefully_feature_access'\)/);
assert.match(app,/state\.days===14&&!farefullyMayPlanFortnight\(\)/);
const stripped=app.replace(/\bbootstrapFarefully\(\);\s*$/,'');
assert.notEqual(stripped,app,'Expected application bootstrap to be removable');
const simple={
 style:{setProperty(){}},dataset:{},value:'',checked:false,hidden:false,
 classList:{add(){},remove(){},toggle(){}},textContent:'',innerHTML:'',
 addEventListener(){},setAttribute(){},querySelectorAll(){return []},querySelector(){return null}
};
const ctx=vm.createContext({
 document:{documentElement:simple,body:simple,
   getElementById:()=>simple,querySelector:()=>simple,querySelectorAll:()=>[],addEventListener(){}},
 window:{addEventListener(){},location:{reload(){}}},
 localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
 navigator:{},console:{log(){},warn(){},error(){}},
 setTimeout:()=>0,clearTimeout(){},fetch:async()=>{throw Error('Network disabled')}
});
vm.runInContext(stripped,ctx,{timeout:15000});
const run=src=>vm.runInContext(src,ctx,{timeout:15000});
assert.equal(run('def().days'),7,'New households must default to seven days');
run("state=def();state.plan=['saved1','saved2'];state.days=14;normalizeState();");
assert.equal(run('state.days'),14,'Existing fourteen-day household setting must survive load');
assert.equal(run('state.plan.length'),2,'Normalisation must not wipe saved meals');
run("FAREFULLY_FEATURES={plus:false,may_generate_14_day:false,paid_plan_limits_live:true,available:true};");
assert.equal(run('farefullyMayPlanFortnight()'),false);
run("state=def();state.days=14;state.supermarket='Aldi';state.useWeeklyOffers=false;state.taste.ingredients.polenta=-2;build()");
assert.equal(run('state.days'),7,'A Free member cannot create a new fourteen-day plan');
assert.equal(run('state.plan.length'),7,'Free must still generate a usable seven-day plan');
assert.equal(run('state.plan.every(id=>!hardBlocked(allDinners().find(m=>m.id===id)))'),true,
  'Free planning must respect dietary hard exclusions');
run("FAREFULLY_FEATURES={plus:true,may_generate_14_day:true,paid_plan_limits_live:true,available:true};");
run("state=def();state.days=14;state.supermarket='Aldi';state.useWeeklyOffers=false;build()");
assert.equal(run('state.plan.length'),14,'Plus members must be able to generate a fortnight');
assert.equal(run('state.days'),14);
run("FAREFULLY_FEATURES={plus:false,may_generate_14_day:false,paid_plan_limits_live:true,available:false};");
assert.equal(run('farefullyMayPlanFortnight()'),false,'Entitlement lookup failures must lock paid generation');
console.log('Free/Plus planner gates passed: seven-day Free, fourteen-day Plus, saved plan preservation, hard exclusions, fail-closed.');
