#!/usr/bin/env node
// Independent API calls; defaults to a dry run. Node 18+.
import {readFileSync,mkdirSync,writeFileSync,appendFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {parseArgs} from "node:util";
import {performance} from "node:perf_hooks";
import {tasks,modes,messages,correct,extract,verifiedAnswers,selfTest} from "./core.mjs";
import {usageOf,summarize} from "../reasoning/core.mjs";

const {values:v}=parseArgs({options:{
 model:{type:"string"},endpoint:{type:"string",default:"http://127.0.0.1:8000/v1/chat/completions"},
 execute:{type:"boolean",default:false},trials:{type:"string",default:"1"},
 "max-calls":{type:"string",default:"144"},"max-output":{type:"string",default:"1024"},
 "max-field":{type:"string",default:"max_tokens"},temperature:{type:"string",default:"0"},
 "timeout-ms":{type:"string",default:"120000"},out:{type:"string",default:"results/semantic-run"},
 "save-notes":{type:"boolean",default:false}
}});
function int(x,min,max){const n=Number(x);if(!Number.isInteger(n)||n<min||n>max)throw Error("Invalid integer "+x);return n;}
const trials=int(v.trials,1,20),max=int(v["max-output"],1,65536),cap=int(v["max-calls"],1,2880),
 timeout=int(v["timeout-ms"],100,600000),temperature=Number(v.temperature);
if(!Number.isFinite(temperature)||temperature<0||temperature>2)throw Error("Invalid temperature");
if(!["max_tokens","max_completion_tokens"].includes(v["max-field"]))throw Error("Invalid max-field");
const url=new URL(v.endpoint);
if(!["http:","https:"].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw Error("Invalid endpoint");
if(url.protocol==="http:"&&!["localhost","127.0.0.1","[::1]"].includes(url.hostname))throw Error("HTTPS required for remote endpoint");
selfTest();
const expected=verifiedAnswers();
for(const t of tasks)if(expected[t.id]!==t.answer)throw Error("Reference mismatch");
const calls=tasks.length*modes.length*trials;
const hash=path=>createHash("sha256").update(readFileSync(new URL(path,import.meta.url))).digest("hex");
const config={version:"0.4.2",model:v.model??null,endpoint:url.href,trials,calls,modes,
 temperature,max_output:max,max_field:v["max-field"],timeout_ms:timeout,output_cap_sum:calls*max,
 case_ids:tasks.map(t=>t.id),core_sha256:hash("./core.mjs"),cases_sha256:hash("../adaptive/complex.mjs"),runner_sha256:hash("./run.mjs"),
 summary_core_sha256:hash("../reasoning/core.mjs"),save_notes:v["save-notes"],node:process.version,
 scope:"Semantic compiler synthetic within-family holdout; independent API requests; provider usage only"};
console.log(JSON.stringify(config,null,2));
if(!v.execute){console.log("Dry run; no requests sent.");process.exit(0);}
if(!v.model||calls>cap)throw Error("Specify --model and sufficient --max-calls");
mkdirSync(v.out,{recursive:false});
writeFileSync(v.out+"/config.json",JSON.stringify(config,null,2)+"\n",{flag:"wx"});
const log=v.out+"/records.jsonl";writeFileSync(log,"",{flag:"wx"});
const key=process.env.ATL_API_KEY,headers={"Content-Type":"application/json",...(key?{Authorization:"Bearer "+key}:{})};
const records=[];
function finish(){
 const summary=summarize(records,modes);
 const d=summary.paired.draft;
 const vsDraft={};
 if(d.attempts)for(const m of modes.filter(x=>x!=="draft")){
  const x=summary.paired[m];
  vsDraft[m]={accuracy_delta_pp:100*(x.accuracy-d.accuracy),
   output_saving_pct:d.output_tokens?100*(1-x.output_tokens/d.output_tokens):null,
   total_saving_pct:d.total_tokens?100*(1-x.total_tokens/d.total_tokens):null};
 }
 summary.comparisons_vs_draft=vsDraft;
 const compare=(a,b)=>{
  const x=summary.paired[a],y=summary.paired[b];
  if(!x?.attempts||!y?.attempts)return null;
  return {accuracy_delta_pp:100*(y.accuracy-x.accuracy),
   output_saving_pct:x.output_tokens>0?100*(1-y.output_tokens/x.output_tokens):null,
   total_saving_pct:x.total_tokens>0?100*(1-y.total_tokens/x.total_tokens):null,
   tre_delta:y.tre!=null&&x.tre!=null?y.tre-x.tre:null};
 };
 summary.primary_compact_vs_atl_input=compare("compact","atl-input");
 summary.secondary_atl_input_vs_atl_io=compare("atl-input","atl-io");
 writeFileSync(v.out+"/summary.json",JSON.stringify(summary,null,2)+"\n");
}
for(let trial=0;trial<trials;trial++)for(let i=0;i<tasks.length;i++){
 const t=tasks[i],offset=(i+trial)%modes.length;
 for(const mode of [...modes.slice(offset),...modes.slice(0,offset)]){
  const start=performance.now();let record;
  const base={case_id:t.id,family:t.family,mode,trial,expected:t.answer};
  try{
   const response=await fetch(url,{method:"POST",headers,redirect:"error",signal:AbortSignal.timeout(timeout),
    body:JSON.stringify({model:v.model,messages:messages(t,mode),temperature,[v["max-field"]]:max,stream:false})});
   if(!response.ok){const e=new Error("HTTP "+response.status);e.httpStatus=response.status;throw e;}
   const payload=await response.json(),c=payload.choices?.[0],s=c?.message?.content;
   const ok=typeof s==="string"&&(c.finish_reason==="stop"||c.finish_reason==null);
   record={...base,status:ok?"ok":"incomplete",correct:ok&&correct(t,s),answer:extract(s),
     format_ok:extract(s)!==null,finish_reason:c?.finish_reason??null,usage:usageOf(payload.usage),
     ...(v["save-notes"]&&typeof s==="string"?{visible_output:s}:{})};
  }catch(e){record={...base,status:"error",correct:false,http_status:e.httpStatus??null,error_type:e.name};}
  record.latency_ms=Math.round(performance.now()-start);
  records.push(record);appendFileSync(log,JSON.stringify(record)+"\n");
  console.log(records.length+"/"+calls,mode,t.id,record.status,record.correct);
  if([400,401,403,404,429].includes(record.http_status)){finish();process.exit(2);}
 }
}
finish();
