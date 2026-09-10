import fs from 'node:fs';
import path from 'node:path';
import {stripTypeScriptTypes} from 'node:module';
const sources=['lib/agents/types.ts','lib/agents/ingestion.ts','lib/agents/financial.ts','lib/agents/demand.ts','lib/agents/anomaly.ts','lib/agents/orchestrator.ts','lib/agents/conversation.ts','server/worker.ts'];
let code=`const SEED=${fs.readFileSync('data/seed.json','utf8')};\n`;
for(const file of sources){let src=fs.readFileSync(file,'utf8').replace(/^import .*?;\r?\n/gm,'');src=stripTypeScriptTypes(src,{mode:'transform'}).replace(/export (?=(class|function|const))/g,'');code+=src+'\n';}
const assets={};for(const file of ['index.html','app.js','styles.css','favicon.svg'])assets['/'+file]={body:fs.readFileSync('web/'+file,'utf8'),type:({'html':'text/html; charset=utf-8','js':'text/javascript; charset=utf-8','css':'text/css; charset=utf-8','svg':'image/svg+xml'})[file.split('.').at(-1)]};code=`const ASSET_CONTENT=${JSON.stringify(assets)};\n`+code;
fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/.openai',{recursive:true});fs.writeFileSync('dist/server/index.js',code);fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');fs.cpSync('drizzle','dist/.openai/drizzle',{recursive:true});console.log('Built dashboard and 5-agent runtime without external packages.');
