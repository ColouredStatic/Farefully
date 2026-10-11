// Visual regression guard for Farefully's responsive Basket heading and total estimate.
// HTML/CSS is intentionally self-contained. Never reads real customer information.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../app/index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../app/app.js',import.meta.url),'utf8');
const basketStart=html.indexOf('<section class="screen" id="basket">');
const basketEnd=html.indexOf('<div class="card shopping-assistant"',basketStart);
assert.ok(basketStart>=0 && basketEnd>basketStart,'Basket screen and shopping companion must exist');
const basket=html.slice(basketStart,basketEnd);
assert.match(basket,/class="basketintro"/);
assert.match(basket,/class="card totalbox"/);
assert.ok(basket.indexOf('class="baskethead"')<basket.indexOf('class="card totalbox"'),
  'Summary card must sit underneath, not inside narrow title grid');
assert.match(basket,/id="basketTotal"/);
assert.match(basket,/id="basketRemain"/);
assert.match(basket,/id="retailerNote"/);
assert.match(basket,/id="basketCoverage"/);
assert.ok(!basket.includes('Estimated checkout'),'Customer-facing price must be a basket estimate');
assert.match(html,/\.basketamount\{/);
assert.match(html,/#basket \.totalbox\{/);
assert.match(html,/\.basketamount-main\{min-width:0/);
assert.match(html,/\.basketbudget\.over\{/);
assert.match(html,/@media\(max-width:450px\)/);
assert.ok(html.includes('class="topactions"')&&html.includes('class="memberstatus"'),
  'Header should separate account actions from membership and cloud sync');
assert.ok(!html.includes('text-overflow:ellipsis;white-space:nowrap}.screen'),
  'Original truncated button layout should not be the final header treatment');
assert.match(js,/basketBudget\.classList\.toggle\('over',rem<0\)/);
assert.match(js,/basketCoverage\.textContent=hasCurrentMatches/);
assert.match(js,/Remaining prices are modelled; not a checkout quote/);
assert.match(html,/app\.js\?v=1182/);
console.log('Basket layout checks passed: full-width estimate, labelled source, budget status, responsive header, preserved controls.');
