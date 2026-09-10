import {type RawData,type CleanData,shift} from './types';
import {IngestionAgent} from './ingestion';
import {FinancialAgent} from './financial';
import {DemandAgent} from './demand';
import {AnomalyAgent} from './anomaly';
export class Orchestrator{
 readonly ingestion=new IngestionAgent();readonly financial=new FinancialAgent();readonly demand=new DemandAgent();readonly anomaly=new AnomalyAgent();
 run(raw:RawData,days=30,category='All',horizon=7){const trace:{agent:string;status:string;durationMs:number;detail:string}[]=[];const step=<T>(agent:string,detail:string,fn:()=>T):T=>{const start=Date.now();const output=fn();trace.push({agent,status:'complete',durationMs:Date.now()-start,detail});return output;};
 const data=step(this.ingestion.name,'Validate schema, quarantine invalid rows, normalize and join menu IDs.',()=>this.ingestion.run(raw));
 const finance=step(this.financial.name,'Calculate revenue minus item costs and recorded wastage; rank contributions.',()=>this.financial.run(data,days,category));
 const allForecasts=step(this.demand.name,'Backtest weekday and rolling-average models; choose lowest absolute error per item.',()=>this.demand.run(data,horizon));
 const allAlerts=step(this.anomaly.name,'Compare each observation against prior data; check supplier lead-time coverage.',()=>this.anomaly.run(data,allForecasts));
 const forecasts=allForecasts.filter(x=>category==='All'||x.category===category);const alerts=allAlerts.filter(a=>forecasts.some(f=>f.item_id===a.item_id));
 const actions=forecasts.filter(x=>x.reorder).map(f=>{const recentWaste=alerts.some(a=>a.item_id===f.item_id&&a.kind==='Wastage spike'&&a.date>=shift(data.end,-6));const lowMargin=(finance.items.find(x=>x.item_id===f.item_id)?.margin||0)<40;return {id:f.item_id,item:f.item_name,quantity:f.quantity,priority:f.coverage!==null&&f.coverage<f.lead?'high':'medium',decision:recentWaste?'Review before reordering':lowMargin?'Reorder essentials; review margin':'Reorder to cover supplier lead time',reason:recentWaste?'Demand suggests replenishment, but recent wastage conflicts. Verify spoilage and batch size before ordering.':lowMargin?'Stock coverage takes priority over low margin. Avoid a promotion until costs are reviewed.':`Estimated ${f.coverage} days of stock vs ${f.lead}-day lead time.`,needsReview:recentWaste||lowMargin};});
 trace.push({agent:'Orchestrator',status:'complete',durationMs:0,detail:'Prioritize availability, withhold unreliable stock advice, and route waste / margin conflicts for owner review.'});
 return {finance,forecasts,alerts,actions,trace,quality:{issues:data.issues,total:data.total,accepted:data.total-data.issues.length,sales:data.sales.length,inventory:data.inventory.length,menu:data.menu.length,start:data.start,end:data.end},generatedAt:new Date().toISOString(),horizon,days,category};
 }
}
export type Report=ReturnType<Orchestrator['run']>;
