// ATL 0.3.3: long reasoning, bounded replay and static representation benchmark.
const modes=["draft","nano","replay"];
const common="Solve accurately. Give a checkable derivation; end with FINAL: <answer> (integer only).";
const styles={"draft":"Use terse English notes or equations.","nano":"Use compact notation.","replay":"Give one replay instruction then FINAL. Syntax: AFF(n,x,a,b,m) repeats x=(a*x+b)%m; BR(n,x,m) for i=1..n sets x=(x even?x/2+i:3*x+i)%m; STOCK(n,s,c,r,a,b,m) for i=1..n receives r capped at c, demands (a*i+b)%m, accumulates unmet demand and updates stock; DAG(n,a,m,p,q) computes E[i]=1+(a*i)%m+max(E[i-p],E[i-q]), E[j<=0]=0. All inputs nonnegative integers, positive moduli and offsets. Return x, x, unmet, E[n] respectively."};
const scales=[32,128,512];
const opByFamily={"affine":"AFF","branch":"BR","inventory":"STOCK","dependency":"DAG"};
const arities={"AFF":5,"BR":3,"STOCK":7,"DAG":5};
function makeTasks(){
 const tasks=[];
 for(const n of scales){
  tasks.push({id:"aff-"+n,family:"affine",n,args:[n,7,13,9,997],prompt:`Start x=7. Repeat x=(13*x+9) mod 997 exactly ${n} times. Find final x.`});
  tasks.push({id:"br-"+n,family:"branch",n,args:[n,17,101],prompt:`Start x=17. For i=1..${n}, if x is even set x=(x/2+i) mod 101; otherwise set x=(3*x+i) mod 101. Find final x.`});
  tasks.push({id:"stock-"+n,family:"inventory",n,args:[n,23,37,8,7,3,19],prompt:`Stock starts at 23, capacity 37. For each day i=1..${n}, receive 8 capped at capacity, then demand is (7*i+3) mod 19. Serve as much as possible and carry remaining stock forward; unmet demand is lost. Find cumulative unmet demand.`});
  tasks.push({id:"dag-"+n,family:"dependency",n,args:[n,5,13,2,5],prompt:`Tasks i=1..${n} have duration 1+((5*i) mod 13). Each task depends on tasks i-2 and i-5 if positive; absent predecessors finish at time 0. With unlimited workers, find earliest finish time of task ${n}.`});
 }
 return tasks;
}

function oracle(t){
 const [n,...a]=t.args;
 if(t.family==="affine"){let [x,k,b,m]=a;const states=[];for(let i=0;i<n;i++){x=(k*x+b)%m;states.push(x);}return {answer:x,states};}
 if(t.family==="branch"){let [x,m]=a;const states=[];for(let i=1;i<=n;i++){x=(x%2===0?x/2+i:3*x+i)%m;states.push(x);}return {answer:x,states};}
 if(t.family==="inventory"){let [s,c,r,k,b,m]=a,u=0;const states=[];for(let i=1;i<=n;i++){const available=Math.min(c,s+r),d=(k*i+b)%m,served=Math.min(available,d);s=available-served;u+=d-served;states.push([s,u]);}return {answer:u,states};}
 if(t.family==="dependency"){const [a0,m,p,q]=a,e=new Map(),states=[];for(let i=1;i<=n;i++){const v=1+(a0*i)%m+Math.max(e.get(i-p)??0,e.get(i-q)??0);e.set(i,v);states.push(v);}return {answer:e.get(n),states};}
 throw Error("unknown family");
}

