// Source-backed adult nutrition estimates and Plus UI: synthetic data only.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync(new URL('../app/app.js',import.meta.url),'utf8');
const data=readFileSync(new URL('../app/nutrition-data.js',import.meta.url),'utf8');
const page=readFileSync(new URL('../app/index.html',import.meta.url),'utf8');
new vm.Script(data);new vm.Script(app);
assert.match(page,/nutrition-data\.js\?v=1/);
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
console.log('Nutrition smoke test passed: sourced ingredients, approximate serving, missing-data fail closed, Plus gate, no guessed day totals.');
