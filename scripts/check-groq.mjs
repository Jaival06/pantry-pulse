import {loadEnvFile} from 'node:process';
loadEnvFile('.env');
if(!process.env.GROQ_API_KEY){console.error('GROQ_API_KEY is missing or empty in .env.');process.exit(1);}
try{const response=await fetch('https://api.groq.com/openai/v1/models',{headers:{Authorization:`Bearer ${process.env.GROQ_API_KEY}`},signal:AbortSignal.timeout(20000)});if(!response.ok){console.error(`Groq authentication/model listing failed: HTTP ${response.status}`);process.exit(1);}const result=await response.json();console.log(JSON.stringify({models:result.data.filter(m=>m.active!==false).map(m=>m.id)}));}catch(error){console.error('Groq network request failed:',error.cause?.code||error.code||'network error');process.exit(1);}
