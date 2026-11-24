// 72 synthetic multi-step development/within-family holdout tasks.
const families=["graph","subset","bayes","schedule","inventory","logic"];
function rng(seed){let x=seed>>>0;return n=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return Math.floor((x/4294967296)*n);};}

function makeCases(){
 const out=[];
 for(let v=0;v<12;v++)for(let f=0;f<families.length;f++){
  const family=families[f],rnd=rng(20261124+v*9137+f*821);let data,prompt,answerType="integer";
  if(family==="graph"){
   const n=10+v%4,edges=[];
   for(let i=0;i<n-1;i++)edges.push([i,i+1,2+rnd(19)]);
   for(let i=0;i<n;i++)for(let j=i+2;j<n;j++)if(rnd(4)===0)edges.push([i,j,3+rnd(25)]);
   for(let i=2;i<n;i++)if(rnd(3)===0)edges.push([i,i-2,2+rnd(15)]);
   data={n,edges};prompt=`Directed graph vertices 0..${n-1}. Edges (from,to,cost): ${edges.map(e=>e.join(",")).join("; ")}. A coupon may be used at most once on an edge, replacing its cost by floor(cost/2). Find the minimum total cost from 0 to ${n-1}. Output an integer.`;
  }else if(family==="subset"){
   const n=12,items=Array.from({length:n},()=>[1+rnd(10),1+rnd(8),4+rnd(30)]),budget=20+v%5,hours=16+v%4;
   const req=[[3,0],[7,2],[10,5]],ban=[[1,4],[6,9],[2,11]];
   data={items,budget,hours,req,ban};
   prompt=`Choose any subset of items 0..11 to maximize total benefit. Tuples (cost,hours,benefit) in index order: ${items.map(e=>e.join(",")).join("; ")}. Budget <=${budget}, hours <=${hours}. If selected, first item in each dependency (dependent,required) must include its required item: ${req.map(e=>e.join(",")).join("; ")}. Forbidden pairs: ${ban.map(e=>e.join(",")).join("; ")}. Return maximum benefit as an integer.`;
  }else if(family==="bayes"){
   const prior=[1+rnd(4),1+rnd(4),1+rnd(4)],lik=Array.from({length:3},()=>Array.from({length:5},()=>1+rnd(8))),obs=Array.from({length:5},()=>rnd(2));
   data={prior,lik,obs};answerType="fraction";
   prompt=`There are three mutually exclusive classes A,B,C with prior probabilities proportional to ${prior.join(",")}. Five binary tests are mutually independent conditional on class. The probabilities of a positive test, in tenths, by class (each row tests 1..5): ${lik.map(e=>e.join(",")).join("; ")}. Observed outcomes (1 positive,0 negative): ${obs.join(",")}. Compute posterior probability of class C exactly as a reduced fraction p/q.`;
  }else if(family==="schedule"){
   const n=18+v%5,durations=Array.from({length:n},()=>1+rnd(9)),edges=[];
   for(let i=1;i<n;i++){edges.push([i-1,i,rnd(4)]);if(i>2)edges.push([rnd(i-1),i,rnd(7)]);if(i>5&&rnd(3)===0)edges.push([rnd(i-2),i,rnd(9)]);}
   data={durations,edges};prompt=`Unlimited workers. Jobs 0..${n-1} have durations ${durations.join(",")} hours. Constraints (predecessor,successor,min lag hours after predecessor finishes): ${edges.map(e=>e.join(",")).join("; ")}. Jobs cannot start before time 0. Find earliest finish of job ${n-1}, integer hours.`;
  }else if(family==="inventory"){
   const n=64+8*v,s0=10+rnd(15),cap=30+rnd(16),base=5+rnd(5),a=3+rnd(9),b=1+rnd(12),m=17+rnd(10);
   const outages=[7+v,19+v,31+v],spikes=[11+v,23+v,43+v];
   data={n,s0,cap,base,a,b,m,outages,spikes};
   prompt=`Inventory starts at ${s0}, capacity ${cap}. For days i=1..${n}: receive ${base} units except receive zero on days ${outages.join(",")}; discard overflow. Demand is (${a}*i+${b}) mod ${m}, plus 9 on days ${spikes.join(",")}. Serve min(available,demand), carry remaining stock; unmet demand is lost. Return cumulative unmet demand as integer.`;
  }else{
   const n=12,clauses=[];
   for(let i=1;i<n;i++)clauses.push([-i,i+1]);
   // Mix implications with disjunctions, explicit facts, and a forced or free query.
   clauses.push([1,2],[-4,8],[-6,10],[3,-9],[-5,12]);
   if(v%3===0)clauses.push([-12]);
   else if(v%3===1)clauses.push([1]);
   else clauses.splice(clauses.findIndex(c=>c[0]===1&&c[1]===2),1);
   // Forced false cases must remain satisfiable: remove disjunction and reverse constraint.
   if(v%3===0){const k=clauses.findIndex(c=>c[0]===1&&c[1]===2);if(k>=0)clauses.splice(k,1);}
   const query=1+(v%4);data={n,clauses,query};answerType="truth";
   prompt=`Boolean variables x1..x${n}; signed integer k means xk if positive and NOT x(-k) if negative. All clauses are ORs and must hold simultaneously: ${clauses.map(c=>"("+c.join(",")+")").join(" AND ")}. Determine x${query}: true if forced true, false if forced false, unknown if both values possible, inconsistent if no satisfying assignment.`;
  }
  const t={id:family+"-"+String(v).padStart(2,"0"),family,split:v<6?"dev":"test",data,prompt,answerType};out.push(t);
 }
 return out;
}

