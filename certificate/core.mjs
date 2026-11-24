// ATL v0.4.3: verifiable certificates; no external dependencies.
function moduleCore(){
function rng(seed){let x=seed>>>0;return n=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return Math.floor(x/4294967296*n);};}
function makeCases(){
 const out=[];
 for(let k=0;k<100;k++)for(const family of ["flow","interval"]){
  const rand=rng(845127+k*19391+(family==="flow"?0:7261));
  let data;
  if(family==="flow"){
   const n=7+rand(8),edges=[];
   for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(i!==j&&i!==n-1&&j!==0&&((j===i+1)||rand(5)===0))edges.push([i,j,1+rand(25)]);
   data={n,edges};
  }else{
   const n=14+rand(15),jobs=[];
   for(let i=0;i<n;i++){const start=rand(60);jobs.push([start,start+1+rand(15),1+rand(50)]);}
   jobs.sort((a,b)=>a[1]-b[1]||a[0]-b[0]||a[2]-b[2]);data={jobs};
  }
  out.push({id:family+"-"+String(k).padStart(3,"0"),family,split:k<20?"dev":"pilot",data});
 }
 return out;
}
const int=Number.isSafeInteger;
function validTask(t){
 const d=t.data;
 if(t.family==="flow"){
  if(!int(d.n)||d.n<2||d.n>16||!Array.isArray(d.edges)||d.edges.length>240)throw Error("bad flow task");
  const seen=new Set();
  for(const e of d.edges){if(!Array.isArray(e)||e.length!==3||!e.every(int))throw Error("edge");const [u,v,c]=e,key=u+","+v;if(u<0||u>=d.n||v<0||v>=d.n||u===v||c<0||c>100000||seen.has(key))throw Error("edge range/duplicate");seen.add(key);}
 }else if(t.family==="interval"){
  if(!Array.isArray(d.jobs)||d.jobs.length>200)throw Error("bad interval task");
  let last=-1;
  for(const j of d.jobs){if(!Array.isArray(j)||j.length!==3||!j.every(int)||j[0]<0||j[0]>=j[1]||j[1]<last||j[1]>100000||j[2]<0||j[2]>100000)throw Error("bad job");last=j[1];}
 }else throw Error("family");
}
function predecessors(jobs){return jobs.map(([s],i)=>{let j=i-1;while(j>=0&&jobs[j][1]>s)j--;return j+1;});}
function solve(t){
 validTask(t);
 if(t.family==="interval"){
  const jobs=t.data.jobs,p=predecessors(jobs),dp=[0];
  for(let i=0;i<jobs.length;i++)dp.push(Math.max(dp[i],dp[p[i]]+jobs[i][2]));
  return {answer:dp.at(-1),cert:dp.slice(1)};
 }
 const {n,edges}=t.data,adj=Array.from({length:n},()=>[]),orig=[];
 for(const [u,v,c] of edges){const a={v,cap:c,rev:adj[v].length},b={v:u,cap:0,rev:adj[u].length};adj[u].push(a);adj[v].push(b);orig.push(a);}
 let answer=0,seen;
 while(true){
  const par=Array(n).fill(null),q=[0];par[0]=[-1,-1];
  for(let i=0;i<q.length;i++)for(let j=0;j<adj[q[i]].length;j++){const a=adj[q[i]][j];if(a.cap>0&&par[a.v]===null){par[a.v]=[q[i],j];q.push(a.v);}}
  seen=q;if(par[n-1]===null)break;
  let delta=Infinity;for(let v=n-1;v!==0;){const [u,j]=par[v];delta=Math.min(delta,adj[u][j].cap);v=u;}
  for(let v=n-1;v!==0;){const [u,j]=par[v],a=adj[u][j];a.cap-=delta;adj[v][a.rev].cap+=delta;v=u;}answer+=delta;
 }
 const f=orig.map((a,i)=>edges[i][2]-a.cap);
 return {answer,cert:[f.flatMap((v,i)=>v?[[i,v]]:[]),seen.sort((a,b)=>a-b)]};
}
function oracle(t){
 validTask(t);
 if(t.family==="flow"){
  const {n,edges}=t.data;let best=Infinity;
  for(let m=0;m<2**(n-2);m++){const inside=u=>u===0||(u!==n-1&&!!(m&(1<<(u-1))));let c=0;for(const [u,v,w] of edges)if(inside(u)&&!inside(v))c+=w;best=Math.min(best,c);}return best;
 }
 // Independent recurrence on time, not job-prefix indices.
 const jobs=t.data.jobs,ends=Math.max(0,...jobs.map(j=>j[1])),dp=Array(ends+1).fill(0);
 for(let i=1;i<=ends;i++){dp[i]=dp[i-1];for(const [s,e,w] of jobs)if(e===i)dp[i]=Math.max(dp[i],dp[s]+w);}
 return dp[ends];
}
function verify(t,answer,cert){
 try{
  validTask(t);if(!int(answer)||answer<0||!Array.isArray(cert))return false;
  if(t.family==="interval"){
   const jobs=t.data.jobs;if(cert.length!==jobs.length||!cert.every(int))return false;
   const dp=[0,...cert],p=predecessors(jobs);
   return jobs.every((j,i)=>dp[i+1]===Math.max(dp[i],dp[p[i]]+j[2]))&&dp.at(-1)===answer;
  }
  const {n,edges}=t.data;if(cert.length!==2||!cert.every(Array.isArray))return false;
  const [pairs,cut]=cert,f=Array(edges.length).fill(0);let prev=-1;
  for(const p of pairs){if(!Array.isArray(p)||p.length!==2||!p.every(int))return false;const [i,v]=p;if(i<=prev||i>=edges.length||v<=0||v>edges[i][2])return false;f[i]=v;prev=i;}
  if(!cut.every((v,i)=>int(v)&&v>=0&&v<n&&(i===0||cut[i-1]<v))||!cut.includes(0)||cut.includes(n-1))return false;
  const S=new Set(cut),bal=Array(n).fill(0);let cap=0;
  edges.forEach(([u,v,c],i)=>{bal[u]-=f[i];bal[v]+=f[i];if(S.has(u)&&!S.has(v))cap+=c;});
  return bal.every((b,i)=>b===(i===0?-answer:i===n-1?answer:0))&&cap===answer;
 }catch{return false;}
}
function prompt(t){
 validTask(t);
 if(t.family==="flow")return "Directed network, vertices 0.."+(t.data.n-1)+", source 0, sink "+(t.data.n-1)+". Edges in indexed order [u,v,capacity]="+JSON.stringify(t.data.edges)+". Find maximum flow.";
 return "Weighted interval scheduling. Jobs in nondecreasing finish order [start,end,value]="+JSON.stringify(t.data.jobs)+". Select nonoverlapping jobs (end<=next start) to maximize total value.";
}
const common="Solve the task. Return exactly two lines: a certificate and FINAL: <nonnegative integer>.";
function instruction(t,mode){
 if(!["english","atl"].includes(mode))throw Error("mode");
 if(t.family==="flow")return common+(mode==="atl"?" Certificate: C:"+`[[[edge,flow],...],[source-side vertices]]`+". Omit zero flows; sort edge IDs and cut vertices ascending.":" Certificate: Flow: edge=flow,...; Cut: vertex,... (use - for empty flow list). Omit zero flows; sort edge IDs and cut vertices ascending.");
 return common+(mode==="atl"?" Certificate: C:[d1,...,dn]. di is optimal total for first i jobs; d0=0.":" Certificate: DP: d1=...,d2=...,... (use - if no jobs). di is optimal total for first i jobs; d0=0.");
}
function render(t,mode,result){
 const {answer,cert}=result;
 const first=mode==="atl"?"C:"+JSON.stringify(cert):t.family==="flow"?"Flow: "+(cert[0].map(p=>p.join("=")).join(",")||"-")+"; Cut: "+cert[1].join(","):"DP: "+(cert.map((v,i)=>"d"+(i+1)+"="+v).join(",")||"-");
 return first+"\nFINAL: "+answer;
}
function parse(t,mode,text){
 if(!["english","atl"].includes(mode)||typeof text!=="string"||text.length>20000)return null;
 const m=text.trim().match(/^([^\r\n]+)\r?\nFINAL: (0|[1-9][0-9]*)$/);if(!m)return null;const answer=Number(m[2]);if(!int(answer))return null;
 try{
  let cert;
  if(mode==="atl"){if(!m[1].startsWith("C:"))return null;cert=JSON.parse(m[1].slice(2));if("C:"+JSON.stringify(cert)!==m[1])return null;}
  else if(t.family==="flow"){
   const a=m[1].match(/^Flow: (-|[0-9]+=[0-9]+(?:,[0-9]+=[0-9]+)*); Cut: ([0-9]+(?:,[0-9]+)*)$/);if(!a)return null;
   cert=[a[1]==="-"?[]:a[1].split(",").map(s=>s.split("=").map(Number)),a[2].split(",").map(Number)];
  }else{const a=m[1].match(/^DP: (-|d[0-9]+=[0-9]+(?:,d[0-9]+=[0-9]+)*)$/);if(!a)return null;cert=a[1]==="-"?[]:a[1].split(",").map((s,i)=>{const [k,v]=s.split("=");if(k!=="d"+(i+1))throw Error("index");return Number(v);});}
  return {answer,cert};
 }catch{return null;}
}
function grade(t,mode,text){
 const r=parse(t,mode,text);return {format:!!r,answer:!!r&&r.answer===oracle(t),certificate:!!r&&verify(t,r.answer,r.cert)};
}
function selfTest(){
 const cases=makeCases();let positives=0,negatives=0,oracles=0;
 const check=(condition,msg)=>{if(!condition)throw Error(msg);};
 for(const t of cases){
  const r=solve(t);check(r.answer===oracle(t),"oracle "+t.id);oracles++;
  for(const mode of ["english","atl"]){const msg=render(t,mode,r),g=grade(t,mode,msg);check(g.format&&g.answer&&g.certificate,"valid "+t.id);positives++;
   const bad=render(t,mode,{...r,answer:r.answer+1});check(!grade(t,mode,bad).certificate,"wrong final");negatives++;
   check(!parse(t,mode,msg+"\nextra"),"trailing text");negatives++;
  }
  const c=JSON.parse(JSON.stringify(r.cert));
  if(t.family==="flow")c[1]=[0,t.data.n-1];else c[c.length-1]++;
  check(!verify(t,r.answer,c),"tampered witness");negatives++;
 }
 const edgeCases=[{family:"flow",data:{n:2,edges:[]}},{family:"flow",data:{n:4,edges:[[0,1,4],[0,2,4],[1,2,3],[2,1,1],[1,3,2],[2,3,5]]}},{family:"interval",data:{jobs:[]}},{family:"interval",data:{jobs:[[0,2,3],[1,2,5],[2,3,7]]}}];
 for(const t of edgeCases){const r=solve(t);check(r.answer===oracle(t)&&verify(t,r.answer,r.cert),"edge case");}
 return {cases:cases.length,oracle_agreement:oracles,valid_renderings:positives,rejected_mutations:negatives,edge_cases:edgeCases.length};
}
function staticReport(count,unit){
 const rows=[];
 for(const t of makeCases())for(const mode of ["english","atl"]){
  const r=solve(t),system=count(instruction(t,mode)),input=count(prompt(t)),output=count(render(t,mode,r));rows.push({id:t.id,split:t.split,family:t.family,mode,system,input,output,total:system+input+output});
 }
 const summary=[];
 for(const split of ["dev","pilot"])for(const family of ["all","flow","interval"])for(const mode of ["english","atl"]){
  const group=rows.filter(r=>r.split===split&&(family==="all"||r.family===family)&&r.mode===mode);
  summary.push({split,family,mode,n:group.length,...Object.fromEntries(["system","input","output","total"].map(k=>[k,group.reduce((a,r)=>a+r[k],0)]))});
 }
 return {unit,scope:"Static oracle-authored certificates, no chat framing, inference or hidden reasoning",summary};
}
return {makeCases,validTask,solve,oracle,verify,prompt,instruction,render,parse,grade,selfTest,staticReport};
}
export const {makeCases,validTask,solve,oracle,verify,prompt,instruction,render,parse,grade,selfTest,staticReport}=moduleCore();
