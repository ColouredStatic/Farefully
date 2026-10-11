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
assert.equal(photos.length,35,'Three curated batches should total 35 assigned photos');
const ids=JSON.parse(run('JSON.stringify(D.map(m=>m.id))'));
assert.equal(new Set(ids).size,ids.length,'Dishes need distinct IDs');
for(const [id,photo] of photos){
  assert.ok(ids.includes(id),'Photo references missing dinner '+id);
  const provider=photo.provider||'Unsplash';
  if(provider==='Unsplash'){
    assert.match(photo.src,/^https:\/\/images\.unsplash\.com\/photo-[\w-]+\?/);
    assert.match(photo.source,/^https:\/\/unsplash\.com\/photos\//);
  }else if(provider==='Pexels'){
    assert.match(photo.src,/^https:\/\/images\.pexels\.com\/photos\/\d+\/pexels-photo-\d+\.jpeg\?/);
    assert.match(photo.source,/^https:\/\/www\.pexels\.com\/photo\//);
  }else if(provider==='Wikimedia Commons'){
    assert.match(photo.src,/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//);
    assert.match(photo.source,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    assert.match(photo.licenseUrl,/^https:\/\/creativecommons\.org\//);
  }else assert.fail('Unrecognised photo provider '+provider);
  assert.ok(photo.by.length>=3,'Photographer attribution missing for '+id);
  assert.match(photo.src,/(?:w=1100|width=1100)/,'Photo should request a resized version');
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
assert.deepEqual(
  JSON.parse(run("JSON.stringify(['pasta','chickenbacon','sausagecass','sausagetray','burgers','chickenburgers','fishpie','tunapasta','jacket','tunajackets','vegpastabake','chickpeacurry'].filter(id=>!RECIPE_PHOTOS[id]))")),
  [],'Every approved Batch 2 recipe must have a photograph'
);
assert.equal(run("RECIPE_PHOTOS.fishpie.license"),'CC BY-SA 3.0');
assert.equal(run("RECIPE_PHOTOS.tunajackets.license"),'CC0 1.0');
assert.equal(run("RECIPE_PHOTOS.chickpeacurry.provider"),'Pexels');
assert.match(app,/photo\.provider\|\|'Unsplash'/,'Credit renderer should support multiple libraries');
const batch3Ids=['omelette','fishrice','eggchipspeas2','tunafishcakeshome','baconeggskillet','breakfastdinner','roastchickenleft','beefshepherdwraps','eggchickpeacurry','porkchopsmash','beefburgerbowl','chillijackets2'];
assert.equal(new Set(batch3Ids).size,12,'Batch 3 recipe mapping must contain 12 distinct dishes');
assert.deepEqual(
  JSON.parse(run('JSON.stringify('+JSON.stringify(batch3Ids)+'.filter(id=>!RECIPE_PHOTOS[id]))')),
  [],'All 12 Batch 3 plan-prioritised dishes must have photos'
);
for(const id of batch3Ids){
  const photo=curated[id];
  assert.ok(photo.note?.length>40,'Photo mismatch/representation note required for '+id);
  assert.ok(photo.source.startsWith('https://'),'Source page required for '+id);
}
assert.equal(curated.chillijackets2.provider,'Unsplash','Chilli jacket meal uses original licensed Unsplash photograph');
assert.equal(curated.baconeggskillet.provider,'Pexels');
console.log('Recipe photography checks passed: 35 curated photos across three providers; first 12 plan-prioritised gaps covered with captions, source credits and fallbacks.');
