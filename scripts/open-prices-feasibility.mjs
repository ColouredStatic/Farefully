// Read-only feasibility check. Never downloads receipt images or publishes raw observations.
const root='https://datasets-server.huggingface.co';
const dataset='openfoodfacts/open-prices';
async function get(path,params){
 const u=new URL(path,root);for(const [k,v] of Object.entries(params))u.searchParams.set(k,String(v));
 const res=await fetch(u,{headers:{'User-Agent':'Farefully-OpenPrices-Feasibility/1.0 (https://farefully.co.uk)','Accept':'application/json'},signal:AbortSignal.timeout(45000)});
 if(!res.ok)throw Error('Dataset API returned HTTP '+res.status+' for '+path);
 return res.json();
}
const splitResponse=await get('/splits',{dataset});
const split=splitResponse.splits?.find(x=>x.split==='train');
if(!split)throw Error('Open Prices train split not available');
const today=new Date(),date=n=>new Date(today.getTime()-n*86400000).toISOString().slice(0,10);
console.log('## Open Prices UK feasibility (read only)');
console.log('Source: https://huggingface.co/datasets/openfoodfacts/open-prices');
console.log('ODbL attribution and share-alike required; never combine with unlicensed sources.');
console.log('| Observation age | GBP records | Partial response |');
console.log('|---|---:|---|');
for(const days of [7,30,90]){
 const data=await get('/filter',{dataset,config:split.config,split:split.split,where:'"currency" = \'GBP\' AND "date" >= \''+date(days)+'\' AND "date" <= \''+date(0)+'\'',length:1});
 if(!Number.isSafeInteger(data.num_rows_total))throw Error('Dataset server did not return a usable count');
 console.log('| Last '+days+' days | '+data.num_rows_total+' | '+(data.partial===true?'Yes':data.partial===false?'No':'Not reported')+' |');
}
console.log('GBP counts alone do not establish UK store location, staple coverage, matching pack sizes, current stock or present checkout price.');
console.log('No production database changes were made.');
