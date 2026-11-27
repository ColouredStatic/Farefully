// Read-only public deployment smoke test. No sign-in, secrets, or customer data.
const base=new URL('https://farefully.co.uk/app/');
async function read(url,kind){
 const response=await fetch(url,{headers:{'User-Agent':'Farefully-Public-Release-Check/1.0','Cache-Control':'no-cache','Accept':kind},signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error(url.pathname+' returned HTTP '+response.status);
 if(new URL(response.url).hostname!==base.hostname)throw Error('Unexpected redirect away from Farefully');
 return response.text();
}
const html=await read(base,'text/html');
const asset=html.match(/src=["'](?:\.\/)?(?:\/app\/)?app\.js\?v=(\d+)["']/);
if(!asset)throw Error('Versioned app JavaScript not found on public planner');
const version=Number(asset[1]);
console.log('Public planner JavaScript version: '+version);
if(version<1202||!html.includes('id="ffPersonalPriceForm"'))throw Error('Household price release not present in public HTML');
const js=await read(new URL('app.js?v='+version,base),'application/javascript');
if(!js.includes('function personalPackPrice')||!js.includes('function bootstrapFarefully'))throw Error('Public JavaScript does not contain expected planner functions');
const rows=JSON.parse(await read(new URL('live-prices.json',base),'application/json'));
if(!Array.isArray(rows)||rows.length<112)throw Error('Public price snapshot has fewer than 112 records');
console.log('Public grocery snapshot records: '+rows.length);
console.log('Public HTML, versioned script and price snapshot verified. Authentication and signed-in flows not checked.');
