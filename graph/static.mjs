// ATL v0.4.7 — deterministic graph benchmark; no model inference.
import {readFileSync} from "node:fs";
import {tokenizer,verify,EXPECTED} from "../adaptive/tokenizer.mjs";
function graphLab(count){
 const M=97, ops=["+","-","*","max"], modes=["dense","named","csv","atl","answer"];
 const topologies=[["xy","az","ab"],["xy","aw","bz"],["xz","ay","ab"]];
 const norm=n=>((n%M)+M)%M;
 function op(k,x,y){return norm(k===0?x+y:k===1?x-y:k===2?x*y:Math.max(x,y));}
 function graph(f,p,v){
  const q={x:v[0],y:v[1],z:v[2],w:v[3]};
  topologies[f].forEach(([l,r],i)=>{q["abc"[i]]=op(p[i],q[l],q[r]);});
  q.d=norm(q.a+2*q.b+3*q.c+q.w);
  return [q.a,q.b,q.c,q.d];
 }
 // Independently expressed scalar reference, not the graph traversal or op function.
 function oracle(f,p,[x,y,z,w]){
  const h=(i,l,r)=>[ (l+r)%97,(l-r+97)%97,(l*r)%97,l>r?l:r ][i];
  let a,b,c;
  if(f===0){a=h(p[0],x,y);b=h(p[1],a,z);c=h(p[2],a,b);}
  else if(f===1){a=h(p[0],x,y);b=h(p[1],a,w);c=h(p[2],b,z);}
  else {a=h(p[0],x,z);b=h(p[1],a,y);c=h(p[2],a,b);}
  return [a,b,c,(a+2*b+3*c+w)%97];
 }
 const all=[];for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let c=0;c<4;c++)all.push([a,b,c]);
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const outs=r=>r.slice(2);
 function candidates(f,cal){return all.filter(p=>cal.every(([v,y])=>same(outs(graph(f,p,v)),y)));}
 function altCandidates(f,cal){let p=all.slice();for(const [v,y] of cal)p=p.filter(o=>same(outs(oracle(f,o,v)),y));return p;}
 function random(seed){return n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return Math.floor(seed/4294967296*n);};}
 function generate(f,split,n){
  const r=random(24731+f*49371+(split==="pilot"?193847:0)), cases=[];
  let rejects=0;
  while(cases.length<n){
   if(rejects>20000)throw Error("generation limit");
   const p=[r(4),r(4),r(4)], input=()=>Array.from({length:4},()=>r(97));
   const cal=Array.from({length:5},()=>{let v=input();return [v,outs(oracle(f,p,v))];});
   if(candidates(f,cal).length!==1){rejects++;continue;}
   const queries=Array.from({length:8+ r(9)},input);
   cases.push({f,split,p,cal,queries});
  }
  return {cases,rejects};
 }
 function input(t){
  const links=topologies[t.f].map(([l,r],i)=>`${"abc"[i]}=op${i+1}(${l},${r})`).join(";");
  return `Inputs x,y,z,w are integers 0..96. Unknown op1,op2,op3 are fixed independently from 0:add,1:subtract (left minus right),2:multiply,3:max. Reduce each result modulo 97 to 0..96. Graph: ${links};d=(a+2*b+3*c+w) mod 97. Calibration x,y,z,w -> c,d:\n${t.cal.map(([v,y])=>v.join(",")+" -> "+y.join(",")).join("\n")}\nForecast x,y,z,w:\n${t.queries.map(v=>v.join(",")).join("\n")}`;
 }
 const common="Recover the three fixed operation IDs from calibration and predict c,d for every forecast row in order. Use exactly the requested output format.";
 const instructions={
 dense:common+" First line: op1,op2,op3 IDs separated by commas. Then one line per row with a,b,c,d comma-separated, no labels.",
 named:common+" First line: op1=N,op2=N,op3=N (replace N). Then one line per row with c,d comma-separated. The graph can be replayed from these IDs.",
 csv:common+" First line: three operation IDs separated by commas. Then one line per row with c,d comma-separated. The IDs and supplied graph define all intermediate values.",
 atl:common+" ATL: first line G: followed by three operation IDs concatenated without separators. Then one line per row with c,d comma-separated. Replay graph from IDs.",
 answer:common+" Return only one line per row with c,d comma-separated, no operation IDs."
 };
 function render(mode,p,trace){
  let head=mode==="named"?`op1=${p[0]},op2=${p[1]},op3=${p[2]}`:mode==="atl"?"G:"+p.join(""):p.join(",");
  let lines=trace.map(v=>(mode==="dense"?v:outs(v)).join(","));
  return (mode==="answer"?lines:[head,...lines]).join("\n");
 }
 function verify(mode,t,s){
  if(typeof s!=="string"||s.length>20000)return false;
  const l=s.split("\n"); if(l.length!==t.queries.length+(mode==="answer"?0:1))return false;
  if(mode==="answer"){return l.every((line,i)=>line===outs(oracle(t.f,t.p,t.queries[i])).join(","));}
  const rx=mode==="named"?/^op1=([0-3]),op2=([0-3]),op3=([0-3])$/:mode==="atl"?/^G:([0-3])([0-3])([0-3])$/:/^([0-3]),([0-3]),([0-3])$/;
  const m=l.shift().match(rx);if(!m)return false;
  const p=m.slice(1).map(Number);
  if(!t.cal.every(([v,y])=>same(outs(graph(t.f,p,v)),y)))return false;
  return l.every((line,i)=>{const v=graph(t.f,p,t.queries[i]);return line===(mode==="dense"?v:outs(v)).join(",");});
 }
 const results={};for(const m of modes)results[m]={system:0,input:0,output:0,total:0};
 const families={};let tasks=0,certificates=0,answerChecks=0,rejected=0,rows=0,rejectedGeneration=0,negatives=0,seen=new Set();
 for(let f=0;f<3;f++)for(const split of ["dev","pilot"]){
  const g=generate(f,split,split==="dev"?20:60);rejectedGeneration+=g.rejects;
  for(const t of g.cases){
   const key=JSON.stringify([f,t.cal,t.queries]);if(seen.has(key))throw Error("duplicate");seen.add(key);
   const c=candidates(f,t.cal), a=altCandidates(f,t.cal);
   if(c.length!==1||!same(c,a)||!same(c[0],t.p))throw Error("identification");
   const trace=t.queries.map(v=>graph(f,c[0],v));
   if(!trace.every((v,i)=>same(v,oracle(f,t.p,t.queries[i]))))throw Error("trace");
   tasks++;rows+=trace.length;
   if(split==="pilot"&&!families[f])families[f]={tasks:0,rows:0,totals:Object.fromEntries(modes.map(m=>[m,0]))};
   if(split==="pilot"){families[f].tasks++;families[f].rows+=trace.length;}
   for(const m of modes){
    const s=render(m,c[0],trace);if(!verify(m,t,s))throw Error("valid rejection");
    if(m==="answer")answerChecks++;else certificates++;
    const bad=[s+"\n",s.slice(0,s.lastIndexOf("\n")),s.replace(/([0-9]+)$/,(_,x)=>String((Number(x)+1)%97))];
    if(m!=="answer")for(let j=0;j<3;j++){const q=c[0].slice();q[j]=(q[j]+1)%4;bad.push(render(m,q,trace));}
    for(const b of new Set(bad)){negatives++;if(verify(m,t,b))throw Error("accepted mutation");rejected++;}
    if(split==="pilot"){
     const r=results[m],ns=count(instructions[m]),ni=count(input(t)),no=count(s);
     r.system+=ns;r.input+=ni;r.output+=no;r.total+=ns+ni+no;families[f].totals[m]+=ns+ni+no;
    }
   }
  }
 }
 return {tasks,pilot:180,rows,certificates,answerChecks,rejected,negatives,rejectedGeneration,results,families};
}
const path=process.argv[2];
if(!path)throw Error("Usage: node graph/static.mjs /path/to/o200k_base.tiktoken");
const enc=tokenizer(readFileSync(path,"utf8"));
console.log(JSON.stringify({encoding:"o200k_base",sha256:EXPECTED,golden:verify(enc),...graphLab(s=>enc(s).length)},null,2));
