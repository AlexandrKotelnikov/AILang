import {readFileSync,writeFileSync} from "node:fs";
import {tokenizer,verify,EXPECTED} from "../adaptive/tokenizer.mjs";
function experiment(encode){
 const eq=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]),lit=(x,m)=>!!(m&(1<<(Math.abs(x)-1)))===(x>0),clause=(c,m)=>c.some(x=>lit(x,m));
 const models=(n,cs)=>Array.from({length:1<<n},(_,m)=>m).filter(m=>cs.every(c=>clause(c,m)));
 const status=(ms,q)=>{const t=ms.some(m=>lit(q,m)),f=ms.some(m=>!lit(q,m));return t?f?"U":"T":f?"F":"I";};
 const combo=(n,k)=>{let out=[];function rec(start,a){if(a.length===k){out.push(a);return;}for(let i=start;i<=n-(k-a.length);i++)rec(i+1,[...a,i]);}rec(0,[]);return out;};
 const cache=new Map();function plan(n,k){const key=n+":"+k;if(!cache.has(key)){let sets=combo(n,k);cache.set(key,{sets,project:sets.map(s=>Array.from({length:1<<n},(_,m)=>1<<s.reduce((v,i,j)=>v|(((m>>i)&1)<<j),0)))});}return cache.get(key);}
 function project(ms,p){return p.project.map(a=>{let mask=0;for(const m of ms)mask|=a[m];return mask;});}
 const allowed=(m,p,s)=>p.project.every((a,i)=>(a[m]&s[i])!==0);
 const hex=(m,w)=>m.toString(16).padStart(w,"0"),letters="ABCDEFGHIJ",sym=x=>(x<0?"!":"")+letters[Math.abs(x)-1];
 const pack=(cs,sp)=>cs.map(c=>c.map(sym).join(sp)).join("/");
 const parse=(s,n,sp)=>s===""?[]:s.split("/").map(c=>{const a=sp?c.split(" "):c.match(/!?[A-J]/g)||[];if(a.join(sp)!==c||!a.length)throw Error("syntax");return a.map(x=>{if(!/^!?[A-J]$/.test(x)||letters.indexOf(x.at(-1))>=n)throw Error("literal");return (x[0]==="!"?-1:1)*(letters.indexOf(x.at(-1))+1);});});
 const bitmap=(ms,n)=>{let a=Array((1<<n)/4).fill(0);for(const m of ms)a[m>>2]|=1<<(m%4);return a.map(x=>hex(x,1)).join("");};
 const fromBitmap=(s,n)=>Array.from({length:1<<n},(_,m)=>m).filter(m=>(parseInt(s[m>>2],16)&(1<<(m%4)))!==0);
 const simplify=(n,cs,ms)=>{let r=cs.slice();for(let i=r.length-1;i>=0;i--){let t=r.filter((_,j)=>i!==j);if(eq(models(n,t),ms))r=t;}return r;};
 const prefix="Atoms A onward in alphabetic order, A is bit 0. Header n,k,q; q is signed atom (! is negation). Return T if query always true, F if always false, U if both possible, I if no models. ";
 const rules={cnf:"Body slash-separated OR clauses, space-separated signed literals. All clauses required.",atl:"Body slash-separated OR clauses of adjacent signed literals. All clauses required.",reduced:"Body slash-separated OR clauses of adjacent signed literals. All clauses required.",projection:"Body fixed-width hex masks, one per lexicographic k-subset of atoms. Each mask bit j permits subset assignment j (first atom low bit). All masks required.",bitmap:"Body hex digits in increasing assignment order; each digit's low-to-high bits permit four consecutive assignments.",adaptive:"Body starts C: for slash-separated OR clauses of adjacent signed literals, P: for fixed-width hex masks in lexicographic k-subset order (mask bit j permits subset assignment j, first atom low bit), or B: for hex digits whose low-to-high bits permit four consecutive assignments. All constraints required."};
 const keys=Object.keys(rules),blank=()=>({tasks:0,mutations:0,corrupt:0,equivalent:0,false_accept:{answer:0,order1:0,order2:0,order3:0,order4:0,required:0,mutual:0},tokens:Object.fromEntries(keys.map(k=>[k,{system:0,input:0,output:0,total:0}])),selected:{C:0,P:0,B:0},labels:{T:0,F:0,U:0,I:0}});
 const total=blank(),groups={};let roundtrips=0,checks=0,positive=0,seed=4512026;
 function rand(n){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)%n;}
 const randomClause=(n,k)=>{let a=[];while(a.length<k){let x=1+rand(n);if(!a.some(y=>Math.abs(y)===x))a.push(rand(2)?x:-x);}return a;};
 for(const n of [6,8])for(const k of [2,3,4]){
 const g=groups[n+":"+k]=blank(),seen=new Set();let tries=0;
 while(g.tasks<20&&tries++<5000){
 const cs=Array.from({length:6+rand(5)},(_,i)=>randomClause(n,i===0?k:1+rand(k))),q=(1+rand(n))*(rand(2)?1:-1),ms=models(n,cs);
 if(!ms.length)continue;
 const id=JSON.stringify([ms,q]);if(seen.has(id))continue;seen.add(id);
 const s=status(ms,q),p=plan(n,k),sig=project(ms,p),w=Math.ceil((1<<k)/4),proj=sig.map(v=>hex(v,w)).join(""),bm=bitmap(ms,n),red=simplify(n,cs,ms);
 const decoded=Array.from({length:1<<n},(_,m)=>m).filter(m=>allowed(m,p,proj.match(new RegExp(".{"+w+"}","g")).map(x=>parseInt(x,16))));
 const spaced=pack(cs," "),atl=pack(cs,""),reduced=pack(red,"");
 for(const [label,ds] of [["cnf",models(n,parse(spaced,n," "))],["atl",models(n,parse(atl,n,""))],["reduced",models(n,parse(reduced,n,""))],["projection",decoded],["bitmap",fromBitmap(bm,n)]]){if(!eq(ds,ms))throw Error("roundtrip "+label);roundtrips++;}
 const h=n+","+k+","+sym(q)+"\n",options={C:h+"C:"+reduced,P:h+"P:"+proj,B:h+"B:"+bm},choice=Object.keys(options).sort((a,b)=>encode(options[a]).length-encode(options[b]).length||a.localeCompare(b))[0];
 const inputs={cnf:h+spaced,atl:h+atl,reduced:h+reduced,projection:h+proj,bitmap:h+bm,adaptive:options[choice]};
 for(const a of [total,g]){a.tasks++;a.labels[s]++;a.selected[choice]++;for(const mode of keys){let c=a.tokens[mode];c.system+=encode(prefix+rules[mode]).length;c.input+=encode(inputs[mode]).length;c.output+=encode(s).length;}}
 const gold=Array.from({length:4},(_,j)=>project(ms,plan(n,j+1)));
 function observe(other,r){
 const om=models(n,other),same=eq(ms,om)&&q===r;
 const passes={answer:status(om,r)===s,mutual:q===r&&om.every(m=>cs.every(c=>clause(c,m)))&&ms.every(m=>other.every(c=>clause(c,m)))};
 for(let j=1;j<=4;j++)passes["order"+j]=q===r&&eq(gold[j-1],project(om,plan(n,j)));
 passes.required=passes["order"+k];if(passes.required!==same||passes.mutual!==same)throw Error("equivalence");checks++;
 for(const a of [total,g]){a.mutations++;if(same){a.equivalent++;if(Object.values(passes).some(v=>!v))throw Error("false reject");}else{a.corrupt++;for(const key of Object.keys(passes))if(passes[key])a.false_accept[key]++;}}
 }
 const reordered=cs.slice().reverse().map(c=>c.slice().reverse()).concat([[1,-1],cs[0].slice()]);if(!eq(models(n,reordered),ms)||!eq(project(models(n,reordered),p),sig))throw Error("positive");positive++;
 for(let i=0;i<cs.length;i++){observe(cs.filter((_,j)=>j!==i),q);for(let j=0;j<cs[i].length;j++){let f=cs.map(c=>c.slice());f[i][j]*=-1;observe(f,q);let r=cs.map(c=>c.slice());const x=r[i][j];r[i][j]=(x>0?1:-1)*(Math.abs(x)%n+1);observe(r,q);}}
 observe([...cs,randomClause(n,k)],q);observe(cs,-q);
 }
 if(g.tasks!==20)throw Error("quota");
 }
 for(const a of [total,...Object.values(groups)])for(const c of Object.values(a.tokens))c.total=c.system+c.input+c.output;
 const boundary=[];for(let k of [2,3,4]){const parity=b=>Array.from({length:1<<k},(_,m)=>m).filter(m=>Array.from({length:k},(_,i)=>(m>>i)&1).reduce((a,b)=>a+b,0)%2===b);const a=parity(0),b=parity(1);if(eq(a,b)||!eq(project(a,plan(k,k-1)),project(b,plan(k,k-1)))||eq(project(a,plan(k,k)),project(b,plan(k,k))))throw Error("parity");boundary.push({k,lower_order_indistinguishable:true,required_order_distinguishes:true});}
 return {version:"0.5.4",seed:4512026,roundtrips,checks,positive,boundary,total,groups,limitations:["Synthetic bounded CNF, n=6 or 8, width 2..4; not external or model inference.","Gold reference required. Mutation counts correlated; candidate formulas preserve max width.","Token counts are canonical static text, not actual API usage, framing, cache, hidden reasoning or latency.","Reduced CNF via greedy redundancy elimination; no minimum-size guarantee. Adaptive route chooses lowest wire token count before adding common adaptive instructions; no oracle answer needed beyond input formula model enumeration.","No independent API inference. Exhaustive model enumeration is exponential; SAT-based implementation needed at scale."]};
}
const enc=tokenizer(readFileSync(process.argv[2],"utf8"));const result={...experiment(enc),rank_sha:EXPECTED,golden:verify(enc)};writeFileSync(process.argv[3]||"generalized-report.json",JSON.stringify(result,null,2)+"\n");console.log(JSON.stringify(result,null,2));
