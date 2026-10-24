// Farefully premium palette consistency and WCAG contrast checks.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../app/index.html',import.meta.url),'utf8');
const site=readFileSync(new URL('../assets/styles.css',import.meta.url),'utf8');
const landing=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const palette=['#153F32','#176B55','#E9F3EA','#F8F7F2','#FFFDF8','#C09249','#17322E','#DCE7DE'];
for(const hex of palette){
 assert.ok(app.includes(hex),'App missing shared colour '+hex);
 assert.ok(site.includes(hex),'Website missing shared colour '+hex);
}
assert.match(app,/\.memberstatus \.membershipbadge\{/);
assert.match(site,/\.plans-card-plus:before/);
assert.match(app,/--ff-leaf:#176B55/);
assert.match(site,/--green:var\(--ff-leaf\)/);
assert.match(landing,/Early access/i);
assert.match(landing,/Plus offers fourteen-day plans/);
assert.match(app,/id="farefullyPlusBadge"/);
assert.match(app,/id="basketTotal"/);
function luminance(hex){
 const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
  .map(x=>x<=0.04045?x/12.92:((x+.055)/1.055)**2.4);
 return c[0]*.2126+c[1]*.7152+c[2]*.0722;
}
function contrast(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
assert.ok(contrast('#FFFFFF','#176B55')>=4.5,'Primary buttons need accessible white text contrast');
assert.ok(contrast('#FFFFFF','#153F32')>=7,'Deep forest should support strong headline contrast');
assert.ok(contrast('#68521C','#FBF4E5')>=4.5,'Plus label needs accessible text contrast');
assert.ok(contrast('#60756B','#F8F7F2')>=4.5,'Muted text must remain readable on oat background');
assert.ok(contrast('#FFFFFF','#C09249')<4.5,'Brass is decorative, not a white-text CTA');
console.log('Farefully premium palette passes shared token and contrast checks.');
