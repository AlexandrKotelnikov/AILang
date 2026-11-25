// New synthetic 120-task structured benchmark; no model calls.
// A public development benchmark, NOT an independent private holdout.
import {readFileSync} from "node:fs";
import {tokenizer,verify} from "../atl-context/scripts/tokenizer.mjs";
const stockCases=[
 {s:90,r:15,e:[30,-42,12,-61,24,-40]},
 {s:65,r:20,e:[15,-70,50,-18,8,-37]},
 {s:130,r:40,e:[0,-60,20,-55,10,-30]},
 {s:35,r:10,e:[75,-30,0,-80,40,-45]}
];
const graphCases=[
 [3,5,4,2,6,3,2,4],[6,2,0,5,2,8,3,1],[4,4,4,4,0,5,2,2],[2,7,3,0,5,1,4,6]
];
const nodes="ABCDEFGH".split(""),deps=[[],[],[0],[0,1],[2,3],[1],[4,5],[2,6]];
const stateCases=[
 [90,50,85,45,80,45],[100,60,90,50,82,52],[75,40,70,35,65,36],[95,55,88,48,84,49]
];
function inventory(c,change={}){
 const e=c.e.slice(),r=change.r??c.r;
 if(change.event)e[change.event[0]]=change.event[1];
 let s=c.s,sh=0,re=0,dispatch=[];
 for(const x of e){if(x>=0)s+=x;else{const n=-x,y=Math.min(n,Math.max(0,s-r));s-=y;sh+=y;re+=n-y;dispatch.push(y);}}
 if(s!==c.s+e.filter(x=>x>=0).reduce((a,b)=>a+b,0)-sh||sh+re!==-e.filter(x=>x<0).reduce((a,b)=>a+b,0)||s<0)throw Error("inventory conservation");
 return {s,sh,re,dispatch};
}
function schedule(d){
 const start=[],finish=[],paths=[];
 for(let i=0;i<nodes.length;i++){
  start[i]=Math.max(0,...deps[i].map(j=>finish[j]));finish[i]=start[i]+d[i];
  paths[i]=deps[i].length?deps[i].flatMap(j=>paths[j].map(p=>p.concat(i))):[[i]];
 }
 const sums=paths[7].map(p=>p.reduce((s,j)=>s+d[j],0));
 if(Math.max(...sums)!==finish[7])throw Error("path/DP mismatch");
 return {start,finish,critical:sums.filter(x=>x===finish[7]).length};
}
function decision(p,[t,q,v,o]){
 const [ts,ps,to,po,tl,pl]=p;
 return !v?"HOLD":t>ts||q>=ps?"STOP":o&&t<=to&&q<po?"RUN":t>=tl||q>=pl?"LIMIT":"RUN";
}
function stateRows(p){
 const [ts,ps,to,po,tl,pl]=p;
 return [[ts,ps-1,1,1],[ts+1,0,0,1],[to,po-1,1,1],[to,po,1,1],[0,ps,1,1],[tl-1,pl-1,1,0],[tl,pl-1,1,0],[to+1,po-1,1,1],[ts+1,0,1,1],[0,0,0,0]];
}
const id=(family,i,j)=>family+(i+1)+String(j+1).padStart(2,"0");
function gold(){
 const out=[];
 const add=(family,i,a)=>a.forEach((answer,j)=>out.push({id:id(family,i,j),answer}));
 stockCases.forEach((c,i)=>{const a=inventory(c),b=inventory(c,{r:c.r+10}),d=inventory(c,{event:[0,0]}),e=inventory(c,{event:[5,c.e[5]-15]});add("I",i,[a.s,a.sh,a.re,a.dispatch[0],a.dispatch[2],b.s,b.re,d.sh,d.re,e.re]);});
 graphCases.forEach((d,i)=>{const a=schedule(d),mod=(j,v)=>schedule(d.map((x,k)=>j===k?v:x));add("G",i,[a.finish[7],a.start[4],a.finish[3],a.critical,mod(0,d[0]+2).finish[7],mod(1,d[1]+3).finish[7],mod(4,0).finish[7],mod(5,d[5]+7).finish[7],mod(2,d[2]+1).start[7],mod(6,0).finish[7]]);});
 stateCases.forEach((p,i)=>add("S",i,stateRows(p).map(x=>decision(p,x))));
 return out;
}
const common="Solve 120 independent questions without tools or code. Output only an ordered JSON array of objects with exactly keys id and answer; numbers for integers, strings for states. No reasoning or markdown. Order: I, G, S; cases 1 to 4; questions 01 to 10. IDs concatenate family, case digit and two-digit question (e.g. I101). Each question resets to its case.";
function prompts(){
 const nl=[
 common,
 "Inventory (I): initial stock and reserve vary by case. Events occur in listed order; a receipt adds stock; for a dispatch request q ship min(q,max(0,stock-reserve)), subtract shipped and permanently reject the rest. No other changes. Modify only the specified value then replay all events. Case rows give initial stock, reserve and six alternating receipts/requests.",
 ...stockCases.map((c,i)=>"Case "+(i+1)+": stock "+c.s+", reserve "+c.r+"; "+c.e.map(x=>x>=0?"receive "+x:"request "+(-x)).join(", ")+"."),
 "For each case answer in order: 01 final stock; 02 total shipped; 03 total rejected; 04 shipped on first dispatch; 05 shipped on third dispatch; 06 final stock with reserve increased by 10; 07 total rejected with reserve increased by 10; 08 total shipped with first receipt set to 0; 09 total rejected with first receipt set to 0; 10 total rejected with third dispatch request increased by 15.",
 "Scheduling (G): all tasks mandatory, earliest possible starts, unlimited resources, no overhead. A and B start at 0. C depends on A; D on A and B; E on C and D; F on B; G on E and F; H on C and G. Tasks start when all dependencies finish. Project finishes when H finishes. Durations in order A,B,C,D,E,F,G,H:",
 ...graphCases.map((d,i)=>"Case "+(i+1)+": "+d.join(", ")+"."),
 "For each case answer: 01 project finish; 02 earliest start of E; 03 earliest finish of D; 04 number of distinct longest dependency paths from a starting task to H; 05 project finish if A duration increased by 2; 06 project finish if B duration increased by 3; 07 project finish if E duration set to 0; 08 project finish if F duration increased by 7; 09 earliest start of H if C duration increased by 1; 10 project finish if G duration set to 0. Change only the stated duration.",
 "Decisions (S): inputs T temperature, P pressure, V validity and O override (1 yes, 0 no). Thresholds vary by case. Apply first matching rule: invalid V means HOLD; T strictly above stop temperature or P at least stop pressure means STOP; enabled O with T at most override temperature and P strictly below override pressure means RUN; T at least limit temperature or P at least limit pressure means LIMIT; otherwise RUN. For each case, the ten input rows are questions 01 to 10 in order, values T,P,V,O.",
 ...stateCases.flatMap((p,i)=>["Case "+(i+1)+": stop thresholds "+p.slice(0,2).join(", ")+"; override thresholds "+p.slice(2,4).join(", ")+"; limit thresholds "+p.slice(4).join(", ")+".",...stateRows(p).map(x=>x.join(", "))])
 ].join("\n");
 const compact=[
 common,
 "I: rows case:stock,reserve; signed events (+receive incl 0,-request q). Ship=min(q,max(0,stock-reserve)); stock-=ship; permanently reject q-ship. No other changes. Replay from start after changing only specified value.",
 ...stockCases.map((c,i)=>(i+1)+":"+c.s+","+c.r+";"+c.e.map(x=>x>=0?"+"+x:String(x)).join(",")),
 "I queries: 01 stock_end; 02 shipped_total; 03 rejected_total; 04 shipped_dispatch1; 05 shipped_dispatch3; 06 stock_end(reserve+10); 07 rejected_total(reserve+10); 08 shipped_total(receipt1=0); 09 rejected_total(receipt1=0); 10 rejected_total(request3+15). Unmarked values unchanged.",
 "G: mandatory earliest-start DAG, unlimited resources, no overhead; task:prerequisites; A:- B:- C:A D:AB E:CD F:B G:EF H:CG. A,B start 0; others start at max prerequisite finish. Project finish=finish H. Rows case:duration A,B,C,D,E,F,G,H.",
 ...graphCases.map((d,i)=>(i+1)+":"+d.join(",")),
 "G queries: 01 finish H; 02 start E; 03 finish D; 04 count distinct longest paths from any start to H; 05 finish H(dA+2); 06 finish H(dB+3); 07 finish H(dE=0); 08 finish H(dF+7); 09 start H(dC+1); 10 finish H(dG=0). Change only stated duration.",
 "S: T,P,V,O=temperature,pressure,validity,override; flags 1=yes,0=no. Case thresholds ts,ps,to,po,tl,pl. First matching: V=0 HOLD; T>ts or P>=ps STOP; O=1 and T<=to and P<po RUN; T>=tl or P>=pl LIMIT; else RUN. Each case header is case:thresholds; ten input rows T,P,V,O ordered 01..10.",
 ...stateCases.flatMap((p,i)=>[(i+1)+":"+p.join(","),...stateRows(p).map(x=>x.join(","))])
 ].join("\n");
 return {natural:nl,compact};
}
function score(rows){
 const g=gold(),m=new Map();let invalid=0;
 if(!Array.isArray(rows))throw Error("Expected array");
 for(const r of rows){if(!r||typeof r!=="object"||Object.keys(r).sort().join(",")!=="answer,id"||!g.some(x=>x.id===r.id)||m.has(r.id)){invalid++;continue;}m.set(r.id,r.answer);}
 const errors=g.filter(x=>m.get(x.id)!==x.answer).map(x=>({...x,actual:m.get(x.id)??null}));
 const ordered=rows.length===g.length&&rows.every((x,i)=>x?.id===g[i].id);
 return {correct:g.length-errors.length,total:g.length,invalid,ordered,protocol_ok:invalid===0&&ordered,errors};
}
function selfTest(){
 const g=gold(),p=prompts();
 if(g.length!==120||new Set(g.map(x=>x.id)).size!==120||!score(g).protocol_ok||score(g).correct!==120||score([]).correct!==0)throw Error("fixture");
 if(decision(stateCases[0],[91,0,0,1])!=="HOLD"||decision(stateCases[0],[0,50,1,1])!=="STOP")throw Error("priority");
 const s=inventory({s:120,r:20,e:[35,-48,15,-70,0,-40]});if(s.s!==20||s.sh!==150||s.re!==8)throw Error("stock reference");
 const q=schedule([3,5,4,2,6,3,2,0]);if(q.finish[7]!==15||q.critical!==2)throw Error("graph reference");
 return {gold_count:g.length,unique:true,reference_checks:4,conservation_and_path_checks:true,prompt_count:Object.keys(p).length};
}
const args=process.argv.slice(2),arg=k=>args.includes(k)?args[args.indexOf(k)+1]:null;
if(args.includes("--self-test"))console.log(JSON.stringify(selfTest()));
else if(arg("--arm")){const p=prompts()[arg("--arm")];if(!p)throw Error("unknown arm");process.stdout.write(p);}
else if(arg("--score"))console.log(JSON.stringify(score(JSON.parse(readFileSync(arg("--score"),"utf8"))),null,2));
else if(args.includes("--gold"))console.log(JSON.stringify(gold(),null,2));
else if(arg("--ranks")){const enc=tokenizer(readFileSync(arg("--ranks"),"utf8"));verify(enc);console.log(JSON.stringify(Object.fromEntries(Object.entries(prompts()).map(([k,v])=>[k,enc(v).length]))));}
else throw Error("Use --self-test | --arm natural|compact | --score file | --gold | --ranks file");
