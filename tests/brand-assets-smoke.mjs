// Validate all public brand placements and fully decode the committed PNG payloads.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const pages=['index.html','404.html','how-it-works/index.html','privacy/index.html','safety/index.html','help/index.html','beta/index.html','budget-meal-planner/index.html','family-meal-planner/index.html','packed-lunch-planner/index.html','dietary-meal-planner/index.html'];
for(const p of pages){const s=read(p).toString();assert.ok(s.includes('/assets/brand/wordmark.svg'),p+' missing new logo');assert.doesNotMatch(s,/M20 46V18h25v7H28v5h14v7H28v9z/);assert.match(s,/alt="Farefully"/);assert.match(s,/Big appetites\. Smarter budgets\./);}
for(const p of ['app/account.html','app/install.html','app/plus-preview.html'])assert.ok(read(p).toString().includes('/assets/brand/wordmark.svg'),p+' missing logo');
const app=read('app/index.html').toString();assert.ok(app.includes('/assets/brand/wordmark-reverse.svg'));assert.ok(app.includes('/assets/brand/icon.svg'));assert.ok(!app.includes('<div class="logo">F</div>'));
for(const p of ['favicon.svg','assets/brand/icon.svg','assets/brand/icon-yellow.svg','assets/brand/wordmark.svg','assets/brand/wordmark-reverse.svg','assets/brand/social-share.svg']){const s=read(p).toString();assert.match(s,/<svg /);assert.match(s,/M12 202 C5 202/);assert.match(s,/#073B29/);assert.match(s,/#FFD230/);assert.doesNotMatch(s,/<image\b|<script\b/);}
function inspectPNG(p,w,h){
 const b=read(p);assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(b.readUInt32BE(16),w);assert.equal(b.readUInt32BE(20),h);
 let i=8,idat=[],palette=null;while(i<b.length){const n=b.readUInt32BE(i),kind=b.toString('ascii',i+4,i+8);assert.ok(i+12+n<=b.length);if(kind==='IDAT')idat.push(b.subarray(i+8,i+8+n));if(kind==='PLTE')palette=b.subarray(i+8,i+8+n);i+=n+12;if(kind==='IEND')break;}
 assert.ok(idat.length&&palette,'Missing palette or image data: '+p);
 assert.equal(b[24],4);assert.equal(b[25],3);const raw=inflateSync(Buffer.concat(idat));assert.equal(raw.length,(Math.ceil(w/2)+1)*h);
 const hex=palette.toString('hex');assert.ok(hex.includes('073b29')&&hex.includes('ffd230')&&hex.includes('ffffff'),'Expected brand palette: '+p);
 const used=new Set();for(let y=0;y<h;y++){const stride=Math.ceil(w/2)+1;assert.equal(raw[y*stride],0);for(let x=0;x<w;x++){const v=raw[y*stride+1+(x>>1)];used.add(x%2?v&15:v>>4);}}assert.ok(used.size>=3,'Expected multiple colours in '+p);
}
inspectPNG('app/icons/icon-192.png',192,192);
inspectPNG('app/icons/icon-512.png',512,512);
inspectPNG('assets/social-share.png',1200,630);
assert.equal(JSON.parse(read('app/manifest.webmanifest')).theme_color,'#073B29');
console.log('Foodie F checked: public and app placements, native vector geometry, PNG dimensions, decompressed pixels and palette.');
