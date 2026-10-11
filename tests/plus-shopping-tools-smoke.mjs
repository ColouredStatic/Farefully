// Synthetic regression tests for Farefully Plus: two shops, aisle order, actual spend.
// Never connects to Supabase or modifies a real household.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync(new URL('../app/app.js',import.meta.url),'utf8');
const page=readFileSync(new URL('../app/index.html',import.meta.url),'utf8');
const stripped=app.replace(/\bbootstrapFarefully\(\);\s*$/,'');
assert.notEqual(stripped,app,'bootstrap must be removable');
for(const id of ['plusSplitButton','plusSplitResult','plusActualSpend','plusAisleResult','plusSpendSaveButton']){
  assert.ok(page.includes('id="'+id+'"'),id+' missing from app markup');
}
assert.ok(page.includes('app.js?v=1181'),'app JS cache must be bumped');
const store=new Map(),elements=new Map();
function el(id){
  if(!elements.has(id))elements.set(id,{style:{setProperty(){}},
    classList:{add(){},remove(){},toggle(){}},dataset:{},value:'',checked:false,
    disabled:false,hidden:false,textContent:'',innerHTML:'',
    addEventListener(){},setAttribute(){},querySelectorAll(){return []}});
  return elements.get(id);
}
const defaultEl=el('default');
const doc={documentElement:defaultEl,body:defaultEl,activeElement:null,
  getElementById:id=>el(id),querySelectorAll:()=>[],querySelector:()=>defaultEl,
  addEventListener(){}};
const calls=[];
const context=vm.createContext({
  document:doc,window:{addEventListener(){},location:{reload(){}}},
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),
    removeItem:k=>store.delete(k)},
  navigator:{},console:{warn(){},error(){},log(){}},
  setTimeout:()=>0,clearTimeout(){},fetch:async()=>{throw Error('Network disabled')}
});
vm.runInContext(stripped,context,{timeout:12000});
const run=(s)=>vm.runInContext(s,context,{timeout:12000});
run("state=def();state.days=14;state.plan=D.slice(0,14).map(x=>x.id);active='p_test';calc();"+
    "CLOUD_READY=true;CLOUD_SAVING=false;CLOUD_OUTBOX={};CLOUD_CONFLICT_ID=null;render=()=>true;");
const rows=JSON.parse(run('JSON.stringify(plusShopWeekNeeds())'));
assert.ok(rows.length>20,'Expect both weeks to produce a substantive shopping basket');
const sums=JSON.parse(run('JSON.stringify(state.need)'));
for(const row of rows){
  assert.ok(Math.abs(row.week1+row.week2-sums[row.id])<0.05,'Week totals differ: '+row.id);
}
const basketBefore=run('JSON.stringify(state.basket)');
context.mockPlus=async(name,params)=>{
  assert.equal(name,'farefully_plus_shopping_tools');
  calls.push({name,action:params.p_action,payload:params.p_payload});
  if(params.p_action==='get_preferences')
    return{data:{eligible:true,aisle_order:['Produce','Meat'],actual_spend:83.40},error:null};
  if(params.p_action==='save_preferences')
    return{data:{eligible:true,saved:true,
      aisle_order:params.p_payload.aisle_order,actual_spend:params.p_payload.actual_spend},error:null};
  if(params.p_action==='split_fortnight'){
    return{data:{eligible:true,lines:params.p_payload.length,items:params.p_payload.map(x=>({
      id:x.id,first_need:x.week1,second_need:x.week2,
      first_packs:Math.ceil(x.week1/x.pack),second_packs:Math.ceil(x.week2/x.pack)
    }))},error:null};
  }
  throw Error('unexpected action');
};
run('CLOUD_CLIENT={rpc:mockPlus}');
await run('plusShopSplitFortnight()');
assert.match(el('plusSplitResult').innerHTML,/Shop 1/);
assert.match(el('plusSplitResult').innerHTML,/Shop 2/);
assert.ok(calls.find(x=>x.action==='split_fortnight'));
assert.equal(run('JSON.stringify(state.basket)'),basketBefore,'Split must not alter Free basket');

await run('plusShopLoadPrefs()');
assert.equal(run('plusShopActualSpend'),83.4);
assert.equal(run('plusShopCategories()[0]'),'Produce');
await run("plusShopMoveAisle('Produce',1)");
assert.ok(calls.find(x=>x.action==='save_preferences'),'Aisle order must be persisted using secure RPC');

el('plusActualSpend').value='97.13';
await run('plusShopSaveSpend()');
const saved=calls.filter(x=>x.action==='save_preferences').at(-1);
assert.equal(saved.payload.actual_spend,'97.13');
assert.match(el('plusSpendResult').textContent,/entered spend/i);
assert.equal(run('JSON.stringify(state.basket)'),basketBefore,'Plus settings must not rewrite the basic basket');

context.mockFree=async()=>({data:{eligible:false,reason:'plus_required'},error:null});
run('CLOUD_CLIENT={rpc:mockFree};plusShopLoadedProfile=null');
await run('plusShopSplitFortnight()');
assert.match(el('plusSplitResult').textContent,/Plus is required/);
assert.equal(run('JSON.stringify(state.basket)'),basketBefore);
console.log('Plus shopping tools passed: week sums, two trips, persisted aisle order, spend, Free rejection, no basket mutation.');
