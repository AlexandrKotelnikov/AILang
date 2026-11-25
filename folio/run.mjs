import {readFileSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {tokenizer,verify,EXPECTED} from "../adaptive/tokenizer.mjs";
function benchmark(raw,encode){
 const rows=raw.trim().split(/\r?\n/).map(JSON.parse);
 const lex=s=>s.match(/[\p{L}_][\p{L}\p{N}_]*|\p{N}+|[^\s]/gu)||[];
 const word=s=>/^[\p{L}\p{N}_]/u.test(s);
 const join=a=>a.map((s,i)=>i&&word(a[i-1])&&word(s)?" "+s:s).join("");
 const norm=s=>join(lex(s)), id=/^[\p{L}_][\p{L}\p{N}_]*$/u;
 const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const common="Given premises p, classify each query in q in order: T entailed, F contradicted, U undetermined. Return a JSON array of labels.";
 const fs=common+" Input uses first-order logic.",ns=common+" Input uses natural language.";
 const ds=fs+" Optional d is an ordered dictionary: v0, v1, ... replace corresponding original identifiers. Expand before reasoning.";
 const excluded=rows.flatMap((r,i)=>r.premises.length!==r["premises-FOL"].length?[i]:[]);
 function run(subset){
  const groups=new Map();let groupChecks=0,aliasChecks=0,lexChecks=0;
  const single=subset.map(r=>{
   const y={True:"T",False:"F",Uncertain:"U"}[r.label];if(!y||typeof r["conclusion-FOL"]!=="string")throw Error("schema");
   const f={p:r["premises-FOL"],q:[r["conclusion-FOL"]]},n={p:r.premises,q:[r.conclusion]};
   const key=JSON.stringify([f.p,n.p]);if(!groups.has(key))groups.set(key,{f:{p:f.p,q:[]},n:{p:n.p,q:[]},y:[],indices:[]});
   const g=groups.get(key);g.f.q.push(f.q[0]);g.n.q.push(n.q[0]);g.y.push(y);g.indices.push(r.index);
   return {f,n,y:[y],index:r.index};
  });
  const lookup=new Map(single.map(x=>[x.index,x])),batch=[...groups.values()];
  for(const g of batch)for(let j=0;j<g.indices.length;j++){
   const x=lookup.get(g.indices[j]);
   if(!eq(x.f,{p:g.f.p,q:[g.f.q[j]]})||!eq(x.n,{p:g.n.p,q:[g.n.q[j]]})||x.y[0]!==g.y[j])throw Error("batch roundtrip");groupChecks++;
  }
  function normalize(f){const n={p:f.p.map(norm),q:f.q.map(norm)};for(const k of ["p","q"])for(let i=0;i<n[k].length;i++){if(!eq(lex(f[k][i]),lex(n[k][i])))throw Error("lexical roundtrip");lexChecks++;}return n;}
  function alias(f){
   const d=[],map=new Map();function code(s){return join(lex(s).map(x=>{if(!id.test(x))return x;if(!map.has(x)){map.set(x,"v"+d.length);d.push(x);}return map.get(x);}));}
   const a={d,p:f.p.map(code),q:f.q.map(code)};
   const decode=s=>join(lex(s).map(x=>/^v\d+$/.test(x)?d[Number(x.slice(1))]:x));
   if(!eq({p:a.p.map(decode),q:a.q.map(decode)},f))throw Error("alias roundtrip");aliasChecks++;return a;
  }
  const modes={nl_single:[single,ns,g=>g.n],fol_single:[single,fs,g=>g.f],fol_min_single:[single,fs,g=>normalize(g.f)],nl_batch:[batch,ns,g=>g.n],fol_batch:[batch,fs,g=>g.f],fol_min_batch:[batch,fs,g=>normalize(g.f)],alias_batch:[batch,ds,g=>alias(normalize(g.f))],adaptive_batch:[batch,ds,g=>{const f=normalize(g.f),a=alias(f);return encode(JSON.stringify(a)).length<encode(JSON.stringify(f)).length?a:f;}]};
  let counts={},selections={plain:0,alias:0};
  for(const [mode,[gs,sys,format]] of Object.entries(modes)){
   let c={requests:gs.length,system:0,input:0,output:0,total:0};
   for(const g of gs){const data=format(g);if(mode==="adaptive_batch")selections[data.d?"alias":"plain"]++;c.system+=encode(sys).length;c.input+=encode(JSON.stringify(data)).length;c.output+=encode(JSON.stringify(g.y)).length;}
   c.total=c.system+c.input+c.output;counts[mode]=c;
  }
  return {rows:subset.length,groups:batch.length,group_sizes:batch.reduce((h,g)=>(h[g.y.length]=(h[g.y.length]||0)+1,h),{}),labels:single.reduce((h,r)=>(h[r.y[0]]=(h[r.y[0]]||0)+1,h),{}),group_roundtrips:groupChecks,alias_roundtrips:aliasChecks,lexical_checks:lexChecks,counts,selections};
 }
 const indexed=rows.map((r,index)=>({...r,index}));
 return {version:"0.5.2",excluded_zero_based:excluded,matched:run(indexed.filter(r=>!excluded.includes(r.index))),all:run(indexed),limitations:["Static canonical text, not actual inference.","Gold FOL supplied; semantic translation and entailment correctness not tested.","Lexical roundtrip, not a FOL parser; grouping exact raw premise arrays.","Grouped requests may change model quality; no framing, cache, runtime or hidden tokens measured.","Public validation split, not blind; equal premise count does not establish semantic alignment."]};
}
const data=readFileSync(process.argv[3]);
const hash=createHash("sha1").update("blob "+data.length+"\0").update(data).digest("hex");
if(hash!=="06244bd10b37eac73cba7aca6c336e96011ace58")throw Error("Dataset Git blob SHA mismatch");
const enc=tokenizer(readFileSync(process.argv[2],"utf8"));
const report={...benchmark(data.toString("utf8"),enc),dataset_blob:hash,rank_sha:EXPECTED,golden:verify(enc)};
writeFileSync(process.argv[4]||"folio-report.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
