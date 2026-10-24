// Farefully PWA and recipe catalogue launch audit. Local-only: no customer data or API calls.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url));
const manifest=JSON.parse(read('app/manifest.webmanifest').toString('utf8'));
const appHtml=read('app/index.html').toString('utf8');
const account=read('app/account.html').toString('utf8');
const home=read('index.html').toString('utf8');
const install=read('app/install.html').toString('utf8');
const script=read('app/app.js').toString('utf8');
assert.equal(manifest.start_url,'/app/');
assert.equal(manifest.scope,'/app/');
assert.equal(manifest.display,'standalone');
assert.equal(manifest.prefer_related_applications,false);
assert.ok(manifest.name.includes('Farefully'));
for(const size of [192,512]){
 const icon=manifest.icons.find(v=>v.sizes===size+'x'+size&&v.type==='image/png');
 assert.ok(icon,'Missing '+size+'px manifest PNG');
 const bin=read(icon.src.replace(/^\//,''));
 assert.equal(bin.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Bad PNG header');
 assert.equal(bin.readUInt32BE(16),size,'PNG width must match manifest');
 assert.equal(bin.readUInt32BE(20),size,'PNG height must match manifest');
}
for(const page of [appHtml,account,install])assert.match(page,/\/app\/manifest\.webmanifest/,'Missing PWA manifest link');
for(const page of [appHtml,account,home,install])assert.match(page,/\/app\/install\.html|Add Farefully to your phone|Add to Home Screen/,'Missing clear install route');
assert.match(install,/beforeinstallprompt/);
assert.match(install,/iPhone or iPad/);
assert.match(install,/Android/);
assert.match(install,/internet connection/,'Never claim offline access unless tested');
assert.doesNotMatch(install,/navigator\.serviceWorker\.register/,'Avoid caching sensitive household data without an offline strategy');
function getLiteral(token,open,close){
 let index=script.indexOf(token);assert.ok(index>=0,'Missing '+token);
 let start=index+token.length-1,depth=0,quoted=false,escaped=false;
 for(let i=start;i<script.length;i++){
  const c=script[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}
  if(c==='"')quoted=true;
  else if(c===open)depth++;
  else if(c===close&&--depth===0)return script.slice(start,i+1);
 }
 throw Error('Unclosed '+token);
}
const meals=JSON.parse(getLiteral('const D=[','[',']').replace(/IMG\.[A-Za-z0-9_]+/g,'"stored-image"'));
const methods=JSON.parse(getLiteral('const METHODS={','{','}'));
assert.ok(meals.length>=229,'Expected the expanded launch recipe catalogue');
const ids=new Set(meals.map(x=>x.id));
assert.equal(ids.size,meals.length,'Duplicate recipe IDs');
assert.equal(Object.keys(methods).length,meals.length,'Every built-in recipe needs a real method');
const originalKeys=new Set(meals.filter(m=>![
 'vegbeanminestrone','lemonchickenricesoup','tomatofishbeanstew','smokychickpeaskillet',
 'porkapplecasserole','creamyricelentils','prawnlemoncouscous','blackbeansweetjackets',
 'beeflentilstuffedpepper'
].includes(m.id)).flatMap(m=>Object.keys(m.i||{})));
for(const m of meals){
 assert.ok(m.id&&m.n&&m.cat&&m.t>0&&m.t<=240);
 assert.ok(Object.keys(m.i||{}).length>=3,'Recipe needs meaningful ingredients: '+m.id);
 assert.ok(Object.values(m.i).every(v=>Number.isFinite(v)&&v>0),'Invalid quantity: '+m.id);
 assert.ok(Array.isArray(methods[m.id])&&methods[m.id].length>=3,'Missing cooking method: '+m.id);
}
const newlyAdded=meals.filter(m=>m.id&&[
 'vegbeanminestrone','lemonchickenricesoup','tomatofishbeanstew','smokychickpeaskillet',
 'porkapplecasserole','creamyricelentils','prawnlemoncouscous','blackbeansweetjackets',
 'beeflentilstuffedpepper'
].includes(m.id));
assert.equal(newlyAdded.length,9,'Nine new recipes should be present');
for(const m of newlyAdded)for(const key of Object.keys(m.i))assert.ok(originalKeys.has(key),'Ingredient missing from model: '+m.id+' '+key);
assert.match(script,/function hardBlocked\(m\)/,'Never remove strict exclusions');
console.log('Farefully launch audit passed: icon files, install guide, manifest, 229 real recipes, full methods, model ingredients, no duplicate IDs.');
