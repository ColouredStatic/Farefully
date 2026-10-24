// Regression guard for sensible two-week shopping quantities and potato sides.
// All state is synthetic; this test never reads a customer's saved household.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../app/app.js',import.meta.url),'utf8');
const stripped=source.replace(/\bbootstrapFarefully\(\);\s*$/,'');
assert.notEqual(stripped,source,'Expected application bootstrap to be removable');
const store=new Map();
const simpleElement={
  style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},
  dataset:{},value:'',checked:false,innerHTML:'',textContent:'',
  addEventListener(){},setAttribute(){},querySelectorAll(){return []}
};
const context=vm.createContext({
  document:{documentElement:simpleElement,body:simpleElement,
    getElementById:()=>simpleElement,querySelectorAll:()=>[],querySelector:()=>simpleElement,
    addEventListener(){}},
  window:{addEventListener(){},location:{reload(){}}},
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),
    removeItem:k=>store.delete(k)},
  navigator:{},console:{warn(){},error(){},log(){}},
  setTimeout:()=>0,clearTimeout(){},fetch:async()=>{throw Error('Network blocked')}
});
vm.runInContext(stripped,context);
const run=code=>vm.runInContext(code,context,{timeout:15000});
// The fortnight stress test models an authenticated Plus member.
run('FAREFULLY_FEATURES={plus:true,may_generate_14_day:true,paid_plan_limits_live:true,available:true}');

const dinners=JSON.parse(run('JSON.stringify(D.filter(m=>m.i?.lettuce).map(m=>({id:m.id,q:m.i.lettuce})))'));
assert.ok(dinners.length>=20,'Expected the known lettuce-containing dinner recipes');
for(const {id,q} of dinners){
  assert.ok(q>0&&q<=0.6,'Lettuce is too high for one family dinner: '+id+'='+q);
}
const lunches=JSON.parse(run('JSON.stringify(lunch.filter(m=>m.i?.lettuce).map(m=>({n:m.n,q:m.i.lettuce})))'));
for(const {n,q} of lunches){
  assert.ok(q>0&&q<=0.4,'Lettuce is too high for one family lunch: '+n+'='+q);
}
run('state=def()');
const variety=run('new Set(Array.from({length:14},(_,i)=>slotFor(lunch,i)?.n)).size');
assert.equal(variety,14,'A default fortnight should rotate through distinct lunch options');

for(let seed=0;seed<6;seed++){
  run("state=def();state.days=14;state.adults=2;state.children=3;state.budget=10000;"+
      "state.supermarket='Aldi';state.useWeeklyOffers=false;state.planGeneration="+seed+";"+
      "state.novelty="+JSON.stringify(seed%2?'adventurous':'balanced')+";"+
      "state.priority="+JSON.stringify(seed%3===0?'variety':'balance')+";"+
      "state.taste.ingredients.polenta=-2;build()");
  const rows=JSON.parse(run('JSON.stringify(state.plan.map((id,i)=>({id,styles:mealStyles(meal(i)),blocked:hardBlocked(meal(i))})))'));
  assert.equal(rows.length,14,'A qualifying household should receive 14 dinners');
  assert.equal(new Set(rows.map(x=>x.id)).size,14,'Avoid unnecessary duplicate dinners');
  assert.ok(rows.every(x=>!x.blocked),'A hard-excluded recipe was recommended');
  for(let week=0;week<2;week++){
    const seven=rows.slice(week*7,week*7+7);
    for(const side of ['wedges','chips']){
      const count=seven.filter(x=>x.styles.includes(side)).length;
      assert.ok(count<=1,'Repeated '+side+' within week '+(week+1)+' of seed '+seed);
    }
  }
}
console.log('Basket/variety regression checks passed: lettuce portions, 14 distinct lunches, 6 fortnight plans, strict exclusions, chips and wedges.');
