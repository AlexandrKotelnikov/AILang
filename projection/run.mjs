function experiment(){
 const n=6, lit=(x,m)=>Boolean(m&(1<<(Math.abs(x)-1)))===(x>0);
 const forms=[
 {cnf:(a,b)=>[[-a,b]],eval:(a,b)=>!a||b},
 {cnf:(a,b)=>[[-a,b]],eval:(a,b)=>!a||b},
 {cnf:(a,b)=>[[a,-b]],eval:(a,b)=>a||!b},
 {cnf:(a,b)=>[[-a,b],[a,-b]],eval:(a,b)=>a===b},
 {cnf:(a,b)=>[[a,b],[-a,-b]],eval:(a,b)=>a!==b},
 {cnf:(a,b)=>[[a,b]],eval:(a,b)=>a||b},
 {cnf:(a,b)=>[[-a,-b]],eval:(a,b)=>!(a&&b)},
 {cnf:(a,b)=>[[a,b]],eval:(a,b)=>a||b}];
 const models=(cs,n=6)=>Array.from({length:1<<n},(_,m)=>m).filter(m=>cs.every(c=>c.some(x=>lit(x,m))));
 const status=(set,q)=>{const p=set.some(m=>lit(q,m)),f=set.some(m=>!lit(q,m));return p?f?"U":"T":f?"F":"I";};
 const eq=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
 const key=cs=>JSON.stringify(cs.map(c=>[...new Set(c)].sort((a,b)=>a-b).join(",")).sort());
 function signature(ms,n,k){let out=[];for(let i=0;i<n;i++){if(k===1){let mask=0;for(const m of ms)mask|=1<<((m>>i)&1);out.push(mask);}else for(let j=i+1;j<n;j++){let mask=0;for(const m of ms)mask|=1<<(((m>>i)&1)+2*((m>>j)&1));out.push(mask);}}return out;}
 let seed=20261125;function rand(n){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)%n;}
 const atom=()=> (rand(6)+1)*(rand(2)?1:-1);
 const seen=new Set(),tasks=[],balance={T:0,F:0,U:0};let attempts=0,truthChecks=0;
 while(tasks.length<120&&attempts++<20000){
 let rs=[];for(let j=0;j<5+rand(3);j++){let a=atom(),b=atom();while(Math.abs(a)===Math.abs(b))b=atom();rs.push({f:rand(forms.length),a,b});}
 const facts=[atom(),atom()],q=atom(),cs=[...rs.flatMap(({f,a,b})=>forms[f].cnf(a,b)),...facts.map(x=>[x])],ms=models(cs),s=status(ms,q);
 if(s==="I"||balance[s]>=40)continue;
 const k=key(cs)+":"+q;if(seen.has(k))continue;seen.add(k);
 for(let m=0;m<64;m++){let direct=rs.every(({f,a,b})=>forms[f].eval(lit(a,m),lit(b,m)))&&facts.every(x=>lit(x,m));if(direct!==ms.includes(m))throw Error("truth mismatch");truthChecks++;}
 tasks.push({q,cs,ms,s});balance[s]++;
 }
 if(tasks.length!==120)throw Error("quota");
 const methods=["answer_only","answer_query","unary_query","pairs_query"];
 const blank=()=>({all:0,equivalent:0,corrupt:0,false_accept:Object.fromEntries(methods.map(x=>[x,0]))});
 const total=blank(),byType={};let positives=0,pairChecks=0,taskRisk=Object.fromEntries(methods.map(x=>[x,0]));
 for(const t of tasks){
 const u=signature(t.ms,n,1),p=signature(t.ms,n,2),risk=new Set();
 function observe(type,cs,q){
 const ms=models(cs),same=eq(t.ms,ms)&&q===t.q,ans=status(ms,q)===t.s;
 const passes=[ans,ans&&q===t.q,q===t.q&&eq(u,signature(ms,n,1)),q===t.q&&eq(p,signature(ms,n,2))];
 if(passes[3]!==same)throw Error("2-CNF projection equivalence failed");pairChecks++;
 for(const o of [total,byType[type]??=blank()]){o.all++;if(same){o.equivalent++;if(passes.some(x=>!x))throw Error("equivalent rejected");}else{o.corrupt++;methods.forEach((k,i)=>{if(passes[i]){o.false_accept[k]++;risk.add(k);}});}}
 }
 const eqcs=[...t.cs.slice().reverse().map(c=>c.slice().reverse()),[1,-1],t.cs[0].slice()];
 if(!eq(models(eqcs),t.ms)||!eq(signature(models(eqcs),n,2),p))throw Error("positive");positives++;
 for(let i=0;i<t.cs.length;i++){
 observe("drop_clause",t.cs.filter((_,j)=>j!==i),t.q);
 for(let j=0;j<t.cs[i].length;j++){
 const copy=t.cs.map(c=>c.slice());copy[i][j]*=-1;observe("flip_literal",copy,t.q);
 const repl=t.cs.map(c=>c.slice()),x=repl[i][j];repl[i][j]=(x>0?1:-1)*(Math.abs(x)%6+1);observe("replace_atom",repl,t.q);
 }}
 observe("flip_query",t.cs,-t.q);
 for(const k of risk)taskRisk[k]++;
 }
 if(total.all!==5120||total.corrupt!==3063||total.false_accept.answer_only!==1801)throw Error("v0.5.2 replication mismatch");
 // Explicit 3-CNF boundary: even/odd parity over 3 atoms has identical pair projections.
 const parity=b=>Array.from({length:8},(_,m)=>m).filter(m=>((m&1)+((m>>1)&1)+((m>>2)&1))%2===b);
 const cnfFromForbidden=ms=>ms.map(m=>Array.from({length:3},(_,i)=>(m&(1<<i))?-(i+1):i+1));
 const even=parity(0),odd=parity(1),evenCnf=cnfFromForbidden(odd),oddCnf=cnfFromForbidden(even);
 if(!eq(models(evenCnf,3),even)||!eq(models(oddCnf,3),odd)||eq(even,odd)||!eq(signature(even,3,2),signature(odd,3,2)))throw Error("boundary");
 return {version:"0.5.3",experiment:"semantic projection audit",seed:20261125,tasks:tasks.length,balance,truthChecks,positive_controls:positives,pairChecks,total,byType,taskRisk,projection_width:{unary:n,pairs:n*(n-1)/2,pair_mask_bits:4},boundary:{evenCnf,oddCnf,even,odd,pair_signature:signature(even,3,2)},limitations:["Same controlled-language fixtures as v0.5.2; not held-out or independent model inference.","Exact query identity and gold projection signatures are required.","Pair completeness applies to 2-CNF over the same atom universe, with at least two atoms; not general 3-CNF/FOL.","Mutation rates are descriptive and correlated within tasks.","No token counts, API usage, or deployment-time cost measured."]};
}
console.log(JSON.stringify(experiment(),null,2));
