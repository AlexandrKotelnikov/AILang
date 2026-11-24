// ATL v0.3 pure experiment logic. No model calls here.
const MODES=["baseline","draft","atl-r","atl-macro","atl-full"];
const COMMON="Solve the task accurately. Give a checkable derivation, then end with exactly one line FINAL: <answer>. For numeric answers give the number only (in the requested units); for truth use true, false or unknown; for yes/no use yes or no; for option choice give its letter. No text after FINAL.";
const ATL="Write concise ATL notes using optional fields fact:, assume:, infer:, check:, unknown:, result:. Operators: => implication, ! negation, | OR, == equality, <= and < inequalities. Preserve constraints and uncertainty; do not invent evidence. Expand when necessary.";
const MACROS="Optional logical macros: MP(A,B): from A=>B and A true infer B true; MT(A,B): from A=>B and B false infer A false; DS(A,B): from A|B and A false infer B true (swap arguments if needed); AC(A,B): from A=>B and B true alone, A unknown; DA(A,B): from A=>B and A false alone, B unknown. Apply only if premises hold. Use a macro only if useful, followed by any essential conclusion/check.";
const INPUT="ATL input fields: goal=objective, given=input facts, must=hard requirement, unknown=missing information. Each line is label: payload.";
function messages(row, mode){
 if(!MODES.includes(mode))throw Error("invalid mode");
 let instruction=COMMON;
 if(mode==="baseline")instruction+=" Use ordinary English sentences for the derivation.";
 if(mode==="draft")instruction+=" Use very short English notes or equations, not full sentences.";
 if(mode.startsWith("atl-"))instruction+=" "+ATL;
 if(mode==="atl-macro"||mode==="atl-full")instruction+=" "+MACROS;
 if(mode==="atl-full")instruction+=" "+INPUT;
 const prompt=mode==="atl-full"?row.atl.map(([k,v])=>k+": "+v).join("\n"):row.en;
 return [{role:"system",content:instruction},{role:"user",content:prompt}];
}

function selectCases(rows,split,limit){
 if(!["dev","test"].includes(split)||!Number.isInteger(limit)||limit<1||limit>60)throw Error("invalid selection");
 const counts={};
 return rows.filter(r=>r.split===split).sort((a,b)=>a.id.localeCompare(b.id)).filter(r=>{
  counts[r.family]=(counts[r.family]||0)+1;return counts[r.family]<=limit;
 });
}

function extract(text){
 if(typeof text!=="string")return {answer:null,notes:"",formatOk:false};
 const lines=text.trim().split(/\r?\n/);
 const hits=lines.filter(x=>/^\s*FINAL\s*:/i.test(x));
 const match=lines.at(-1)?.match(/^\s*FINAL:\s*(\S.*?)\s*$/);
 if(hits.length!==1||!match)return {answer:null,notes:"",formatOk:false};
 return {answer:match[1],notes:lines.slice(0,-1).join("\n"),formatOk:true};
}

function score(row,answer){
 if(answer===null||typeof answer!=="string")return false;
 const target=String(row.answer);
 if(/^-?\d+(?:\.\d+)?$/.test(target)){
  if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(answer.trim()))return false;
  const a=Number(answer),b=Number(target);
  return Number.isFinite(a)&&Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b));
 }
 return answer.trim().toLowerCase()===target.toLowerCase();
}

