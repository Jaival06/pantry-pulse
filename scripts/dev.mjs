import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {loadEnvFile} from 'node:process';
if(fs.existsSync('.env'))loadEnvFile('.env');
fs.mkdirSync('.local',{recursive:true});const db=new DatabaseSync('.local/pantry.sqlite');db.exec(fs.readFileSync('drizzle/0000_pantry.sql','utf8').replaceAll('--> statement-breakpoint',''));
const env={DB:{prepare(sql){return {bind(...values){const stmt=db.prepare(sql);return {all:async()=>({results:stmt.all(...values)}),first:async()=>stmt.get(...values),run:async()=>stmt.run(...values),_execute:()=>stmt.run(...values)}},all:async()=>({results:db.prepare(sql).all()}),run:async()=>db.prepare(sql).run()}},async batch(statements){db.exec('BEGIN');try{const result=statements.map(s=>s._execute());db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}},OPENAI_API_KEY:process.env.OPENAI_API_KEY,OPENAI_MODEL:process.env.OPENAI_MODEL,GROQ_API_KEY:process.env.GROQ_API_KEY,GROQ_MODEL:process.env.GROQ_MODEL};
let worker;async function rebuild(){const r=spawnSync(process.execPath,['scripts/build.mjs'],{stdio:'inherit'});if(r.status!==0)throw Error('Build failed');worker=(await import(pathToFileURL(process.cwd()+'/dist/server/index.js').href+'?t='+Date.now())).default;}
await rebuild();
createServer(async(req,res)=>{try{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>2_000_000){res.writeHead(413);res.end('Upload limit is 2 MB');return;}chunks.push(chunk);}const request=new Request('http://localhost:5173'+req.url,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});const response=await worker.fetch(request,env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(e){console.error(e);res.writeHead(500);res.end('Local server error');}}).listen(5173,'127.0.0.1',()=>console.log('Local: http://localhost:5173'));
let timer;for(const dir of ['web','lib/agents','server'])fs.watch(dir,()=>{clearTimeout(timer);timer=setTimeout(()=>rebuild().catch(console.error),350);});
