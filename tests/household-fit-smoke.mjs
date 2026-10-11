import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Exercise real production scoring helpers without contacting Supabase.
const app=readFileSync(new URL('../app/app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../app/index.html',import.meta.url),'utf8');
new vm.Script(app);
assert.ok(html.includes('id="recipeFitDetails"'));
assert.ok(html.includes('Why this fits'));
assert.ok(!app.includes('% household match'));
const withoutBootstrap=app.replace(/\bbootstrapFarefully\(\);\s*$/,'');
assert.notEqual(withoutBootstrap,app,'Expected Farefully bootstrap entrypoint');
const element=()=>({
  dataset:{},style:{},classList:{add(){},remove(){},toggle(){}},
  value:'',checked:false,addEventListener(){},setAttribute(){},
  appendChild(){},querySelectorAll(){return[]}
});
const shared=element();
const context=vm.createContext({
  document:{documentElement:{dataset:{},style:{}},body:shared,
    getElementById:()=>shared,querySelector:()=>shared,
    querySelectorAll:()=>[],addEventListener(){}},
  window:{addEventListener(){},location:{reload(){}}},
  localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
  navigator:{},console:{warn(){},error(){},log(){}},
  setTimeout:()=>0,clearTimeout(){},fetch:async()=>{throw Error('No network')}
});
vm.runInContext(withoutBootstrap,context);
const run=code=>vm.runInContext(code,context);
run("state=def();state.supermarket='Aldi';state.maxTime=45;state.useWeeklyOffers=false;globalThis.dish=allDinners().find(m=>m.id==='curry');");
assert.equal(run('householdFit(dish).label'),'Good fit',
  'Neutral recipes should not be labelled mediocre');
run("state.taste.ingredients.onions=1;");
assert.equal(run('householdFit(dish).label'),'Good fit');
run("state.taste.proteins.Chicken=1;");
assert.equal(run('householdFit(dish).label'),'Excellent fit');
run("state.ratings[dish.id]='love';");
assert.equal(run('householdFit(dish).label'),'Excellent fit');
run("state.taste.ingredients.onions=-1;");
assert.equal(run('householdFit(dish).label'),'Worth considering');
assert.match(run('householdFitExplanation(dish)'),/Not keen/);
run("state.taste.ingredients.onions=-2;");
assert.equal(run('householdFit(dish).label'),'Outside your rules');
run("state.taste.ingredients.onions=0;state.taste.proteins.Chicken=0;delete state.ratings[dish.id];state.maxTime=20;");
assert.equal(run('householdFit(dish).label'),'Worth considering');
run("state.maxTime=45;state.ratings[dish.id]='never';");
assert.equal(run('householdFit(dish).label'),'Outside your rules');
assert.match(run('householdFitExplanation(dish)'),/cannot be recommended/);
assert.doesNotMatch(run('householdFitBadge(dish)'),/\d+%/);
// Chips and wedges must be independent saved household choices.
assert.match(html, /data-group="style" data-key="chips" data-value="0"/);
assert.match(html, /data-group="style" data-key="wedges" data-value="0"/);
run("state=def();state.supermarket='Aldi';state.useWeeklyOffers=false;"+
    "globalThis.chipsDish=allDinners().find(m=>m.id==='eggchipspeas2');"+
    "globalThis.wedgesDish=allDinners().find(m=>m.id==='beefburgerbowl');");
assert.ok(run('!!chipsDish&&!!wedgesDish'),'Expected existing chip and wedge recipes');
assert.equal(run("mealStyles(chipsDish).includes('chips')"),true);
assert.equal(run("mealStyles(chipsDish).includes('wedges')"),false);
assert.equal(run("mealStyles(wedgesDish).includes('wedges')"),true);
assert.equal(run("mealStyles(wedgesDish).includes('chips')"),false);
assert.match(run('prepBadges(chipsDish)'),/Homemade chips/);
assert.doesNotMatch(run('prepBadges(chipsDish)'),/Homemade wedges/);
assert.match(run('prepDetail(wedgesDish)'),/Homemade wedges/);
assert.doesNotMatch(run('prepDetail(wedgesDish)'),/Homemade chips/);
run('state.taste.styles.wedges=-2;');
assert.equal(run('hardBlocked(wedgesDish)'),true,'Wedges Never suggest must exclude wedges');
assert.equal(run('hardBlocked(chipsDish)'),false,'Wedges preference must not exclude chips');
run('state.taste.styles.wedges=0;state.taste.styles.chips=-2;');
assert.equal(run('hardBlocked(chipsDish)'),true,'Chips Never suggest must exclude chips');
assert.equal(run('hardBlocked(wedgesDish)'),false,'Chips preference must not exclude wedges');
run('state.taste.styles.chips=0;state.taste.styles.wedges=-1;');
assert.equal(run('householdFit(wedgesDish).label'),'Worth considering');
assert.equal(run('householdFit(chipsDish).label'),'Good fit');
run('state.taste.styles.wedges=-2;build();');
assert.equal(run("state.plan.some(id=>mealStyles(allDinners().find(m=>m.id===id)).includes('wedges'))"),false,
  'Generated plans must respect Never suggest wedges');
console.log('Separate chips/wedges controls, fit, badges and strict plan exclusion passed.');

console.log('Household Fit regression checks passed (neutral, loved, disliked, excluded, cooking time, explanations).');
