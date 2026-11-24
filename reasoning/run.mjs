#!/usr/bin/env node
// Node >=18; OpenAI-compatible chat completions endpoint. Dry run by default.
import { readFileSync, readdirSync, mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { parseArgs } from "node:util";
import { performance } from "node:perf_hooks";
import { MODES, messages, selectCases, makeRecord, summarize, selfTest } from "./core.mjs";

const { values:v } = parseArgs({options:{
 model:{type:"string"}, endpoint:{type:"string",default:"http://127.0.0.1:8000/v1/chat/completions"},
 split:{type:"string",default:"dev"}, "per-family":{type:"string",default:"2"},
 trials:{type:"string",default:"1"}, modes:{type:"string",default:MODES.join(",")},
 "max-output":{type:"string",default:"512"}, "max-field":{type:"string",default:"max_tokens"},
 temperature:{type:"string",default:"0"}, "timeout-ms":{type:"string",default:"120000"},
 "max-calls":{type:"string",default:"100"}, out:{type:"string",default:"results/reasoning"},
 execute:{type:"boolean",default:false}, "save-notes":{type:"boolean",default:false},
 "self-test":{type:"boolean",default:false}
}});
if(v["self-test"]){console.log(selfTest());process.exit(0);}
function integer(s,min,max){const n=Number(s);if(!Number.isInteger(n)||n<min||n>max)throw Error("Invalid integer: "+s);return n;}
const per=integer(v["per-family"],1,60),trials=integer(v.trials,1,20),max=integer(v["max-output"],1,65536);
const timeout=integer(v["timeout-ms"],100,600000),maxCalls=integer(v["max-calls"],1,100000);
const temperature=Number(v.temperature);
if(!Number.isFinite(temperature)||temperature<0||temperature>2)throw Error("Invalid temperature");
if(!["max_tokens","max_completion_tokens"].includes(v["max-field"]))throw Error("Invalid max-field");
const modes=v.modes.split(",");
if(!modes.length||new Set(modes).size!==modes.length||modes.some(m=>!MODES.includes(m)))throw Error("Invalid modes");
const url=new URL(v.endpoint);
if(!["http:","https:"].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw Error("Endpoint must be an HTTP(S) URL without embedded credentials/query/fragment");
if(url.protocol==="http:"&&!["localhost","127.0.0.1","[::1]"].includes(url.hostname))throw Error("Use HTTPS for non-local endpoints");
const dir=new URL("../lab/data/",import.meta.url);
const files=readdirSync(dir).filter(x=>x.endsWith(".jsonl")).sort();
const hashes={},rows=[];
for(const file of files){
 const body=readFileSync(new URL(file,dir),"utf8");
 hashes[file]=createHash("sha256").update(body).digest("hex");
 rows.push(...body.trim().split("\n").map(JSON.parse));
}
if(rows.length!==1000||new Set(rows.map(r=>r.id)).size!==1000)throw Error("Invalid corpus");
const selected=selectCases(rows,v.split,per);
const calls=selected.length*modes.length*trials;
const config={version:"0.3",model:v.model??null,endpoint:url.href,split:v.split,per_family:per,trials,modes,
 temperature,max_output:max,max_field:v["max-field"],timeout_ms:timeout,calls,output_token_cap_sum:calls*max,
 corpus_hashes:hashes,case_ids:selected.map(r=>r.id),node:process.version,
 core_sha256:createHash("sha256").update(readFileSync(new URL("./core.mjs",import.meta.url))).digest("hex"),
 save_notes:v["save-notes"],execute:v.execute};
console.log(JSON.stringify(config,null,2));
if(!v.execute){console.log("Dry run only. No requests made.");process.exit(0);}
if(!v.model)throw Error("--model is required with --execute");
if(calls>maxCalls)throw Error("Planned calls exceed --max-calls. Increase explicitly if intended.");
// Avoid accidental mixing or overwriting prior runs.
mkdirSync(v.out,{recursive:false});
writeFileSync(v.out+"/config.json",JSON.stringify(config,null,2)+"\n",{flag:"wx"});
const log=v.out+"/records.jsonl";writeFileSync(log,"",{flag:"wx"});
const key=process.env.ATL_API_KEY;
const headers={"Content-Type":"application/json",...(key?{Authorization:"Bearer "+key}:{})};
const records=[];
for(let trial=0;trial<trials;trial++){
 for(let i=0;i<selected.length;i++){
  const row=selected[i];
  // Rotate ordering to reduce systematic order effects.
  const offset=(i+trial)%modes.length;
  for(const mode of [...modes.slice(offset),...modes.slice(0,offset)]){
   const start=performance.now();
   let record;
   try{
    const response=await fetch(url,{method:"POST",headers,redirect:"error",
      signal:AbortSignal.timeout(timeout),
      body:JSON.stringify({model:v.model,messages:messages(row,mode),temperature,[v["max-field"]]:max,stream:false})});
    if(!response.ok){const e=new Error("HTTP "+response.status);e.httpStatus=response.status;throw e;}
    const payload=await response.json();
    record=makeRecord(row,mode,trial,payload,Math.round(performance.now()-start),v["save-notes"]);
   }catch(e){
    record={case_id:row.id,family:row.family,split:row.split,mode,trial,status:"error",correct:false,
      latency_ms:Math.round(performance.now()-start),http_status:e.httpStatus??null,error_type:e.name};
   }
   records.push(record);appendFileSync(log,JSON.stringify(record)+"\n");
   console.log(records.length+"/"+calls,mode,row.id,record.status,record.correct);
   // Stop on authentication, unsupported request, or rate limit instead of retrying blindly.
   if([400,401,403,404,429].includes(record.http_status)){
    writeFileSync(v.out+"/summary.json",JSON.stringify(summarize(records,modes),null,2)+"\n");
    console.error("Stopped after HTTP "+record.http_status+"; partial records saved.");
    process.exit(2);
   }
  }
 }
}
writeFileSync(v.out+"/summary.json",JSON.stringify(summarize(records,modes),null,2)+"\n");
console.log("Saved "+records.length+" records to "+v.out);
