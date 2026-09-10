import {type CleanData,sum,round,shift} from './types';
export class FinancialAgent{
 readonly name='Financial Analytics';
 run(data:CleanData,days=30,category='All'){
 const start=days?shift(data.end,1-days):data.start;const items=data.menu.filter(x=>category==='All'||x.category===category).map(item=>{
 const sales=data.sales.filter(x=>x.item_id===item.item_id&&x.date>=start&&x.date<=data.end);const inventory=data.inventory.filter(x=>x.item_id===item.item_id&&x.date>=start&&x.date<=data.end);const units=sum(sales.map(x=>x.quantity_sold)),wasteUnits=sum(inventory.map(x=>x.wastage_units));const revenue=units*item.selling_price,wasteCost=wasteUnits*item.cost_price,contribution=revenue-units*item.cost_price-wasteCost;return {...item,units,wasteUnits,revenue:round(revenue),wasteCost:round(wasteCost),contribution:round(contribution),margin:revenue?round(contribution/revenue*100):0};}).sort((a,b)=>b.contribution-a.contribution);
 const daily=[];for(let date=start;date<=data.end;date=shift(date,1)){const entries=data.sales.filter(x=>x.date===date&&items.some(i=>i.item_id===x.item_id));let revenue=0,cost=0;for(const s of entries){const item=items.find(i=>i.item_id===s.item_id)!;revenue+=s.quantity_sold*item.selling_price;cost+=s.quantity_sold*item.cost_price;}const wasteCost=sum(data.inventory.filter(i=>i.date===date).map(i=>i.wastage_units*(items.find(x=>x.item_id===i.item_id)?.cost_price||0)));daily.push({date,label:date.slice(5),revenue:round(revenue),contribution:round(revenue-cost-wasteCost)});}
 const revenue=round(sum(items.map(x=>x.revenue))),contribution=round(sum(items.map(x=>x.contribution)));return {start,end:data.end,items,daily,revenue,contribution,margin:revenue?round(contribution/revenue*100):0,wasteCost:round(sum(items.map(x=>x.wasteCost))),units:sum(items.map(x=>x.units)),wasteUnits:sum(items.map(x=>x.wasteUnits))};
 }
}
