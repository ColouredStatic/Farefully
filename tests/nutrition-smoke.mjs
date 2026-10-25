// Source-backed adult nutrition estimates and Plus UI: synthetic data only.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync(new URL('../app/app.js',import.meta.url),'utf8');
const data=readFileSync(new URL('../app/nutrition-data.js',import.meta.url),'utf8');
const page=readFileSync(new URL('../app/index.html',import.meta.url),'utf8');
new vm.Script(data);new vm.Script(app);
assert.match(page,/nutrition-data\.js\?v=\d+/);
assert.match(page,/id="plusNutritionPanel"/);
assert.match(page,/id="recipeNutritionEstimate"/);
assert.match(page,/id="plusNutritionDay"/);
const elements=new Map();
function el(id='generic'){
 if(!elements.has(id))elements.set(id,{
   style:{setProperty(){}},dataset:{},disabled:false,hidden:false,innerHTML:'',textContent:'',value:'',
   classList:{add(){},remove(){},toggle(){return false}},
   addEventListener(){},setAttribute(){},querySelectorAll(){return[]},querySelector(){return null}
 });
 return elements.get(id);
}
const local=new Map();
const context=vm.createContext({
 document:{documentElement:el('html'),body:el('body'),getElementById:el,
  querySelectorAll(){return[]},querySelector(){return el()},addEventListener(){}},
 window:{addEventListener(){},location:{reload(){}}},
 localStorage:{getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,String(v)),removeItem:k=>local.delete(k)},
 navigator:{},console:{warn(){},error(){},log(){}},setTimeout:()=>0,clearTimeout(){},fetch:async()=>{throw Error('No network in nutrition regression')}
});
vm.runInContext(data,context);
assert.ok(Object.keys(context.window.FAREFULLY_NUTRITION).length>=95,'Require sourced core ingredient coverage');
for(const record of Object.values(context.window.FAREFULLY_NUTRITION)){
 assert.ok(Number.isFinite(record.k)&&record.k>=0&&record.c&&record.n,'Missing source data');
}
const noStart=app.replace(/\bbootstrapFarefully\(\);\s*$/,'');
assert.notEqual(noStart,app);
vm.runInContext(noStart,context,{timeout:15000});
const run=x=>vm.runInContext(x,context,{timeout:15000});
run("state=def();state.supermarket='Aldi';state.useWeeklyOffers=false;");
const example=JSON.parse(run("JSON.stringify(farefullyEstimatedCalories({i:{rice:350,chicken:500}}))"));
assert.equal(example.complete,true);
assert.ok(example.kcalAdult>=350&&example.kcalAdult<=450,'Dry rice and chicken estimate is implausible');
const notKnown=JSON.parse(run("JSON.stringify(farefullyEstimatedCalories({i:{rice:350,curry:500}}))"));
assert.equal(notKnown.complete,false,'Cannot give falsely precise calories for unmapped sauce');
const implausible=JSON.parse(run("JSON.stringify(farefullyEstimatedCalories({i:{pineapple:400}}))"));
assert.equal(implausible.complete,false,'Never mistake 400 grams for 400 whole pineapples');
const realFruit=JSON.parse(run("JSON.stringify(farefullyEstimatedCalories(D.find(m=>m.id==='gammonpineapplerice')))"));
assert.equal(realFruit.complete,true,'Corrected gammon and pineapple recipe should be estimable');
assert.ok(realFruit.kcalAdult>250&&realFruit.kcalAdult<1200,'Gammon and pineapple serving should be plausible');
const cubes=JSON.parse(run("JSON.stringify(farefullyEstimatedCalories({i:{rice:300,stock:2}}))"));
assert.equal(cubes.complete,false,'Stock cube nutrition must not be invented from missing source values');
const builtIn=JSON.parse(run("JSON.stringify(D.map(m=>({id:m.id,info:farefullyEstimatedCalories(m)})))"));
assert.ok(builtIn.every(row=>!row.info?.complete||(row.info.kcalAdult>=50&&row.info.kcalAdult<=1500)),
  'Every published dinner estimate must be in a plausible adult-serving range');

