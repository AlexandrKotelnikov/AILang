// Opt-in independent model evaluation. Never sends expected answers.
import {readFileSync,writeFileSync} from "node:fs";
const args=process.argv.slice(2), value=k=>{const i=args.indexOf(k);return i<0?undefined:args[i+1];};
const path=value("--fixtures"),model=value("--model"),limit=Number(value("--limit")??96);
if(!path||!model||!Number.isInteger(limit)||limit<1||limit>96)throw Error("Use --fixtures FILE --model MODEL [--limit 1..96]");
const fixtures=JSON.parse(readFileSync(path,"utf8")).fixtures;
if(fixtures.length!==576||new Set(fixtures.map(f=>f.id+":"+f.mode)).size!==576||new Set(fixtures.map(f=>f.id)).size!==96)throw Error("Need complete 576 fixtures: generate with --all-fixtures");
const ids=[...new Set(fixtures.map(f=>f.id))].sort((a,b)=>a-b).slice(0,limit);
const selected=fixtures.filter(f=>ids.includes(f.id));
if(!args.includes("--execute")){console.log(JSON.stringify({dryRun:true,model,calls:selected.length,ids}));process.exit(0);}
const url=process.env.ATL_API_URL,key=process.env.ATL_API_KEY,out=value("--out");
if(!url||!key||!out)throw Error("Set authorized full ATL_API_URL, ATL_API_KEY and --out");
const results=[];
for(const f of selected){
 const start=Date.now();let rec={id:f.id,mode:f.mode,correct:false,usage:null};
 try{
 const response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},body:JSON.stringify({model,messages:[{role:"system",content:f.system},{role:"user",content:f.input}]}),signal:AbortSignal.timeout(120000)});
 if(!response.ok)throw Error("HTTP "+response.status);
 const data=await response.json(),answer=data.choices?.[0]?.message?.content;
 rec={...rec,answer,correct:typeof answer==="string"&&answer.trim()===f.expected,usage:data.usage??null,returnedModel:data.model??null};
 }catch(e){rec.error=String(e);}
 rec.elapsedMs=Date.now()-start;results.push(rec);
 // Checkpoint after each response; no hidden retries.
 writeFileSync(out,JSON.stringify({model,complete:false,results},null,2));
}
const aggregate={};
for(const mode of new Set(selected.map(f=>f.mode))){
 const rows=results.filter(r=>r.mode===mode),correct=rows.filter(r=>r.correct).length;
 const complete=rows.every(r=>Number.isFinite(r.usage?.total_tokens)&&r.usage.total_tokens>0);
 const tokens=complete?rows.reduce((s,r)=>s+r.usage.total_tokens,0):null;
 aggregate[mode]={n:rows.length,correct,accuracy:correct/rows.length,totalTokens:tokens,correctPerMillion:tokens?1e6*correct/tokens:null};
}
writeFileSync(out,JSON.stringify({model,complete:true,aggregate,results},null,2));
console.log(JSON.stringify(aggregate,null,2));
