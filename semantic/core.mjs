// ATL v0.4.2: task-family semantic compiler. No model inference here.
import {cases,solve,verifyCases} from "../adaptive/complex.mjs";
import {extract,correct} from "../adaptive/complex-harness.mjs";
const modes=["draft","compact","atl-input","atl-io"];
const common="Solve accurately. Give a brief checkable derivation and end with FINAL: <answer> in the requested format.";
const terse=" Use terse English notes or equations.";
const notation=" Use compact ASCII equations and named intermediate values; use => for implication, ! for negation. Preserve constraints and checks. Expand if necessary.";
const schemas={
 graph:{code:"G",keys:["n","edges"],rule:"n vertices 0..n-1; directed edges [from,to,cost]. At most one edge costs floor(cost/2) instead of cost. Minimize total cost 0 to n-1. Integer."},
 subset:{code:"S",keys:["items","budget","hours","req","ban"],rule:"Items indexed from 0, each [cost,hours,benefit]. Maximize sum benefit of any subset with total cost<=budget and hours<=hours limit. req=[dependent,required] pairs; ban=forbidden co-selection pairs. Integer."},
 bayes:{code:"B",keys:["prior","lik","obs"],rule:"Three exclusive classes A,B,C; prior weights proportional to prior; lik[class][test] gives P(positive|class) in tenths; obs binary (1 positive). Tests conditionally independent given class. Return posterior P(C|obs) as reduced p/q."},
 schedule:{code:"J",keys:["durations","edges"],rule:"Jobs indexed from 0, durations in hours; edges [pred,succ,min lag after pred finish]. Unlimited workers, no starts before 0. Earliest finish of last job, integer hours."},
 inventory:{code:"I",keys:["n","s0","cap","base","a","b","m","outages","spikes"],rule:"Days i=1..n; start stock s0. Receive base except zero on outage days; cap stock and discard overflow. Demand=(a*i+b) mod m + 9 on spike days (otherwise no +9). Serve min(stock,demand), carry rest; unmet lost. Return cumulative unmet, integer."},
 logic:{code:"L",keys:["n","clauses","query"],rule:"Boolean x1..xn, positive literal k=xk, negative k=NOT x(-k). Each clause is OR, all clauses AND. Query xquery: true/false if forced, unknown if both possible, inconsistent if unsatisfiable."}
};
function compact(t){
 const d=t.data, arr=JSON.stringify;
 switch(t.family){
 case "graph":return "Directed graph 0.."+(d.n-1)+", edges [from,to,cost]="+arr(d.edges)+". One optional edge at floor(cost/2). Min cost 0 to "+(d.n-1)+"? Integer.";
 case "subset":return "Maximize subset benefit; indexed items [cost,hours,benefit]="+arr(d.items)+". Sum cost<="+d.budget+", hours<="+d.hours+". Dependencies [dependent,required]="+arr(d.req)+", forbidden co-selection="+arr(d.ban)+". Integer.";
 case "bayes":return "Exclusive A,B,C; prior proportional to "+arr(d.prior)+". Conditional independent binary tests; positive likelihoods in tenths by class="+arr(d.lik)+", observed 1=positive: "+arr(d.obs)+". P(C|obs)? Reduced p/q.";
 case "schedule":return "Unlimited workers; indexed job durations (h)="+arr(d.durations)+", edges [pred,succ,min lag after pred finish]="+arr(d.edges)+". Start>=0. Earliest last-job finish? Integer hours.";
 case "inventory":return "Days 1.."+d.n+", initial stock "+d.s0+", capacity "+d.cap+". Receive "+d.base+" except zero on "+arr(d.outages)+"; discard overflow before demand. Demand=("+d.a+"*i+"+d.b+") mod "+d.m+", +9 on "+arr(d.spikes)+". Serve min(stock,demand), carry rest, unmet lost. Cumulative unmet? Integer.";
 case "logic":return "Boolean x1..x"+d.n+"; signed k means xk if positive, NOT x(-k) if negative. AND of OR clauses "+arr(d.clauses)+". x"+d.query+" forced true/false, unknown if both possible, inconsistent if unsatisfiable?";
 default:throw Error("Unknown family");
 }
}
function encode(t){
 const s=schemas[t.family];if(!s||Object.keys(t.data).length!==s.keys.length||s.keys.some(k=>!Object.hasOwn(t.data,k)))throw Error("Schema mismatch");
 return JSON.stringify([s.code,...s.keys.map(k=>t.data[k])]);
}
// Internal trusted synthetic data only: this is a wire decoder, not a general untrusted-data validator.
function decode(wire){
 const a=JSON.parse(wire);if(!Array.isArray(a))throw Error("Not an ATL array");
 const family=Object.keys(schemas).find(k=>schemas[k].code===a[0]),s=schemas[family];
 if(!s||a.length!==s.keys.length+1)throw Error("Unknown schema or arity");
 const integerTree=x=>Number.isSafeInteger(x)||Array.isArray(x)&&x.every(integerTree);
 if(!a.slice(1).every(integerTree))throw Error("Noninteger payload");
 const data=Object.fromEntries(s.keys.map((k,i)=>[k,a[i+1]]));
 if(encode({family,data})!==wire)throw Error("Noncanonical wire");
 return {family,data};
}
function schemaInstruction(family){
 const s=schemas[family];
 return " ATL JSON array fields: ["+s.code+","+s.keys.join(",")+"]. "+s.rule;
}
function messages(t,mode){
 if(!modes.includes(mode))throw Error("Unknown mode");
 const atl=mode.startsWith("atl-");
 return [{role:"system",content:common+(mode==="atl-io"?notation:terse)+(atl?schemaInstruction(t.family):"")},
 {role:"user",content:atl?encode(t):mode==="compact"?compact(t):t.prompt}];
}
const tasks=cases.filter(t=>t.split==="test");
function verifiedAnswers(){verifyCases();return Object.fromEntries(tasks.map(t=>[t.id,t.answer]));}
function selfTest(){
 verifyCases();
 if(tasks.length!==36||cases.length!==72)throw Error("Count");
 for(const t of cases){
  const w=encode(t),d=decode(w);
  if(d.family!==t.family||JSON.stringify(d.data)!==JSON.stringify(t.data)||solve(d,0)!==t.answer||solve(d,1)!==t.answer)throw Error("Roundtrip/answer "+t.id);
  if(messages(t,"atl-input")[1].content!==messages(t,"atl-io")[1].content||messages(t,"draft")[0].content!==messages(t,"compact")[0].content)throw Error("Isolation");
  if(!correct(t,"FINAL: "+t.answer)||correct(t,"FINAL: "+t.answer+"\nextra"))throw Error("Grading");
 }
 for(const bad of ['["X",1]','["G",2]','["G",2,[],"extra"]','["G",2.5,[]]',' ["G",2,[]]','{"G":2}']){
  let rejected=false;try{decode(bad);}catch{rejected=true;}if(!rejected)throw Error("Accepted malformed wire");
 }
 return "72 roundtrips, dual reference solver checks, mode isolation, grading and 6 rejection cases passed";
}
function staticReport(count,unit){
 const rows=cases.flatMap(t=>modes.map(mode=>{
  const [s,u]=messages(t,mode);const instruction=count(s.content),input=count(u.content);
  return {id:t.id,family:t.family,split:t.split,mode,instruction,input,total:instruction+input};
 }));
 const summary=[];
 for(const split of ["dev","test"])for(const family of ["all",...Object.keys(schemas)])for(const mode of modes){
  const g=rows.filter(r=>r.split===split&&r.mode===mode&&(family==="all"||r.family===family));
  summary.push({split,family,mode,n:g.length,...Object.fromEntries(["instruction","input","total"].map(k=>[k,g.reduce((a,r)=>a+r[k],0)]))});
 }
 return {unit,scope:"Static input text only; instruction charged on each request; no chat framing, output or API usage",summary,rows};
}
export {modes,schemas,encode,decode,compact,messages,tasks,extract,correct,verifiedAnswers,selfTest,staticReport};
