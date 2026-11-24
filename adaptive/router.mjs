import {codec,mine} from "../evolution/core.mjs";
const BASE="Solve accurately. Give a brief checkable derivation and final answer.";
function instruction(dict){
 return dict.length?BASE+" Decode ~i~ as the exact string at zero-based index i in "+JSON.stringify(dict)+". Literal ~ is ~~.":BASE;
}

function cost(texts,dict,count){
 const c=codec(dict);
 return count(instruction(dict))+texts.reduce((s,t)=>s+count(c.encode(t)),0);
}

function batches(rows,n){
 const out=[];for(let i=0;i<rows.length;i+=n)out.push(rows.slice(i,i+n));return out;
}

function train(rows,count,batch=100){
 const texts=rows.map(r=>r.prompt);
 const candidates=mine(texts,24),groups=batches(texts,batch);
 const total=d=>groups.reduce((sum,g)=>sum+cost(g,d,count),0);
 let dict=[],best=total(dict),history=[{dict:[],cost:best}];
 for(let step=0;step<6;step++){
  let next=null,score=best;
  const test=d=>{const v=total(d);if(v<score){next=d;score=v;}};
  if(dict.length<4)for(const p of candidates)if(!dict.includes(p))test([...dict,p]);
  for(let i=0;i<dict.length;i++){
   test(dict.filter((_,j)=>i!==j));
   for(const p of candidates)if(!dict.includes(p))test(dict.map((v,j)=>j===i?p:v));
  }
  if(!next)break;dict=next;best=score;history.push({dict:[...dict],cost:best});
 }
 return {dict,history,train_cases:rows.length};
}

function makeBank(dev,count){
 if(dev.some(r=>r.split!=="dev"))throw Error("Training must use dev only");
 const bank=[{name:"identity",dict:[]}];
 const g=train(dev,count);if(g.dict.length)bank.push({name:"global",...g});
 for(const f of [...new Set(dev.map(r=>r.family))].sort()){
  const m=train(dev.filter(r=>r.family===f),count);
  if(m.dict.length)bank.push({name:"domain:"+f,...m});
 }
 return bank;
}

function route(texts,bank,count){
 if(!bank.length||bank[0].dict.length)throw Error("Identity missing");
 const baseline=cost(texts,[],count);
 let winner=bank[0],best=baseline;
 for(const option of bank.slice(1)){
  const v=cost(texts,option.dict,count);
  if(v<best){winner=option;best=v;}
 }
 const c=codec(winner.dict),encoded=texts.map(t=>c.encode(t));
 for(let i=0;i<texts.length;i++)if(c.decode(encoded[i])!==texts[i])throw Error("Roundtrip");
 return {name:winner.name,dict:winner.dict,baseline,cost:best,encoded};
}

function evaluate(rows,bank,count,batch,order="mixed"){
 let baseline=0,evolved=0,groups=0,compressed=0,selected={};
 let ordered=[...rows];
 if(order==="domain")ordered.sort((a,b)=>a.family.localeCompare(b.family)||a.id.localeCompare(b.id));
 else if(order==="mixed")ordered.sort((a,b)=>a.id.split("-").at(-1).localeCompare(b.id.split("-").at(-1))||a.family.localeCompare(b.family));
 else throw Error("Unknown order");
 for(const g of batches(ordered,batch)){
  const r=route(g.map(t=>t.prompt),bank,count);baseline+=r.baseline;evolved+=r.cost;groups++;if(r.name!=="identity")compressed++;
  selected[r.name]=(selected[r.name]??0)+1;
 }
 if(evolved>baseline)throw Error("Fallback violation");
 return {cases:rows.length,batch,order,groups,compressed_groups:compressed,baseline,evolved,saving_pct:100*(1-evolved/baseline),selected};
}

function run(corpus,complex,count){
 const dev=corpus.filter(r=>r.split==="dev").map(r=>({id:r.id,family:r.family,split:r.split,prompt:r.compact}));
 const test=corpus.filter(r=>r.split==="test").map(r=>({id:r.id,family:r.family,split:r.split,prompt:r.compact}));
 const newtest=complex.filter(r=>r.split==="test").map(r=>({id:r.id,family:r.family,split:r.split,prompt:r.prompt}));
 const bank=makeBank(dev,count);
 // Train only on prior benchmark prompts; evaluate on old held-out and new-family inputs.
 const reports={old:[1,10,100].flatMap(n=>["mixed","domain"].map(o=>evaluate(test,bank,count,n,o))),
 complex:[1,10,36].map(n=>evaluate(newtest,bank,count,n,"mixed"))};
 const seen=new Set(dev.map(r=>r.id));if(test.some(r=>seen.has(r.id)))throw Error("Overlap");
 const identity=route(["unrelated test ~"],[{name:"identity",dict:[]},{name:"bad",dict:["not present"]}],count);
 if(identity.name!=="identity")throw Error("Identity fallback");
 return {scope:"Static input-token-only routing, no output or LLM accuracy measurement. Codebooks trained on dev prompts only. Dictionary overhead once per hypothetical batch; separate-string token counts exclude framing/separators. Router computational overhead not measured. Test input-only selection is allowed; test labels/answers are never used.",bank,reports};
}
export {instruction,cost,train,makeBank,route,evaluate,run};
