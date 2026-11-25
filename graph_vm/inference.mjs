// Independent API evaluation; default dry run. Node 18+.
import {lab} from "./static.mjs";
import {writeFileSync} from "node:fs";
const args=process.argv.slice(2);
const flag=k=>args.includes(k);
const opt=(k,d)=>{const i=args.indexOf(k);return i<0?d:args[i+1];};
const model=opt("--model",process.env.ATL_MODEL);
const mode=opt("--mode","all");
const limit=Number(opt("--limit","80"));
if(!Number.isInteger(limit)||limit<1||limit>80)throw Error("--limit must be 1..80");
const modes=["csv-program","fixed-program","atl-program","csv-direct","fixed-direct","atl-direct"];
if(mode!=="all"&&!modes.includes(mode))throw Error("unknown mode");
const jobs=[];lab(()=>0,t=>jobs.push(t));
const ids=[...new Set(jobs.map(t=>t.id))].slice(0,limit);
const selected=jobs.filter(t=>ids.includes(t.id)&&(mode==="all"||mode===t.mode));
if(!flag("--execute")){console.log(JSON.stringify({dryRun:true,cases:ids.length,calls:selected.length,modes:mode,model:model??null},null,2));process.exit(0);}
const url=process.env.ATL_API_URL,key=process.env.ATL_API_KEY;
if(!url||!model)throw Error("Set ATL_API_URL (full chat completions endpoint) and --model");
const results=[];
for(const t of selected){
 const start=Date.now();
 try{
  const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json",...(key?{Authorization:"Bearer "+key}:{})},body:JSON.stringify({model,messages:[{role:"system",content:t.system},{role:"user",content:t.input}]}),signal:AbortSignal.timeout(180000)});
  if(!res.ok)throw Error("HTTP "+res.status);
  const data=await res.json(),answer=data.choices?.[0]?.message?.content;
  if(typeof answer!=="string")throw Error("missing text response");
  results.push({id:t.id,mode:t.mode,correct:t.score(answer),answer,usage:data.usage??null,latencyMs:Date.now()-start});
 }catch(e){results.push({id:t.id,mode:t.mode,correct:false,error:String(e),usage:null,latencyMs:Date.now()-start});}
}
const summary=Object.fromEntries(modes.filter(m=>mode==="all"||m===mode).map(m=>{const r=results.filter(t=>t.mode===m),ok=r.filter(t=>t.correct).length;const allUsage=r.length>0&&r.every(t=>Number.isFinite(t.usage?.total_tokens));const total=allUsage?r.reduce((s,t)=>s+t.usage.total_tokens,0):null;return [m,{attempts:r.length,correct:ok,errors:r.filter(t=>t.error).length,accuracy:ok/r.length,totalTokens:total,correctPerMillion:total>0?ok*1e6/total:null}];}));
const report={model,strictFormat:true,summary,results};writeFileSync(opt("--out","graph-vm-inference.json"),JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify(summary,null,2));
