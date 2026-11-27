import {readFileSync} from 'node:fs';
const rows=JSON.parse(readFileSync(new URL('../app/live-prices.json',import.meta.url),'utf8'));
const now=Date.now(), day=86400000, groups=new Map();
for(const row of rows){
 const retailer=row.retailer||'Unknown',t=Date.parse(row.scrapedAt||row.fetchedAt||row.updatedAt||'');
 const g=groups.get(retailer)||{total:0,fresh:0,due:0,stale:0,invalid:0};
 g.total++;
 if(!Number.isFinite(t)||t>now||!Number.isFinite(row.price)||row.price<=0)g.invalid++;
 else if(now-t>7*day)g.stale++;
 else {g.fresh++;if(now-t>=5*day)g.due++;}
 groups.set(retailer,g);
}
console.log('## Grocery snapshot freshness (UTC)');
console.log('| Retailer | Records | Within 7 days | Due within 2 days | Expired | Invalid |');
console.log('|---|---:|---:|---:|---:|---:|');
for(const [name,g] of [...groups].sort())console.log('| '+name+' | '+g.total+' | '+g.fresh+' | '+g.due+' | '+g.stale+' | '+g.invalid+' |');
console.log('\nFreshness refers to observation age, not local stock or proof of checkout price. No prices or timestamps were changed.');
if([...groups.values()].some(g=>g.invalid))process.exitCode=1;