function macroAudit(row,notes){
 const calls=[...notes.matchAll(/\b(MP|MT|DS|AC|DA)\s*\(\s*([A-Za-z][A-Za-z0-9_]*)\s*,\s*([A-Za-z][A-Za-z0-9_]*)\s*\)/g)];
 if(!calls.length)return {calls:0,status:"none"};
 const given=row.atl.find(x=>x[0]==="given")?.[1]??"";
 let expected=null;
 if(row.family==="implication"){
  const m=given.match(/^(\w+)=>(\w+); (\w+) (true|false)$/);
  if(m){const [,a,b,c,v]=m;expected=[c===a?(v==="true"?"MP":"DA"):(v==="true"?"AC":"MT"),a,b];}
 }else if(row.family==="disjunction"){
  const m=given.match(/^(\w+)\|(\w+); (\w+) false$/);
  if(m){const [,a,b,c]=m;expected=["DS",c,c===a?b:a];}
 }
 if(!expected)return {calls:calls.length,status:"not_evaluated"};
 return {calls:calls.length,status:calls.every(c=>c.slice(1).every((v,i)=>v===expected[i]))?"premises_match":"premises_mismatch"};
}

function usageOf(raw){
 const num=x=>Number.isSafeInteger(x)&&x>=0?x:null;
 const input=num(raw?.prompt_tokens),output=num(raw?.completion_tokens),reported=num(raw?.total_tokens);
 const reasoning=num(raw?.completion_tokens_details?.reasoning_tokens);
 const total=input!==null&&output!==null?input+output:null;
 return {input,output,total,reported_total:reported,reasoning:reasoning!==null&&output!==null&&reasoning<=output?reasoning:null,
 consistency:total===null||reported===null?null:total===reported};
}

function summarize(records,modes){
 const stats=group=>{
  const completed=group.filter(r=>r.status==="ok"), counted=group.filter(r=>r.usage?.total!==null&&r.usage?.total!==undefined&&r.usage.consistency!==false);
  const sums=key=>counted.reduce((a,r)=>a+r.usage[key],0);
  const reasoning=completed.filter(r=>r.usage?.reasoning!==null&&r.usage?.reasoning!==undefined);
  const total=sums("total"), correct=counted.filter(r=>r.correct).length;
  const lat=group.map(r=>r.latency_ms).filter(Number.isFinite).sort((a,b)=>a-b);
  const audited=completed.filter(r=>["premises_match","premises_mismatch"].includes(r.macro?.status));
  return {attempts:group.length,completed:completed.length,correct:group.filter(r=>r.correct).length,
   accuracy:group.length?group.filter(r=>r.correct).length/group.length:null,
   format_ok:completed.filter(r=>r.format_ok).length,usage_covered:counted.length,
   input_tokens:counted.length?sums("input"):null,output_tokens:counted.length?sums("output"):null,
   total_tokens:counted.length?total:null,tre:total>0?1e6*correct/total:null,
   reasoning_covered:reasoning.length,reasoning_tokens:reasoning.length?reasoning.reduce((a,r)=>a+r.usage.reasoning,0):null,
   median_latency_ms:lat.length?(lat[Math.floor((lat.length-1)/2)]+lat[Math.floor(lat.length/2)])/2:null,
   macro_audited:audited.length,macro_mismatch:audited.filter(r=>r.macro.status==="premises_mismatch").length};
 };
 const per_mode=Object.fromEntries(modes.map(m=>[m,stats(records.filter(r=>r.mode===m))]));
 const by_family={};for(const f of new Set(records.map(r=>r.family)))by_family[f]=Object.fromEntries(modes.map(m=>[m,stats(records.filter(r=>r.family===f&&r.mode===m))]));
 const groups=new Map();
 for(const r of records){const k=JSON.stringify([r.case_id,r.trial]);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);}
 const eligible=[...groups.values()].filter(g=>g.length===modes.length&&new Set(g.map(r=>r.mode)).size===modes.length&&g.every(r=>r.status==="ok"&&r.usage?.total!=null&&r.usage.consistency!==false));
 const matched=eligible.flat(), paired=Object.fromEntries(modes.map(m=>[m,stats(matched.filter(r=>r.mode===m))]));
 const base=paired.baseline;
 const comparisons={};
 if(base?.attempts)for(const m of modes.filter(m=>m!=="baseline")){
  const v=paired[m];comparisons[m]={accuracy_delta_pp:100*(v.accuracy-base.accuracy),
   output_saving_pct:base.output_tokens>0?100*(1-v.output_tokens/base.output_tokens):null,
   total_saving_pct:base.total_tokens>0?100*(1-v.total_tokens/base.total_tokens):null};
 }
 return {per_mode,by_family,paired_complete_groups:eligible.length,paired,comparisons_vs_baseline:comparisons,
 warning:"TRE and savings are descriptive over usage-covered records; failed/missing-usage calls may be billed. Paired comparison excludes incomplete groups. Reasoning tokens are provider-reported subsets, never added to completion tokens."};
}

