import {type Row,type RawData,type CleanData,type Item,type Sale,type Stock} from './types';
export function parseCSV(text:string):Row[]{
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell.trim());cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw Error('CSV contains an unclosed quote.');row.push(cell.trim());if(row.some(Boolean))rows.push(row);const headers=rows.shift()?.map(x=>x.replace(/^\uFEFF/,''));if(!headers?.length)throw Error('CSV is empty.');if(new Set(headers).size!==headers.length)throw Error('Duplicate CSV headers.');return rows.map((r,i)=>{if(r.length!==headers.length)throw Error(`Row ${i+2}: column count does not match header.`);return Object.fromEntries(headers.map((h,j)=>[h,r[j]]));});
}
const required={menu:['item_id','item_name','category','selling_price','cost_price'],sales:['date','item_id','quantity_sold','payment_type','status'],inventory:['date','item_id','starting_stock','wastage_units','reorder_threshold','supplier_lead_days']};
export class IngestionAgent{
 readonly name='Ingestion & Data';
 run(raw:RawData):CleanData{
 const result:CleanData={menu:[],sales:[],inventory:[],issues:[],total:0,start:'',end:''};
 for(const rows of Object.values(raw))if(!Array.isArray(rows)||rows.length>25000)throw Error('CSV row limit is 25,000 per source.');
 for(const source of ['menu','sales','inventory'] as const){const rows=raw[source];if(!Array.isArray(rows)||!rows.length)throw Error(`${source}: no rows supplied.`);for(const h of required[source])if(!(h in rows[0]))throw Error(`${source}: missing column ${h}.`);result.total+=rows.length;const seen=new Set<string>();
 rows.forEach((r,index)=>{let reason='';const numeric=source==='menu'?['selling_price','cost_price']:source==='sales'?['quantity_sold']:['starting_stock','wastage_units','reorder_threshold','supplier_lead_days'];
 if(required[source].some(h=>typeof r[h]!=='string'||!r[h].trim()))reason='Missing required value';
 if(numeric.some(h=>!r[h]?.trim()||!Number.isFinite(Number(r[h]))||Number(r[h])<0||Number(r[h])>1000000))reason='Invalid number (allowed range 0–1,000,000)';
 if(source==='menu'&&!['Food','Beverage'].includes(r.category))reason='Category must be Food or Beverage';
 if(source==='inventory'&&Number(r.supplier_lead_days)>30)reason='Supplier lead time exceeds 30 days';
 if(source!=='menu'&&numeric.some(h=>!Number.isInteger(Number(r[h]))))reason='Units and lead times must be whole numbers';
 if(source!=='menu'&&(!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!Number.isFinite(Date.parse(r.date))||new Date(r.date).toISOString().slice(0,10)!==r.date))reason='Invalid date';
 if(source!=='menu'&&!result.menu.some(x=>x.item_id===r.item_id))reason='Unknown menu item';
 if(source==='sales'&&r.status!=='COMPLETED')reason=`Excluded status: ${r.status}`;
 if(source==='inventory'&&Number(r.wastage_units)>Number(r.starting_stock))reason='Wastage exceeds starting stock';
 const key=source==='menu'?r.item_id:source==='inventory'?`${r.date}:${r.item_id}`:JSON.stringify(r);
 if(seen.has(key))reason='Duplicate record';
 if(reason){result.issues.push({source,row:index+2,reason,item:r.item_id,date:r.date||''});return;}seen.add(key);
 const normalized={...r,...Object.fromEntries(numeric.map(h=>[h,Number(r[h])]))};
 if(source==='menu')result.menu.push(normalized as unknown as Item);else if(source==='sales')result.sales.push(normalized as unknown as Sale);else result.inventory.push(normalized as unknown as Stock);
 });}
 if(!result.menu.length||!result.sales.length||!result.inventory.length)throw Error('No usable data after validation. Check the quality report and input files.');
 result.sales.sort((a,b)=>a.date.localeCompare(b.date));result.inventory.sort((a,b)=>a.date.localeCompare(b.date));result.start=result.sales[0].date;result.end=result.sales.at(-1)!.date;if(Date.parse(result.end)-Date.parse(result.start)>3660*86400000)throw Error('CSV date range exceeds 10 years.');return result;
 }
}
