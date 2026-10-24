// Dependency-free regression test for the Farefully planner and basket.
// This test deliberately uses synthetic households, never production user data.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const app = readFileSync(new URL('../app/app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../app/index.html', import.meta.url), 'utf8');
new vm.Script(app); // Catch JavaScript syntax errors before a release.

const required = ['basketGroups','plans','shoppingAssistant','shopProgressLabel',
  'shoppingExtraForm','shopModeStore','shopModeOnline','cloudAccountGate','cloudRetry'];
for(const id of required){
 assert.ok(html.includes('id="'+id+'"'), 'Missing app control: '+id);
}
assert.match(app,/function homemadeChipsWedges\(m\)/,
 'Do not remove this recipe-badge helper without updating all callers.');

function element(id){
 const classes=new Set();
 return {id,style:{setProperty(){}},dataset:{},options:[],hidden:false,
   value:'',checked:false,innerHTML:'',textContent:'',
   classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),
     contains:x=>classes.has(x),toggle:x=>classes.has(x)?(classes.delete(x),false):(classes.add(x),true)},
   addEventListener(){},setAttribute(){},getAttribute(){},focus(){},click(){},
   before(){},after(){},append(){},appendChild(){},scrollIntoView(){},
   querySelectorAll(){return []},querySelector(){return null},closest(){return null}
 };
}

function fixture(){
 return {
  profile:{id:'smoke-household',name:'Test family'},
  state:{adults:2,children:3,days:14,budget:200,supermarket:'Aldi',
   autoRetailer:'Aldi',setupComplete:true,tasteComplete:true,dietComplete:true,
   avoid:[],avoidGroups:[],allergens:[],dietPattern:'omnivore',
   fishFrequency:'never',vegFrequency:'some',priority:'balance',
   novelty:'balanced',maxTime:45,planGeneration:1,
   plan:['steakwedges','hamfriedrice','roastchickenleft','beefburgerbowl',
    'baconeggskillet','chickenburgers','hamcheesepie','burgers','chickenalfredo',
    'porkchopsmash','chickengravyMash','porkburgerswedges','sausage','cottage'],
   pantry:{},checked:{},basket:{},need:{},ratings:{},recentPlans:[],
   taste:{proteins:{},styles:{},ingredients:{}},shoppingExtras:[],
   customRecipes:[],useWeeklyOffers:false,loyaltyPricing:true
  }
 };
}

async function run({reset=false,corrupt=false}={}){
 const errors=[],elements=new Map(),account='00000000-0000-4000-8000-000000000001';
 const profile=fixture();
 if(corrupt)profile.state.checked=null;
 const household={owner_id:account,source_profile_id:profile.profile.id,
   name:profile.profile.name,revision:7,profile_data:profile};
 const prefix='farefully_cloud_'+account+'_';
 const cache=new Map();
 if(reset){
   cache.set(prefix+'profiles',JSON.stringify([profile.profile]));
   cache.set(prefix+'active',profile.profile.id);
   cache.set(prefix+'state_'+profile.profile.id,JSON.stringify(profile.state));
   cache.set(prefix+'pending',JSON.stringify({[profile.profile.id]:{
     operation:'save',baseRevision:7,payload:household
   }}));
 }
 const storage={getItem:key=>cache.get(key)||null,setItem:(k,v)=>cache.set(k,String(v)),
   removeItem:key=>cache.delete(key),key:i=>[...cache.keys()][i]||null,
   get length(){return cache.size}};
 const document={documentElement:{dataset:{},style:{}},body:element('body'),
   visibilityState:'visible',getElementById(id){
     if(!elements.has(id))elements.set(id,element(id));
     return elements.get(id);
   },querySelectorAll(){return[]},querySelector(){return null},
   addEventListener(){},createElement:element};
 const client={
   auth:{getUser:async()=>({data:{user:{id:account}},error:null}),
     onAuthStateChange(){}},
   from(table){
     if(table==='household_reset_epochs')
       return {select:()=>({eq:()=>({maybeSingle:async()=>({
         data:reset?{reset_token:'reset-token-v1'}:null,error:null
       })})})};
     if(table==='households')
       return {select:()=>({eq:()=>({order:()=>({limit:async()=>({
         data:reset?[]:[household],error:null
       })})})})};
     throw new Error('Unexpected data request: '+table);
   },
   rpc:async(name)=>({data:name==='farefully_feature_access'
     ?{plus:true,may_generate_14_day:true,paid_plan_limits_live:true}
     :{active:true,gift_lifetime:true},error:null})
 };
 const window={supabase:{createClient:()=>client},
   addEventListener(){},confirm(){return true},location:{reload(){}}};
 const console={log(){},warn(...x){errors.push('warning '+x.join(' '))},
   error(...x){errors.push(x.map(e=>e?.stack||String(e)).join(' '))}};
 const context=vm.createContext({document,window,localStorage:storage,console,
   setTimeout:()=>0,clearTimeout(){},navigator:{},
   fetch:async()=>{throw Error('No network in smoke tests')}});
 const running=app.replace(/\bbootstrapFarefully\(\);\s*$/,
   'globalThis.__smokeStart = bootstrapFarefully();');
 assert.notEqual(running,app,'Could not instrument startup');
 vm.runInContext(running,context,{timeout:15000});
 await context.__smokeStart;
 await Promise.resolve();
 assert.deepEqual(errors,[],'Browser initialization error: '+errors.join(' | '));
 assert.equal(elements.get('cloudAccountGate')?.style.display,'none');
 if(reset){
   assert.equal(cache.has(prefix+'state_'+profile.profile.id),false,
     'Reset must clear an old household cache');
   assert.equal(cache.has(prefix+'pending'),false,
     'Reset must clear pending saves from a previous household');
   assert.equal(cache.get(prefix+'last_reset_token'),'reset-token-v1');
   assert.equal(elements.get('welcome')?.classList.contains('show'),true);
 }else{
   assert.ok(elements.get('basketGroups')?.innerHTML?.length>500,
     'Basket should render for a saved 14-day household');
   assert.ok(elements.get('plans')?.innerHTML?.length>500,
     'Meal cards should render for the saved plan');
   assert.match(elements.get('basketGroups')?.innerHTML||'',/Chicken/i);
 }
}

await run();
await run({corrupt:true});
await run({reset:true});
process.stdout.write('Farefully planner smoke tests passed: saved basket, repaired cache, household reset.\n');
