// Farefully Early Access content regression checks. Does not access customer data.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const pages=['index.html','app/index.html','beta/index.html','help/index.html',
  'how-it-works/index.html','privacy/index.html','safety/index.html','404.html'];
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const website=read('index.html');
const app=read('app/index.html');
const feedback=read('beta/index.html');
const privacy=read('privacy/index.html');
const safety=read('safety/index.html');
const plus=read('app/plus-preview.html');
for(const name of pages){
  const text=read(name);
  assert.doesNotMatch(text,/PUBLIC BETA|Farefully Public Beta|Good food, brighter days\. Public beta\.|>Beta testers</,
    'Old beta marketing must not be visible: '+name);
}
assert.match(website,/🌿 Early access/);
assert.match(website,/>EARLY ACCESS</);
assert.match(app,/<div class="betabadge">EARLY ACCESS<\/div>/);
assert.match(website,/Paid checkout is not open/);
assert.match(website,/Everyone keeps their current tools, including fourteen-day planning/);
assert.match(feedback,/Share Early Access Feedback/);
assert.match(feedback,/account saves household data in UK-hosted Supabase/);
assert.doesNotMatch(feedback,/During beta, your household profile stays in your browser/);
assert.match(privacy,/Farefully Plus payment processing is not live yet/);
assert.match(privacy,/Dietary and allergy choices can reveal sensitive health or religious information/);
assert.match(safety,/Always check the exact product label/);
assert.match(plus,/preview only, no checkout/);
assert.match(app,/app\.js\?v=\d+/);
assert.match(website,/href="\/beta\/"/,'Keep existing Early Access feedback URLs working');
console.log('Early Access copy checks passed: app, marketing, tester feedback, privacy, safety and billing disclosures.');