function executeRecipe(recipe){
 const match=/^(AFF|BR|STOCK|DAG)\((\d+(?:,\d+)*)\)$/.exec(recipe);
 if(!match)throw Error("Invalid instruction");
 const op=match[1],args=match[2].split(",").map(Number);
 if(args.length!==arities[op]||args.some(x=>!Number.isSafeInteger(x)||x<0||x>1000000))throw Error("Invalid operands");
 const [n,...a]=args;if(n<1||n>10000)throw Error("Step limit");
 const states=[];
 if(op==="AFF"){
  let [x,k,b,m]=a;if(!m)throw Error("modulus");
  for(let i=1;i<=n;i++){x=(x*k+b)%m;states.push(x);}
  return {op,args,answer:x,states};
 }
 if(op==="BR"){
  let [x,m]=a;if(!m)throw Error("modulus");
  for(let i=1;i<=n;i++){if(x%2)x=(3*x+i)%m;else x=(x/2+i)%m;states.push(x);}
  return {op,args,answer:x,states};
 }
 if(op==="STOCK"){
  let [s,c,r,k,b,m]=a,u=0;if(!m||s>c)throw Error("inventory operands");
  for(let i=1;i<=n;i++){const net=Math.min(c,s+r)-(k*i+b)%m;u+=Math.max(0,-net);s=Math.max(0,net);states.push([s,u]);}
  return {op,args,answer:u,states};
 }
 if(op==="DAG"){
  const [k,m,p,q]=a;if(!m||!p||!q)throw Error("DAG operands");
  const E=[0];for(let i=1;i<=n;i++){E[i]=1+(k*i)%m+Math.max(E[Math.max(0,i-p)],E[Math.max(0,i-q)]);states.push(E[i]);}
  return {op,args,answer:E[n],states};
 }
 throw Error("unknown instruction");
}

function extract(output){
 if(typeof output!=="string")return null;
 const lines=output.trim().split(/\r?\n/);
 if(lines.filter(x=>/^\s*FINAL\s*:/i.test(x)).length!==1)return null;
 return lines.at(-1).match(/^FINAL: (\d+)$/)?.[1]??null;
}

function correct(t,output){const ans=extract(output);return ans!==null&&Number(ans)===oracle(t).answer;}

function replayAudit(t,output){
 if(typeof output!=="string")return {ok:false,reason:"missing"};
 const lines=output.trim().split(/\r?\n/);
 if(lines.length!==2||extract(output)===null)return {ok:false,reason:"format"};
 try{
  const run=executeRecipe(lines[0]),ref=oracle(t);
  if(run.op!==opByFamily[t.family]||JSON.stringify(run.args)!==JSON.stringify(t.args))return {ok:false,reason:"task_mismatch"};
  if(JSON.stringify(run.states)!==JSON.stringify(ref.states))return {ok:false,reason:"state_mismatch"};
  if(run.answer!==Number(extract(output)))return {ok:false,reason:"final_mismatch"};
  return {ok:true,steps:run.states.length};
 }catch(e){return {ok:false,reason:e.message};}
}

function messages(t,m){
 if(!modes.includes(m))throw Error("Unknown mode");
 return [{role:"system",content:common+" "+styles[m]},{role:"user",content:t.prompt}];
}

function authored(t,m){
 const n=t.n,ans=oracle(t).answer;
 const final="\nFINAL: "+ans;
 if(m==="replay")return opByFamily[t.family]+"("+t.args.join(",")+")"+final;
 if(m==="draft"){
  if(t.family==="affine")return `Start x=7; iterate x=(13*x+9)%997 for ${n} steps; x=${ans}.`+final;
  if(t.family==="branch")return `x=17; for i=1..${n}, use (x/2+i)%101 if even, (3*x+i)%101 if odd; x=${ans}.`+final;
  if(t.family==="inventory")return `s=23,u=0; for i=1..${n}, a=min(37,s+8), d=(7*i+3)%19; u+=max(0,d-a), s=max(0,a-d); u=${ans}.`+final;
  return `E[j<=0]=0; for i=1..${n}, E[i]=1+(5*i)%13+max(E[i-2],E[i-5]); E[${n}]=${ans}.`+final;
 }
 if(m==="nano"){
  if(t.family==="affine")return `x0=7; x_i=(13*x_(i-1)+9)%997; x_${n}=${ans}`+final;
  if(t.family==="branch")return `x0=17; i=1..${n}: x=(x%2?3*x+i:x/2+i)%101; x=${ans}`+final;
  if(t.family==="inventory")return `(s,u)=(23,0); i=1..${n}: z=min(37,s+8)-(7*i+3)%19; (s,u)=(max(0,z),u+max(0,-z)); u=${ans}`+final;
  return `E[j<=0]=0; E[i]=1+5*i%13+max(E[i-2],E[i-5]); E[${n}]=${ans}`+final;
 }
 throw Error("mode");
}