function makeRecord(row,mode,trial,response,latency,saveNotes=false){
 const choice=response?.choices?.[0], msg=choice?.message;
 const parsed=extract(msg?.content);
 const status=choice&&typeof msg?.content==="string"&&(choice.finish_reason==="stop"||choice.finish_reason==null)?"ok":"incomplete";
 return {case_id:row.id,family:row.family,split:row.split,mode,trial,status,
  finish_reason:choice?.finish_reason??null,latency_ms:latency,
  answer:parsed.answer,expected:row.answer,format_ok:parsed.formatOk,
  correct:status==="ok"&&parsed.formatOk&&score(row,parsed.answer),
  usage:usageOf(response?.usage),macro:macroAudit(row,parsed.notes),
  ...(saveNotes?{notes:parsed.notes}:{})};
}

function selfTest(){
 const assert=(x,m)=>{if(!x)throw Error(m)};
 const row={id:"implication-001",family:"implication",split:"test",en:"If A then B. B false. A?",atl:[["given","A=>B; B false"],["goal","A truth"]],answer:"false"};
 for(const m of MODES.slice(0,4))assert(messages(row,m)[1].content===row.en,"input isolation");
 assert(messages(row,"atl-full")[1].content.includes("given: A=>B"),"full input");
 assert(!messages(row,"atl-macro").some(x=>x.content.includes("FINAL: false")),"answer leakage");
 assert(extract("MT(A,B)\nFINAL: false").answer==="false","extract");
 assert(!extract("FINAL: false\nextra").formatOk&&!extract("FINAL: false\nFINAL: true").formatOk,"format");
 assert(score({answer:"5"},"5.0")&&!score({answer:"5"},"5 kg")&&!score(row,"unknown"),"scoring");
 assert(macroAudit(row,"MT(A,B)").status==="premises_match"&&macroAudit(row,"MP(A,B)").status==="premises_mismatch","macro");
 assert(macroAudit({...row,family:"disjunction",atl:[["given","P|Q; Q false"]]},"DS(Q,P)").status==="premises_match","DS");
 assert(usageOf({prompt_tokens:10,completion_tokens:5,total_tokens:15,completion_tokens_details:{reasoning_tokens:3}}).total===15,"usage no double count");
 assert(usageOf({}).total===null&&usageOf({prompt_tokens:1,completion_tokens:2,total_tokens:4}).consistency===false,"usage missing");
 const data=MODES.map(m=>makeRecord(row,m,0,{choices:[{message:{content:"MT(A,B)\nFINAL: false",reasoning_content:"DO NOT STORE"},finish_reason:"stop"}],usage:{prompt_tokens:10,completion_tokens:5,total_tokens:15}},10));
 assert(data.every(r=>r.correct)&&!JSON.stringify(data).includes("DO NOT STORE"),"record");
 const s=summarize(data,MODES);assert(s.paired_complete_groups===1&&s.comparisons_vs_baseline["atl-r"].total_saving_pct===0,"paired");
 assert(summarize(data.slice(1),MODES).paired_complete_groups===0,"incomplete group");
 assert(selectCases([row,{...row,id:"implication-002"}],"test",1).length===1,"selection");
 return "14 core assertion groups passed (synthetic fixtures, no model inference)";
}
export {MODES,messages,selectCases,extract,score,macroAudit,usageOf,summarize,makeRecord,selfTest};
