// Regression checks for Farefully Plus basket review and honest homepage claims.
// Uses synthetic data and stubbed RPC responses. No customer records or payment calls.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const app=readFileSync(new URL('../app/app.js',import.meta.url),'utf8');
const page=readFileSync(new URL('../app/index.html',import.meta.url),'utf8');
const home=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.ok(page.includes('id="plusBasketReviewButton"'));
assert.ok(page.includes('id="plusBasketResult"'));
assert.ok(page.includes('app.js?v=1180'), 'Fresh JS must not be served from a stale cache');
assert.ok(home.includes('id="plans"') && home.includes('Free covers the week.'));
assert.ok(home.includes('Paid checkout is not open'));
assert.ok(home.includes('Unlimited seven-day meal plans'));
assert.ok(home.includes('Pack and waste review')||home.includes('basket pack and waste review'));
assert.ok(app.includes("CLOUD_CLIENT.rpc('farefully_plus_pack_review'"));
assert.ok(!app.includes('STRIPE_TEST_SECRET_KEY'));

const stripped=app.replace(/\bbootstrapFarefully\(\);\s*$/, '');
assert.notEqual(stripped,app,'Remove async app bootstrap in simulated DOM');
const store=new Map();
const elements=new Map();
function element(id=''){
  if(!elements.has(id))elements.set(id,{
    textContent:'',innerHTML:'',disabled:false,style:{setProperty(){}},
    classList:{add(){},remove(){},toggle(){}},dataset:{},value:'',checked:false,
    addEventListener(){},setAttribute(){},querySelectorAll(){return[]}
  });
  return elements.get(id);
}
const plain=element('generic');
const ctx=vm.createContext({
  document:{body:plain,documentElement:plain,
    getElementById:id=>element(id),querySelectorAll:()=>[],querySelector:()=>plain,
    addEventListener(){}},
  window:{addEventListener(){},location:{reload(){}}},
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),
    removeItem:k=>store.delete(k)},
  navigator:{},console:{warn(){},error(){},log(){}},
  setTimeout:()=>0,clearTimeout(){},fetch:async()=>{throw Error('Network blocked')}
});
vm.runInContext(stripped,ctx,{timeout:15000});
vm.runInContext("state=def();state.basket={lettuce:{packs:2,line:2}};active='p_test';CLOUD_READY=true;CLOUD_OUTBOX={};CLOUD_CONFLICT_ID=null;CLOUD_SAVING=false;",ctx);
const output=element('plusBasketResult'),button=element('plusBasketReviewButton');
ctx.freeRpc=async(name,args)=>{
  assert.equal(name,'farefully_plus_pack_review');
  assert.equal(args.p_source_profile_id,'p_test');
  assert.ok(args.p_pack_hints.some(x=>x.id==='lettuce'));
  return{data:{eligible:false,reason:'plus_required'},error:null};
};
vm.runInContext('CLOUD_CLIENT={rpc:freeRpc}',ctx);
await vm.runInContext('shoppingReviewPacks()',ctx);
assert.match(output.innerHTML,/Farefully Plus/);
assert.equal(button.disabled,false);
ctx.paidRpc=async()=>({data:{
 eligible:true,lines_reviewed:1,lines_with_excess:1,
 items:[{id:'lettuce',unit:'each',need_to_buy:1.4,pack_size:1,pack_count:2,
         excess_quantity:0.6,excess_pct_of_pack:60}]
},error:null});
vm.runInContext('CLOUD_CLIENT={rpc:paidRpc}',ctx);
await vm.runInContext('shoppingReviewPacks()',ctx);
assert.match(output.innerHTML,/potentially left over/);
assert.match(output.innerHTML,/lettuce/i);
assert.equal(button.disabled,false);
assert.equal(vm.runInContext('state.basket.lettuce.packs',ctx),2,'Must not change the free basket');
console.log('Plus basket review tests passed: free entitlement, eligible member, model leftover, no basket mutation, honest homepage.');
