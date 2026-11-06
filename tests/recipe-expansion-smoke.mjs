// Farefully: release gate for the additive 350-recipe catalogue.
// Synthetic/static validation only; never queries customer or payment data.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const app=readFileSync(new URL('../app/app.js',import.meta.url),'utf8');
const extra=readFileSync(new URL('../app/recipes-expansion.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../app/index.html',import.meta.url),'utf8');
new vm.Script(extra);
new vm.Script(app);

const added=html.indexOf('<script defer src="recipes-expansion.js?v=1"></script>');
const main=html.indexOf('<script defer src="app.js?v=1189"></script>');
assert.ok(added>=0 && main>added,'Recipe expansion must load before the planner');

// Mirror the isolated recipe-photo regression environment without running cloud bootstrap.
const noop=()=>{};
const element={style:{},dataset:{},classList:{add:noop,remove:noop,toggle:noop},
 setAttribute:noop,addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],
 innerHTML:'',textContent:'',hidden:false};
const context=vm.createContext({
 document:{documentElement:{dataset:{},style:{}},body:element,
   getElementById:()=>element,querySelector:()=>element,querySelectorAll:()=>[],
   addEventListener:noop},
 window:{addEventListener:noop,location:{reload:noop}},
 localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},
 navigator:{},console:{log:noop,warn:noop,error:noop},
 setTimeout:()=>0,clearTimeout:noop,fetch:async()=>{throw Error('No network')}
});
vm.runInContext(extra,context,{timeout:15000});
const source=app.replace(/\bbootstrapFarefully\(\);\s*$/,'');
assert.notEqual(source,app,'Could not disable live startup in synthetic test');
vm.runInContext(source,context,{timeout:15000});
const json=vm.runInContext('JSON.stringify({D,METHODS,P,CANONICAL,extras:EXTRA_RECIPE_ROWS})',context,{timeout:15000});
const {D,METHODS,P,CANONICAL,extras}=JSON.parse(json);
assert.equal(extras.length,121,'New recipe batch must add exactly 121 records');
assert.equal(D.length,350,'Catalogue should total 350 dinner recipes');
assert.equal(Object.keys(METHODS).length,350,'Each dinner must have a method');
assert.equal(new Set(D.map(x=>x.id)).size,350,'No duplicate IDs');
assert.equal(new Set(D.map(x=>x.n.toLocaleLowerCase())).size,350,'No duplicate titles');
assert.ok(extras.filter(x=>x.t<=20).length>=30,'Quick-meal expansion should stay meaningful');

for(const recipe of D){
 assert.ok(recipe.n && recipe.d && recipe.e,'Missing title, description or icon: '+recipe.id);
 assert.ok(Number.isInteger(recipe.t) && recipe.t>0,'Invalid cooking time: '+recipe.id);
 assert.ok(Array.isArray(METHODS[recipe.id]) && METHODS[recipe.id].length>=3,
  'Missing method for '+recipe.id);
 for(const [ingredient,qty] of Object.entries(recipe.i)){
  assert.ok(P[ingredient],'Unknown basket ingredient '+ingredient+' in '+recipe.id);
  assert.ok(CANONICAL[ingredient],'Missing canonical ingredient metadata '+ingredient+' in '+recipe.id);
  assert.ok(Number.isFinite(qty) && qty>0,'Invalid basket quantity '+recipe.id+':'+ingredient);
 }
}
console.log('Farefully expansion smoke passed: 350 recipes, 121 additions, methods, basket mappings and script order.');
