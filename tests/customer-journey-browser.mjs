import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const home=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const account=readFileSync(new URL('../app/account.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../assets/styles.css',import.meta.url),'utf8');
const slugs=['budget-meal-planner','family-meal-planner','packed-lunch-planner','dietary-meal-planner'];
const guides=Object.fromEntries(slugs.map(slug=>[slug,readFileSync(new URL('../'+slug+'/index.html',import.meta.url),'utf8')]));
const sitemap=readFileSync(new URL('../sitemap.xml',import.meta.url),'utf8');
for(const slug of slugs){const html=guides[slug];assert.ok(sitemap.includes('https://farefully.co.uk/'+slug+'/'));assert.ok(home.includes('href="/'+slug+'/'));assert.ok(html.includes('rel="canonical" href="https://farefully.co.uk/'+slug+'/'));assert.equal((html.match(/<h1[ >]/g)||[]).length,1);assert.ok(html.includes('/app/account.html?mode=signup'));for(const other of slugs.filter(x=>x!==slug))assert.ok(html.includes('href="/'+other+'/'));}

const mock=`window.supabase={createClient(){return {auth:{getUser:async()=>({data:{user:window.fakeUser||null},error:null}),signUp:async(x)=>{window.lastAuth={kind:'signup',email:x.email};return {data:{},error:null}},signInWithPassword:async(x)=>{window.lastAuth={kind:'signin',email:x.email};window.fakeUser={email:x.email};return {data:{},error:null}},resetPasswordForEmail:async()=>({error:null}),onAuthStateChange(){},signOut:async()=>{window.fakeUser=null;return {error:null}}},rpc:async()=>({data:false,error:null}),functions:{invoke:async()=>({data:{mode:'disabled'},error:null})}}}}`;
const browser=await chromium.launch({headless:true});
try{
 for(const width of [320,390,1280]){
 const page=await browser.newPage({viewport:{width,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='cdn.jsdelivr.net')return route.fulfill({contentType:'text/javascript',body:mock});
  if(u.origin!=='http://farefully.test')return route.abort();
  if(u.pathname==='/')return route.fulfill({contentType:'text/html',body:home});
  const slug=u.pathname.replace(/^\/|\/$/g,'');if(guides[slug])return route.fulfill({contentType:'text/html',body:guides[slug]});
  if(u.pathname==='/assets/styles.css')return route.fulfill({contentType:'text/css',body:css});
  if(u.pathname==='/app/account.html')return route.fulfill({contentType:'text/html',body:account});
  return route.abort();
 });
 await page.goto('http://farefully.test/');
 await page.locator('#guides a[href="/family-meal-planner/"]').first().click();
 await page.getByRole('heading',{name:'A week of family meals without the daily guessing.'}).waitFor();
 assert.equal(await page.locator('.guide-table tbody tr').count(),7);
 const guideBounds=await page.locator('.guide-content').evaluate(el=>({right:el.getBoundingClientRect().right,viewport:document.documentElement.clientWidth,scroll:el.scrollWidth,client:el.clientWidth}));
 assert.ok(guideBounds.right<=guideBounds.viewport+1&&guideBounds.scroll<=guideBounds.client+1,JSON.stringify(guideBounds));
 await page.getByRole('link',{name:'Start planning free'}).click();
 await page.getByRole('heading',{name:'Create your free account'}).waitFor();
 assert.equal(await page.locator('#password').getAttribute('autocomplete'),'new-password');
 await page.locator('#email').fill('synthetic@example.invalid');
 await page.locator('#password').fill('synthetic-password');
 await page.getByRole('button',{name:'Create free account'}).click();
 await page.waitForFunction(()=>window.lastAuth?.kind==='signup');
 await page.getByRole('button',{name:'Already registered? Sign in'}).click();
 assert.equal(await page.locator('#password').getAttribute('autocomplete'),'current-password');
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.getByRole('heading',{name:'Your Farefully account'}).waitFor();
 await page.waitForFunction(()=>document.getElementById('farefullyBillingSummary').textContent.includes('currently unavailable'));
 assert.equal(await page.locator('[data-farefully-checkout="monthly"]').isVisible(),false);
 assert.ok(await page.getByRole('link',{name:/Open my meal planner/}).isVisible());
 const bounds=await page.locator('.card').evaluate(el=>({scroll:el.scrollWidth,client:el.clientWidth,right:el.getBoundingClientRect().right,viewport:document.documentElement.clientWidth}));
 assert.ok(bounds.scroll<=bounds.client+1&&bounds.right<=bounds.viewport+1,JSON.stringify(bounds));
 await page.goto('http://farefully.test/app/account.html?intent=plus');
 await page.getByText('Plan further ahead with Plus',{exact:true}).waitFor();
 assert.deepEqual(errors,[]);
 await page.close();
 }
}finally{await browser.close();}
console.log('Public customer journey passed at 320, 390 and 1280px with synthetic account and disabled billing.');
