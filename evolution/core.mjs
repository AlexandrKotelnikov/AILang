// ATL Evolution: deterministic dictionary induction, exact codec and cost-aware search.
const BASE="Solve accurately. Give a brief checkable derivation and final answer.";
function chars(s){return [...s].length;}

function validate(dict){
 if(!Array.isArray(dict)||dict.length>64||new Set(dict).size!==dict.length||dict.some(x=>typeof x!=="string"||!x||x.includes("~")))throw Error("Invalid dictionary");
}

function codec(dict){
 validate(dict);
 if(!dict.length)return {encode:s=>s,decode:s=>s};
 const codes=new Map(dict.map((v,i)=>[v,"~"+i+"~"]));
 const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
 const re=new RegExp(["~",...dict.slice().sort((a,b)=>b.length-a.length||a.localeCompare(b)).map(esc)].join("|"),"g");
 return {
 encode:s=>s.replace(re,m=>m==="~"?"~~":codes.get(m)),
 decode:s=>{
  let out="",i=0;
  while(i<s.length){
   if(s[i]!=="~"){out+=s[i++];continue;}
   if(s[i+1]==="~"){out+="~";i+=2;continue;}
   const j=s.indexOf("~",i+1);
   if(j<0)throw Error("Unclosed code");
   const key=s.slice(i+1,j);
   if(!/^(0|[1-9]\d*)$/.test(key)||Number(key)>=dict.length)throw Error("Unknown code");
   out+=dict[Number(key)];i=j+1;
  }return out;
 }
 };
}

function instruction(dict){
 return dict.length?BASE+" ATL: expand ~i~ as exact string at zero-based index i in "+JSON.stringify(dict)+". Literal ~ is ~~. Encode repeated phrases with these codes; preserve meaning.":BASE;
}

function getTexts(rows){return rows.flatMap(r=>[r.compact,r.compact_trace]);}

function mine(texts,max=32){
 const freq=new Map();
 for(const s of texts){
  const parts=s.match(/[A-Za-z]+|\d+|[^\sA-Za-z\d]+|\s+/g)||[];
  for(let i=0;i<parts.length;i++){
   if(/^\s/.test(parts[i]))continue;
   for(let n=2;n<=9&&i+n<=parts.length;n++){
    const v=parts.slice(i,i+n).join("");
    if(/\s$/.test(v)||v.length<5||v.length>64||v.includes("~"))continue;
    freq.set(v,(freq.get(v)||0)+1);
   }
  }
 }
 return [...freq].filter(([v,n])=>n>=3).sort((a,b)=>(b[0].length-3)*b[1]-(a[0].length-3)*a[1]||a[0].localeCompare(b[0])).slice(0,max).map(([v])=>v);
}

function measure(rows,dict,count,batch){
 const c=codec(dict);
 let input=0,output=0;
 for(const r of rows){input+=count(c.encode(r.compact));output+=count(c.encode(r.compact_trace));}
 const copies=Math.ceil(rows.length/batch),overhead=copies*count(instruction(dict));
 return {cases:rows.length,batch,instruction_copies:copies,input,output,instruction:overhead,total:input+output+overhead};
}

function evolve(dev,count,batch,candidates,maxEntries=8){
 let dict=[],best=measure(dev,dict,count,batch).total;
 const initial=best,history=[{op:"identity",cost:best,dict:[]}];
 for(let step=0;step<maxEntries*2;step++){
  let choice=null,cost=best,op="";
  const test=(d,label)=>{const v=measure(dev,d,count,batch).total;if(v<cost){cost=v;choice=d;op=label;}};
  if(dict.length<maxEntries)for(const p of candidates)if(!dict.includes(p))test([...dict,p],"add");
  for(let i=0;i<dict.length;i++){
   test(dict.filter((_,j)=>i!==j),"drop");
   for(const p of candidates)if(!dict.includes(p))test(dict.map((v,j)=>i===j?p:v),"replace");
  }
  if(!choice)break;
  dict=choice;best=cost;history.push({op,cost,dict:[...dict]});
 }
 return {dict,initial,best,history};
}

function run(rows,count,unit,batches=[1,10,100]){
 if(rows.length!==1000||new Set(rows.map(r=>r.id)).size!==1000||rows.some(r=>!["dev","test"].includes(r.split)||typeof r.compact!=="string"||typeof r.compact_trace!=="string"))throw Error("Invalid dataset");
 const dev=rows.filter(r=>r.split==="dev"),test=rows.filter(r=>r.split==="test");
 if(dev.length!==600||test.length!==400)throw Error("Invalid split");
 const candidates=mine(getTexts(dev)),results=[];
 for(const batch of batches){
  const e=evolve(dev,count,batch,candidates);
  const c=codec(e.dict);
  for(const s of getTexts(rows))if(c.decode(c.encode(s))!==s)throw Error("Roundtrip failure");
  const testBase=measure(test,[],count,batch),testEvolved=measure(test,e.dict,count,batch);
  results.push({batch,dict:e.dict,history:e.history,dev_baseline:e.initial,dev_evolved:e.best,test_baseline:testBase,test_evolved:testEvolved,test_saving_pct:100*(1-testEvolved.total/testBase.total),roundtrip_strings:rows.length*2});
 }
 return {version:"0.4",unit,scope:"Lossless static compact reference text compression; no LLM inference, no accuracy or internal reasoning claim; within-template split; batch count is hypothetical instruction reuse, not API billing.",candidates,dev_cases:dev.length,test_cases:test.length,results};
}

function selfTest(){
 const a=(x,m)=>{if(!x)throw Error(m)};
 const d=["A+B","A","hello?","x[2]"],c=codec(d);
 for(const s of ["A+B A","~0~ ~~ A","hello? x[2]","日本語 😀","~","~999~","A+B~0~"])a(c.decode(c.encode(s))===s,"roundtrip");
 for(const s of ["~","~999~","~01~","~x~"]){let bad=false;try{c.decode(s);}catch{bad=true;}a(bad,"invalid code accepted");}
 const fake=Array.from({length:12},()=>({compact:"same repeated phrase / same repeated phrase",compact_trace:"same repeated phrase"}));
 const e=evolve(fake,chars,12,["same repeated phrase"],2);
 a(e.best<=e.initial,"nonmonotonic");a(e.history.every((x,i)=>!i||x.cost<e.history[i-1].cost),"history");
 a(codec([]).decode("~0~")==="~0~","identity");
 return "14 checks passed (7 roundtrips, 4 malformed codes, monotonic search, history, identity)";
}
export {chars,codec,instruction,mine,measure,evolve,run,selfTest};
