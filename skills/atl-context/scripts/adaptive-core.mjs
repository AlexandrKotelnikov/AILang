// ATL adaptive compiler prototype: exact reversible text representations.
// Count the complete submitted text, not the sum of separately tokenized fragments.
import {normalize,group,expand,flatInstruction,groupInstruction} from "./batch-core.mjs";
const naturalInstruction="Each context below applies to its listed questions.";
const tupleInstruction="Each block is [context,[[id,question],...]]. Apply its context independently to each question.";
const lineInstruction="Each block: context line, then ID:question lines. Blank lines separate blocks.";
function unpackTuples(x){return expand(x.map(([context,tasks])=>({context,tasks:tasks.map(([id,task])=>({id,task}))})));}
function readLines(s,separator){return normalize(s.split("\n\n").flatMap(block=>{const [context,...lines]=block.split("\n");return lines.map(l=>{const j=l.indexOf(separator);if(j<1)throw Error("Invalid task line");return {id:l.slice(0,j),context,task:l.slice(j+separator.length)};});}));}
function candidates(rows,{prefix="",suffix=""}={}){
 const flat=normalize(rows),blocks=group(flat),out=[];
 const same=x=>JSON.stringify(x)===JSON.stringify(flat);
 function add(mode,instruction,payload,decoded){
  if(!same(decoded))throw Error("Roundtrip mismatch: "+mode);
  out.push({mode,instruction,payload,text:prefix+instruction+"\n"+payload+suffix,roundtrip:true});
 }
 // Plain-text layouts are offered only if their delimiters cannot occur ambiguously.
 if(flat.every(r=>/^[A-Za-z0-9_-]+$/.test(r.id)&&r.context.length>0&&!/[\r\n]/.test(r.context)&&!/[\r\n]/.test(r.task))){
  for(const [mode,instruction,separator] of [["natural",naturalInstruction,": "],["lines",lineInstruction,":"]]){
   const payload=blocks.map(b=>b.context+"\n"+b.tasks.map(t=>t.id+separator+t.task).join("\n")).join("\n\n");
   add(mode,instruction,payload,readLines(payload,separator));
  }
 }
 const tuples=JSON.stringify(blocks.map(b=>[b.context,b.tasks.map(t=>[t.id,t.task])]));
 add("tuples",tupleInstruction,tuples,unpackTuples(JSON.parse(tuples)));
 const grouped=JSON.stringify(blocks);
 add("grouped",groupInstruction,grouped,expand(JSON.parse(grouped)));
 const repeated=JSON.stringify(flat);
 add("flat",flatInstruction,repeated,normalize(JSON.parse(repeated)));
 return out;
}
function routeAdaptive(rows,count,options={}){
 if(typeof count!=="function")throw Error("Verified token counter required");
 const measured=candidates(rows,options).map(c=>{const tokens=count(c.text);if(!Number.isSafeInteger(tokens)||tokens<1)throw Error("Invalid token count");return {...c,tokens};});
 // In ties retain the earlier representation, favoring readable natural language.
 const selected=measured.reduce((a,b)=>b.tokens<a.tokens?b:a);
 return {selected,counts:Object.fromEntries(measured.map(c=>[c.mode,c.tokens])),roundtrip:measured.every(c=>c.roundtrip)};
}
export {candidates,routeAdaptive,naturalInstruction,tupleInstruction,lineInstruction};
