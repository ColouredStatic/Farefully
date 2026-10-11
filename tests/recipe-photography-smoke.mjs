// Farefully recipe photography smoke tests: synthetic data, no external requests.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const app=readFileSync(new URL('../app/app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../app/index.html',import.meta.url),'utf8');
new vm.Script(app);
const stripped=app.replace(/\bbootstrapFarefully\(\);\s*$/,'');
assert.notEqual(stripped,app,'App bootstrap missing');
const noop=()=>{};
const shared={style:{},dataset:{},classList:{add:noop,remove:noop,toggle:noop},
  setAttribute:noop,addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],
  innerHTML:'',textContent:'',hidden:false};
const context=vm.createContext({
  document:{documentElement:{dataset:{},style:{}},body:shared,
    getElementById:()=>shared,querySelector:()=>shared,querySelectorAll:()=>[],
    addEventListener:noop},
  window:{addEventListener:noop,location:{reload:noop}},
  localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},
  navigator:{},console:{log:noop,warn:noop,error:noop},
  setTimeout:()=>0,clearTimeout:noop,fetch:async()=>{throw Error('No network')}
});
vm.runInContext(stripped,context,{timeout:15000});
const run=code=>vm.runInContext(code,context,{timeout:15000});
const curated=JSON.parse(run('JSON.stringify(RECIPE_PHOTOS)'));
const photos=Object.entries(curated);
assert.equal(photos.length,11,'First curated batch should have 11 photos');
const ids=JSON.parse(run('JSON.stringify(D.map(m=>m.id))'));
assert.equal(new Set(ids).size,ids.length,'Dishes need distinct IDs');
for(const [id,photo] of photos){
  assert.ok(ids.includes(id),'Photo references missing dinner '+id);
  assert.match(photo.src,/^https:\/\/images\.unsplash\.com\/photo-[\w-]+\?/);
  assert.match(photo.source,/^https:\/\/unsplash\.com\/photos\//);
  assert.ok(photo.by.length>=3,'Photographer attribution missing for '+id);
  assert.match(photo.src,/w=1100/,'Photo should request a resized version');
  assert.equal(run("image(allDinners().find(m=>m.id==="+JSON.stringify(id)+"))"),photo.src);
}
assert.equal(run("image(allDinners().find(m=>m.id==='curry'))").includes('wixstatic.com'),true,
  'Existing recipe image must remain untouched');
assert.match(run("image(allDinners().find(m=>m.id==='sausagepasta'))"),/^data:image\/svg\+xml/,
  'Unphotographed recipes must keep the illustrated placeholder');
assert.match(run("photoBackground(allDinners().find(m=>m.id==='roast'))"),/data:image\/svg\+xml/,
  'Photo backgrounds need an illustrated fallback layer');
assert.ok(html.includes('id="recipePhotoCredit"'),'Photo attribution field absent');
assert.ok(app.includes('Photo is illustrative'),'Photo context missing');
assert.ok(app.includes("el.dataset.ffPhotoFallback='1'"),'Image loading fallback absent');
assert.match(app,/loading="lazy" decoding="async"/,'Card photos should lazy-load');
console.log('Recipe photography checks passed: 11 credits, real photo URLs, existing Wix images, placeholders and fallback.');