function expanded(t){
 const r=oracle(t);
 return r.states.map((s,i)=>`${i+1}:${Array.isArray(s)?s.join(","):s}`).join("\n")+"\nFINAL: "+r.answer;
}

function verifiedAnswers(){return Object.fromEntries(tasks.map(t=>[t.id,String(oracle(t).answer)]));}

function pilot(){
 const chars=s=>[...s].length;
 const rows=tasks.flatMap(t=>modes.map(mode=>{
  const [sys,user]=messages(t,mode),output=authored(t,mode);
  return {id:t.id,family:t.family,steps:t.n,mode,system:sys.content,user:user.content,output,expected:t.answer,correct:correct(t,output),
   replay:mode==="replay"?replayAudit(t,output):null,instruction_chars:chars(sys.content),prompt_chars:chars(user.content),output_chars:chars(output),expanded_state_chars:chars(expanded(t))};
 }));
 const summarize=rs=>modes.map(mode=>{const a=rs.filter(r=>r.mode===mode),sum=k=>a.reduce((n,r)=>n+r[k],0);return {mode,n:a.length,correct:a.filter(r=>r.correct).length,replayed:a.filter(r=>r.replay?.ok).length,instruction_chars:sum("instruction_chars"),prompt_chars:sum("prompt_chars"),output_chars:sum("output_chars"),total_chars:sum("instruction_chars")+sum("prompt_chars")+sum("output_chars"),expanded_state_chars:sum("expanded_state_chars")};});
 return {scope:"Deterministic reference and template-rendered derivations, not model inference; Unicode code points, not tokens. Expanded state log is diagnostic, not the Draft control.",summary:summarize(rows),by_scale:Object.fromEntries(scales.map(n=>[n,summarize(rows.filter(r=>r.steps===n))])),rows};
}

function selfTest(){
 const assert=(x,m)=>{if(!x)throw Error(m)};
 const report=pilot();assert(tasks.length===12&&report.rows.length===36,"case count");
 assert(report.rows.every(r=>r.correct),"reference answers");
 assert(report.rows.filter(r=>r.mode==="replay").every(r=>r.replay.ok),"state replay");
 const t=tasks[0],o=authored(t,"replay");assert(!replayAudit(t,o.replace("AFF(","BR(")).ok,"wrong op");
 assert(!replayAudit(t,o.replace("13,9","13,8")).ok,"wrong parameter");
 assert(!replayAudit(t,o.replace(/FINAL: \d+/,"FINAL: 99999")).ok,"wrong final");
 assert(!replayAudit(t,o+"\nextra").ok,"extra output");
 for(const bad of ["AFF(10001,7,13,9,997)","AFF(32,7,13,9,0)","DAG(32,5,13,0,5)","AFF(1,7,13,9,997); x=3","STOCK(1,38,37,11,7,3,19)"]){
  let failed=false;try{executeRecipe(bad);}catch{failed=true;}assert(failed,"invalid accepted");
 }
 return {checks:"12 tasks, 36 scored templates, 12 exact state replays, 9 negative cases",steps:tasks.reduce((a,t)=>a+t.n,0)};
}
const tasks=makeTasks();
for(const t of tasks)t.answer=String(oracle(t).answer);
export {modes,tasks,messages,extract,correct,verifiedAnswers,replayAudit,executeRecipe,pilot,selfTest};
