import {readFileSync,writeFileSync} from "node:fs";
import {tokenizer,verify,EXPECTED} from "../adaptive/tokenizer.mjs";
function experiment(encode){
 const letters="ABCDEF",names=["the pump is running","the valve is open","the alarm is active","the sensor is online","the heater is enabled","the controller is ready"];
 const lit=(x,m)=>Boolean(m&(1<<(Math.abs(x)-1)))===(x>0);
 const word=x=>x>0?names[x-1]:`it is false that ${names[-x-1]}`;
 const forms=[
  {name:"implication",nl:(a,b)=>`If ${word(a)}, then ${word(b)}.`,cnf:(a,b)=>[[-a,b]],eval:(a,b)=>!a||b},
  {name:"only_if",nl:(a,b)=>`${word(a)} only if ${word(b)}.`,cnf:(a,b)=>[[-a,b]],eval:(a,b)=>!a||b},
  {name:"reverse_if",nl:(a,b)=>`${word(a)} if ${word(b)}.`,cnf:(a,b)=>[[a,-b]],eval:(a,b)=>a||!b},
  {name:"equivalence",nl:(a,b)=>`${word(a)} if and only if ${word(b)}.`,cnf:(a,b)=>[[-a,b],[a,-b]],eval:(a,b)=>a===b},
  {name:"xor",nl:(a,b)=>`Exactly one of the following is true: ${word(a)}; ${word(b)}.`,cnf:(a,b)=>[[a,b],[-a,-b]],eval:(a,b)=>a!==b},
  {name:"or",nl:(a,b)=>`At least one of the following is true: ${word(a)}; ${word(b)}.`,cnf:(a,b)=>[[a,b]],eval:(a,b)=>a||b},
  {name:"nand",nl:(a,b)=>`It is not the case that both statements hold: ${word(a)}; ${word(b)}.`,cnf:(a,b)=>[[-a,-b]],eval:(a,b)=>!(a&&b)},
  {name:"unless",nl:(a,b)=>`${word(a)} unless ${word(b)}.`,cnf:(a,b)=>[[a,b]],eval:(a,b)=>a||b}
 ];
 const status=(set,q)=>{const p=set.some(m=>lit(q,m)),n=set.some(m=>!lit(q,m));return p?n?"U":"T":n?"F":"I";};
 const models=cs=>Array.from({length:64},(_,m)=>m).filter(m=>cs.every(c=>c.some(x=>lit(x,m))));
 const eq=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
 const key=cs=>JSON.stringify(cs.map(c=>[...new Set(c)].sort((a,b)=>a-b).join(",")).sort());
 const mapping=letters.split("").map((x,i)=>`${x}: ${names[i]}`).join("\n");
 const sign=(x,minus)=>`${x<0?minus:""}${letters[Math.abs(x)-1]}`;
 const common="Translate the premises into equivalent CNF and the query into one signed literal using the given atom mapping. Do not solve or simplify away constraints. Preserve all models. Unless means inclusive OR. Return only the requested format.";
 const modes={
  spaced:{system:common+" First line is query; each next line is an OR clause. Space-separated letters, ! for negation.",output:(cs,q)=>[sign(q,"!"),...cs.map(c=>c.map(x=>sign(x,"!")).join(" "))].join("\n")},
  atl:{system:common+" First line is query; each next line is an OR clause. Adjacent letters are literals, ! negates the next letter.",output:(cs,q)=>[sign(q,"!"),...cs.map(c=>c.map(x=>sign(x,"!")).join(""))].join("\n")},
  numeric:{system:common+" First line is signed query integer; then each line is a space-separated OR clause of signed integers, 1=A through 6=F.",output:(cs,q)=>[q,...cs.map(c=>c.join(" "))].join("\n")},
  json:{system:common+' Return JSON {"q":signed integer,"c":[[signed integer,...],...]}; 1=A through 6=F.',output:(cs,q)=>JSON.stringify({q,c:cs})},
  direct:{system:"Given the premises and query, return only T if always true, F if always false, or U if both possible. Unless means inclusive OR.",output:(cs,q)=>status(models(cs),q)}
 };
 const parse=(s,mode)=>{if(mode==="json"){const o=JSON.parse(s);return [o.c,o.q];}const lines=s.split("\n"),decode=l=>{if(mode==="numeric")return l.split(" ").map(Number);const a=mode==="spaced"?l.split(" "):l.match(/!?[A-F]/g);if(!a||a.some(x=>!/^!?[A-F]$/.test(x))||(mode==="atl"&&a.join("")!==l))throw Error("format");return a.map(x=>(x.startsWith("!")?-1:1)*(letters.indexOf(x.slice(-1))+1));};const q=decode(lines.shift());if(q.length!==1)throw Error("query");return [lines.map(decode),q[0]];};
 let seed=20261125;function rand(n){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)%n;}
 const atom=()=> (rand(6)+1)*(rand(2)?1:-1);
 const seen=new Set(),tasks=[],balance={T:0,F:0,U:0};let attempts=0,truthChecks=0;
 while(tasks.length<120&&attempts++<20000){
  let rs=[];for(let j=0;j<5+rand(3);j++){let a=atom(),b=atom();while(Math.abs(a)===Math.abs(b))b=atom();rs.push({f:rand(forms.length),a,b});}
  const facts=[atom(),atom()],q=atom(),cs=[...rs.flatMap(({f,a,b})=>forms[f].cnf(a,b)),...facts.map(x=>[x])],ms=models(cs),s=status(ms,q);
  if(s==="I"||balance[s]>=40)continue;
  const k=key(cs)+":"+q;if(seen.has(k))continue;seen.add(k);
  for(let m=0;m<64;m++){let direct=rs.every(({f,a,b})=>forms[f].eval(lit(a,m),lit(b,m)))&&facts.every(x=>lit(x,m));if(direct!==ms.includes(m))throw Error("truth mismatch");truthChecks++;}
  const input=mapping+"\nPremises:\n"+rs.map(({f,a,b})=>forms[f].nl(a,b)).concat(facts.map(x=>word(x)+".")).join("\n")+"\nQuery: "+word(q)+".";
  tasks.push({rs,facts,q,cs,ms,s,input});balance[s]++;
 }
 if(tasks.length!==120)throw Error("quota");
 const counts=Object.fromEntries(Object.keys(modes).map(n=>[n,{system:0,input:0,output:0,total:0}]));
 const audit={},byLabel={},formCounts=Object.fromEntries(forms.map(f=>[f.name,0]));let roundtrips=0,positiveChecks=0;
 function observe(t,type,cs,q){const ms=models(cs),same=eq(ms,t.ms)&&q===t.q,label=status(ms,q)===t.s;
  const add=o=>{o.all++;if(same)o.equivalent++;else{o.corrupt++;if(label)o.label_pass++;}};
  const blank=()=>({all:0,equivalent:0,corrupt:0,label_pass:0});
  add(audit[type]??=blank());add(byLabel[t.s]??=blank());
 }
 for(const t of tasks){
  for(const r of t.rs)formCounts[forms[r.f].name]++;
  for(const [mode,o] of Object.entries(modes)){const out=o.output(t.cs,t.q),c=counts[mode];c.system+=encode(o.system).length;c.input+=encode(t.input).length;c.output+=encode(out).length;if(mode!=="direct"){const [cs,q]=parse(out,mode);if(q!==t.q||!eq(models(cs),t.ms))throw Error("roundtrip");roundtrips++;}}
  // Semantics-preserving transformations must be accepted.
  const eqcs=[...t.cs.slice().reverse().map(c=>c.slice().reverse()),[1,-1],t.cs[0].slice()];if(!eq(models(eqcs),t.ms))throw Error("positive control");positiveChecks++;
  // Exhaustive single-clause deletions, literal flips, variable replacements, plus query flip.
  for(let i=0;i<t.cs.length;i++){
   observe(t,"drop_clause",t.cs.filter((_,j)=>j!==i),t.q);
   for(let j=0;j<t.cs[i].length;j++){
    const copy=t.cs.map(c=>c.slice());copy[i][j]*=-1;observe(t,"flip_literal",copy,t.q);
    const repl=t.cs.map(c=>c.slice());const x=repl[i][j];repl[i][j]=(x>0?1:-1)*(Math.abs(x)%6+1);observe(t,"replace_atom",repl,t.q);
   }
  }
  observe(t,"flip_query",t.cs,-t.q);
 }
 for(const c of Object.values(counts))c.total=c.system+c.input+c.output;
 const totals=Object.values(audit).reduce((a,b)=>Object.fromEntries(Object.keys(a).map(k=>[k,a[k]+b[k]])),{all:0,equivalent:0,corrupt:0,label_pass:0});
 return {version:"0.5.2",seed:20261125,tasks:tasks.length,balance,truthChecks,roundtrips,positiveChecks,formCounts,audit,byLabel,totals,counts,example:{input:tasks[0].input,cnf:modes.spaced.output(tasks[0].cs,tasks[0].q),atl:modes.atl.output(tasks[0].cs,tasks[0].q),label:tasks[0].s},limitations:["Synthetic templated English; atom mapping supplied; not an external dataset or independent model inference.","Exact gold-based audit is an evaluation metric, not a deployment verifier without a gold reference.","Mutations deliberately corrupt reference CNF; rates are not estimates of real LLM error frequencies.","Semantic criterion compares full premise model sets and the query literal over the fixed six-atom universe; no auxiliary variables or first-order logic.","Static ordinary-text token counts, no API framing/caching/reasoning tokens. Direct outputs solve a weaker task."]};
}
const encode=tokenizer(readFileSync(process.argv[2],"utf8"));const report={...experiment(encode),golden:verify(encode),rank_sha:EXPECTED};writeFileSync(process.argv[3]||"fidelity-report.json",JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify(report,null,2));