run("state.plan=['curry'];FAREFULLY_FEATURES={plus:false,available:true};farefullyRenderDailyNutrition()");
assert.equal(el('plusNutritionFree').hidden,false,'Free users see upgrade copy');
assert.equal(el('plusNutritionMember').hidden,true,'Free users cannot see daily Plus overview');
run("FAREFULLY_FEATURES={plus:true,available:true};farefullyRenderDailyNutrition()");
assert.equal(el('plusNutritionFree').hidden,true);
assert.equal(el('plusNutritionMember').hidden,false);
assert.match(el('plusNutritionResult').innerHTML,/Not available/,'Do not invent a daily total');
assert.doesNotMatch(el('plusNutritionResult').innerHTML,/Estimated planned day:/,'Incomplete daily nutrition should not be summed');
run("farefullyRenderRecipeNutrition({i:{rice:350,chicken:500}})");
assert.match(el('recipeNutritionEstimate').textContent,/kcal per adult-equivalent/);

// Adult goal comparison is opt-in, ephemeral and only available when Plus access is verified.
assert.match(page,/id="plusNutritionOptIn"/);
assert.match(page,/id="plusNutritionAdultReference"/);
assert.match(page,/id="plusNutritionIdeas"/);
run("state=def();state.plan=['burgers'];state.supermarket='Aldi';state.useWeeklyOffers=false;nutritionSelectedDay=0;nutritionOptedIn=true;");
el('plusNutritionAdultReference').value='1100';
run("farefullyRenderDailyNutrition()");
assert.equal(el('plusNutritionGoalControls').hidden,false,'Plus opt-in must show preference controls');
assert.match(el('plusNutritionAdultGoalMessage').textContent,/between 1,600 and 3,500/,'Reject extreme daily calorie references');
assert.equal(run('nutritionAdultDailyReference'),null,'Unsafe reference must not be accepted');
el('plusNutritionAdultReference').value='2000';
run("farefullyRenderDailyNutrition()");
assert.equal(run('nutritionAdultDailyReference'),2000);
assert.match(el('plusNutritionAdultGoalMessage').textContent,/2,000|2000/,'User-chosen daily reference should display');
const ideas=JSON.parse(run("JSON.stringify(farefullyNutritionSuggestions(0).map(x=>({id:x.m.id,kcal:x.energy.kcalAdult,hard:hardBlocked(x.m)})))"));
assert.ok(ideas.length>0,'Expected some suitable alternative dinners for beef burgers');
assert.ok(ideas.every(x=>!x.hard&&x.kcal>=400),'Never include blocked or excessively low-calorie suggestions');
assert.equal(run("state.plan[0]"),'burgers','Suggestions must not alter the family plan automatically');
const sampleId=ideas[0].id;
run("state.ratings["+JSON.stringify(sampleId)+"]='never'");
const blocked=JSON.parse(run("JSON.stringify(farefullyNutritionSuggestions(0).map(x=>x.m.id))"));
assert.ok(!blocked.includes(sampleId),'Respect Do not suggest ratings');
run("state.ratings={};FAREFULLY_FEATURES={plus:false,available:true};");
assert.equal(JSON.parse(run("JSON.stringify(farefullyNutritionSuggestions(0))")).length,0,'Free users cannot request Plus dinner ideas');
assert.equal(run("farefullyChooseNutritionSuggestion("+JSON.stringify(sampleId)+")"),false,'Free users cannot swap via premium feature');
run("farefullyRenderDailyNutrition()");
assert.equal(el('plusNutritionGoalControls').hidden,true,'Revoke the premium goal UI when access is unavailable');
// Only user confirmation changes a dinner; no children's portion edits or goal values enter shared state.
run("FAREFULLY_FEATURES={plus:true,available:true};state.ratings={};nutritionOptedIn=true;");
run("calc=()=>{};save=()=>{};render=()=>{};showToast=()=>{};");
const peopleBefore=JSON.parse(run("JSON.stringify([state.adults,state.children])"));
assert.equal(run("farefullyChooseNutritionSuggestion("+JSON.stringify(sampleId)+")"),true);
assert.equal(run("state.plan[0]"),sampleId);
assert.deepEqual(JSON.parse(run("JSON.stringify([state.adults,state.children])")),peopleBefore,
  'Adult ideas must not alter household size or children portions');
assert.equal(run("Object.prototype.hasOwnProperty.call(state,'nutritionAdultDailyReference')"),false,
  'Private adult reference must not enter cloud-synced household state');
run("FAREFULLY_FEATURES={plus:false,available:false};");
assert.equal(run("farefullyChooseNutritionSuggestion("+JSON.stringify(sampleId)+")"),false,'Fail closed on entitlement lookup failure');

console.log('Nutrition smoke test passed: sourced ingredients, approximate serving, missing-data fail closed, Plus gate, no guessed day totals.');
