// Farefully mobile setup polish regression: independent of production customers.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../app/index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../app/onboarding-polish.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../app/onboarding-polish.css',import.meta.url),'utf8');
const planner=readFileSync(new URL('../app/app.js',import.meta.url),'utf8');
new vm.Script(js);
assert.ok(html.includes('onboarding-polish.css?v=1'));
assert.ok(html.includes('onboarding-polish.js?v=1'));
for(const id of ['setup','setupStep1','setupStep2','setupStep3','setupStep4','setupStep5','setupStep6','adults','children','budget','planDays','supermarket','dietPattern','ffSetupNumber','ffSetupLabel','ffHouseholdTotal','ffBudgetDaily','ffBudgetLabel','ffPlanSummary']){
 assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Expected one existing setup control: '+id);
}
for(const vibe of ['quick','family','budget','variety','balance']){
 assert.match(html,new RegExp('data-ff-vibe="'+vibe+'"'),'Missing setup preference preset: '+vibe);
 assert.match(html,new RegExp('data-priority="'+vibe+'"'),'Presets must map to a real planner priority: '+vibe);
}
assert.match(js,/primary\.click\(\)/,'Preset selection must invoke the planner preference control');
assert.match(planner,/function choosePriority\(v\)/,'Existing planning priority remains available');
assert.match(css,/#setup \.ff-vibe-grid/,'Vibe control must have mobile styles');
assert.match(css,/prefers-reduced-motion/,'Onboarding needs reduced-motion support');
assert.match(html,/Always check food labels and allergen statements/,'Dietary safety notice must remain');
assert.match(html,/Shopping totals are estimates, not a checkout guarantee/,'No guaranteed supermarket pricing');
console.log('Farefully onboarding polish checks passed: syntax, actual planner controls, budget clarity, safe mobile styling.');