function gcd(a,b){return b?gcd(b,a%b):Math.abs(a);}

function solve(t,method=0){
 const d=t.data;
 if(t.family==="graph"){
  const {n,edges}=d,dist=Array(2*n).fill(Infinity);dist[0]=0;
  const arcs=edges.flatMap(([a,b,w])=>[[a,b,w],[a+n,b+n,w],[a,b+n,Math.floor(w/2)]]);
  if(method===0){for(let i=0;i<2*n-1;i++){let ch=false;for(const [a,b,w] of arcs)if(dist[a]+w<dist[b]){dist[b]=dist[a]+w;ch=true;}if(!ch)break;}}
  else{const done=new Set();while(done.size<2*n){let u=-1;for(let i=0;i<2*n;i++)if(!done.has(i)&&(u<0||dist[i]<dist[u]))u=i;if(!Number.isFinite(dist[u]))break;done.add(u);for(const [a,b,w] of arcs)if(a===u)dist[b]=Math.min(dist[b],dist[a]+w);}}
  return String(Math.min(dist[n-1],dist[2*n-1]));
 }
 if(t.family==="subset"){
  const {items,budget,hours,req,ban}=d;let best=0;
  function evaluate(chosen){if(req.some(([a,b])=>chosen[a]&&!chosen[b])||ban.some(([a,b])=>chosen[a]&&chosen[b]))return;let c=0,h=0,g=0;items.forEach(([x,y,z],i)=>{if(chosen[i]){c+=x;h+=y;g+=z;}});if(c<=budget&&h<=hours)best=Math.max(best,g);}
  if(method===0){for(let mask=0;mask<2**items.length;mask++)evaluate(items.map((_,i)=>!!(mask>>i&1)));}
  else{const walk=(i,chosen,c,h,g)=>{if(c>budget||h>hours)return;if(i===items.length){if(!req.some(([a,b])=>chosen[a]&&!chosen[b])&&!ban.some(([a,b])=>chosen[a]&&chosen[b]))best=Math.max(best,g);return;}walk(i+1,[...chosen,false],c,h,g);const [x,y,z]=items[i];walk(i+1,[...chosen,true],c+x,h+y,g+z);};walk(0,[],0,0,0);}
  return String(best);
 }
 if(t.family==="bayes"){
  const {prior,lik,obs}=d;
  const w=prior.map((p,k)=>method===0?obs.reduce((v,x,j)=>v*(x?lik[k][j]:10-lik[k][j]),p):p*lik[k].map((p,j)=>obs[j]?p:10-p).reduce((a,b)=>a*b,1));
  const num=w[2],den=w.reduce((a,b)=>a+b,0),g=gcd(num,den);return `${num/g}/${den/g}`;
 }
 if(t.family==="schedule"){
  const {durations,edges}=d;const n=durations.length;
  if(method===0){const end=[];for(let i=0;i<n;i++)end[i]=durations[i]+Math.max(0,...edges.filter(e=>e[1]===i).map(([a,_,l])=>end[a]+l));return String(end[n-1]);}
  const memo=new Map();function ef(i){if(!memo.has(i))memo.set(i,durations[i]+Math.max(0,...edges.filter(e=>e[1]===i).map(([a,_,l])=>ef(a)+l)));return memo.get(i);}return String(ef(n-1));
 }
 if(t.family==="inventory"){
  const {n,s0,cap,base,a,b,m,outages,spikes}=d;let s=s0,u=0;
  for(let i=1;i<=n;i++){
   const r=outages.includes(i)?0:base,dem=(a*i+b)%m+(spikes.includes(i)?9:0),avail=Math.min(cap,s+r);
   if(method===0){const served=Math.min(avail,dem);s=avail-served;u+=dem-served;}
   else{const net=avail-dem;s=Math.max(0,net);u+=Math.max(0,-net);}
  }return String(u);
 }
 if(t.family==="logic"){
  const {n,clauses,query}=d,seen=new Set();
  function test(bits){const val=k=>k>0?bits[k-1]:!bits[-k-1];if(clauses.every(c=>c.some(val)))seen.add(bits[query-1]);}
  if(method===0){for(let mask=0;mask<2**n;mask++)test(Array.from({length:n},(_,i)=>!!(mask>>i&1)));}
  else{function dfs(bits){if(clauses.some(c=>c.every(k=>Math.abs(k)<=bits.length&&!((k>0)?bits[k-1]:!bits[-k-1]))))return;if(bits.length===n){seen.add(bits[query-1]);return;}dfs([...bits,false]);dfs([...bits,true]);}dfs([]);}
  return seen.size===0?"inconsistent":seen.size===2?"unknown":String([...seen][0]);
 }
 throw Error("Unknown family");
}
const cases=makeCases().map(t=>({...t,answer:solve(t)}));
function verifyCases(){if(cases.length!==72||new Set(cases.map(t=>t.id)).size!==72)throw Error("case count");for(const t of cases)if(t.answer!==solve(t,1))throw Error("oracle mismatch "+t.id);return cases.length;}
export {families,cases,solve,verifyCases};
