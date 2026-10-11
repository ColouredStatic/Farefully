// Farefully presentation-only design regression checks.
// No user data, pricing, entitlement or planning algorithms are touched.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const appHtml=readFileSync(new URL('../app/index.html',import.meta.url),'utf8');
const homeHtml=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const homeCss=readFileSync(new URL('../assets/styles.css',import.meta.url),'utf8');
const appJs=readFileSync(new URL('../app/app.js',import.meta.url),'utf8');
const css=appHtml.split('<style>')[1]?.split('</style>')[0];
assert.ok(css && css.length>5000,'App styling should remain embedded for GitHub Pages');
assert.match(css,/Farefully design refinement, October 2026/);
assert.match(css,/\.screen\.active\{animation:farefully-screen-in/);
assert.match(css,/\.nav button\.active\{background:#e5f3e8/);
assert.match(css,/\.nav button\{[^}]*min-height:59px/);
assert.match(css,/\.shoprow\.done\{opacity:\.69/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(css,/button:focus-visible,a:focus-visible/);
assert.match(css,/\.app\{[^}]*env\(safe-area-inset-bottom/);
assert.match(css,/\.meal\{border-radius:19px/);
assert.match(homeCss,/Farefully visual refinement/);
assert.match(homeCss,/\.navcta,\.button\.primary\{background:#176b55/);
assert.match(homeCss,/\.plans-card-plus\{border-color:#176b55/);
assert.match(homeCss,/@media\(prefers-reduced-motion:reduce\)/);
for(const fragment of ['data-tab="home"','data-tab="plan"','data-tab="basket"',
 'data-tab="pantry"','data-tab="household"','id="basketTotal"','id="plusBasketPanel"',
 'id="farefullyPlusBadge"','EARLY ACCESS']){
  assert.ok(appHtml.includes(fragment),'App markup contract changed: '+fragment);
}
assert.ok(homeHtml.includes('id="plans"'),'Plans comparison must remain visible');
assert.ok(homeHtml.includes('Paid checkout is not open'),'No accidental live charging message');
assert.ok(appJs.includes("farefully_plus_shopping_tools"),'Premium basket services must remain available');
assert.ok(appJs.includes("bootstrapFarefully();"),'Planner bootstrap must remain intact');
console.log('Farefully design checks passed: shared UI, mobile nav, focus/reduced motion, Free/Plus and app markup.');
