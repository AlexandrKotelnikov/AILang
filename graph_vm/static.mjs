// ATL v0.4.8 Graph VM static benchmark; no model inference.
import {readFileSync} from "node:fs";
import {pathToFileURL} from "node:url";
import {tokenizer,verify,EXPECTED} from "../adaptive/tokenizer.mjs";
function lab(count, visit=()=>{}){
 const M=97, mod=x=>(x%M+M)%M, eq=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
 const layouts=[[[[0,1],2],[[1,2],3],[[4,0],5],[[5,4],6]],[[[0,2],1],[[4,3],2],[[4,5],0],[[6,1],5]]];
 const ops=[(a,b)=>a+b,(a,b)=>a-b,(a,b)=>a*b,(a,b)=>Math.max(a,b)];
 function vm(f,p,v){if(!/^[0-7]{4}$/.test(p)||p.length!==4||v.length!==4||v.some(x=>!Number.isInteger(x)||x<0||x>=97))throw Error("invalid program or input");const r=v.slice();layouts[f].forEach(([ls,b],i)=>{const k=+p[i];r.push(mod(ops[k%4](r[ls[k>>2]],r[b])))});return r.slice(4);}
 function ref(f,p,v){const [x,y,z,w]=v, h=(k,a,b)=>k%4===0?(a+b)%97:k%4===1?(a-b+97)%97:k%4===2?(a*b)%97:a>b?a:b, [i,j,k,l]=p.split("").map(Number);let a,b,c,d;if(f===0){a=h(i,i<4?x:y,z);b=h(j,j<4?y:z,w);c=h(k,k<4?a:x,b);d=h(l,l<4?b:a,c);}else{a=h(i,i<4?x:z,y);b=h(j,j<4?a:w,z);c=h(k,k<4?a:b,x);d=h(l,l<4?c:y,b);}return [a,b,c,d];}
 const obs=r=>r.slice(2), programs=Array.from({length:4096},(_,i)=>i.toString(8).padStart(4,"0"));
 const solve=(f,cal,engine)=>programs.filter(p=>cal.every(([v,o])=>eq(obs(engine(f,p,v)),o)));
 function rng(seed){return n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return Math.floor(seed/4294967296*n)}}
 const width=v=>v.map(x=>String(x).padStart(2,"0")).join(""),csv=v=>v.join(",");
 function decode(s,n,packed){if(packed?!new RegExp("^[0-9]{"+2*n+"}$").test(s):!new RegExp("^(?:0|[1-9][0-9]?)(?:,(?:0|[1-9][0-9]?)){"+(n-1)+"}$").test(s))throw Error("bad row");const a=(packed?s.match(/../g):s.split(",")).map(Number);if(a.some(x=>x>=97))throw Error("range");return a;}
 const base="Four inputs indexed 0..3. Four nodes indexed 4..7. Each node has two candidate left indices and one fixed right index. Each node triple is left0,left1,right. Its digit k in 0..7 selects left index floor(k/4) and operation k mod 4: 0 add, 1 left minus right, 2 multiply, 3 max. Each node result is modulo 97 in 0..96. Calibration rows contain four inputs followed by node 6 and 7 outputs. Recover the unique four digits.";
 const format={csv:" Rows are comma-separated integers.",fixed:" Each row concatenates two decimal digits per value, with leading zero.",atl:" ATL W2 rows concatenate two decimal digits per value, with leading zero."};
 const modes=["csv-program","fixed-program","atl-program","csv-direct","fixed-direct","atl-direct"];
 function instr(m){const [a,b]=m.split("-");return base+format[a]+(b==="program"?(a==="atl"?" An external interpreter computes forecasts. Return P: followed by four octal digits only.":" An external interpreter computes forecasts. Return four octal digits only."):" Return the program on the first line (four octal digits"+(a==="atl"?", prefixed P:":"")+") then node 6 and 7 for each forecast row in the input row format, no labels.");}
 function wire(m,t){const a=m.split("-")[0], pack=a!=="csv", enc=pack?width:csv;return "Nodes 4..7: "+layouts[t.f].map(([ls,b])=>[...ls,b].join(",")).join(";")+"\nCalibration:\n"+t.cal.map(([v,o])=>enc([...v,...o])).join("\n")+"\nForecast:\n"+t.q.map(enc).join("\n");}
 function output(m,p,trace){const [a,b]=m.split("-"),head=(a==="atl"?"P:":"")+p;return b==="program"?head:[head,...trace.map(a==="csv"?csv:width)].join("\n");}
 function verify(m,t,s){try{const [a,b]=m.split("-");if(typeof s!=="string"||s.length>10000)return false;const lines=s.split("\n"),head=lines.shift(),p=a==="atl"?head.startsWith("P:")?head.slice(2):"":head;if(!/^[0-7]{4}$/.test(p)||p.length!==4)return false;if(!t.cal.every(([v,o])=>eq(obs(vm(t.f,p,v)),o)))return false;if(b==="program")return lines.length===0;if(lines.length!==t.q.length)return false;return lines.every((l,i)=>eq(decode(l,2,a!=="csv"),obs(vm(t.f,p,t.q[i]))));}catch{return false;}}
 const totals=Object.fromEntries(modes.map(m=>[m,{system:0,input:0,output:0,total:0}]));let tasks=0,pilot=0,rows=0,valid=0,negative=0,rejected=0,attempts=0;const seen=new Set(),examples=[];
 for(let f=0;f<2;f++)for(const split of ["dev","pilot"]){const r=rng(99217+f*74731+(split==="pilot"?992319:0));for(let n=0;n<(split==="dev"?10:40);){if(++attempts>1000)throw Error("generation limit");const p=programs[r(4096)],v=()=>Array.from({length:4},()=>r(97)),cal=Array.from({length:8},()=>{const a=v();return [a,obs(ref(f,p,a))]});const s=solve(f,cal,vm);if(s.length!==1){rejected++;continue;}const other=solve(f,cal,ref);if(s[0]!==p||other.length!==1||other[0]!==p)throw Error("oracle disagreement");const q=Array.from({length:16+r(25)},v),t={f,cal,q},key=JSON.stringify(t);if(seen.has(key))throw Error("duplicate");seen.add(key);const trace=q.map(a=>{const b=vm(f,p,a);if(!eq(b,ref(f,p,a)))throw Error("trace mismatch");return obs(b)});n++;tasks++;rows+=q.length;if(split==="pilot")pilot++;
 for(const m of modes){const w=wire(m,t),o=output(m,p,trace),ins=instr(m),pack=!m.startsWith("csv"),ls=w.split("\n");const c=ls.slice(2,10).map(l=>decode(l,6,pack)),qq=ls.slice(11).map(l=>decode(l,4,pack));if(JSON.stringify(c)!==JSON.stringify(cal.map(([a,b])=>[...a,...b]))||JSON.stringify(qq)!==JSON.stringify(q))throw Error("wire roundtrip");if(!verify(m,t,o))throw Error("valid rejection");valid++;const bad=[o+"\n"];for(let i=0;i<4;i++)bad.push(output(m,p.slice(0,i)+((+p[i]+1)%8)+p.slice(i+1),trace));if(m.endsWith("direct")){const tr=trace.map(x=>x.slice());tr[0][0]=(tr[0][0]+1)%97;bad.push(output(m,p,tr));}for(const b of bad){if(verify(m,t,b))throw Error("accepted mutation");negative++;}
 if(split==="pilot"){visit({id:`${f}-${n}`,mode:m,system:ins,input:w,reference:o,score:s=>verify(m,t,s)});const z=totals[m],a=count(ins),b=count(w),c=count(o);z.system+=a;z.input+=b;z.output+=c;z.total+=a+b+c;}
 if(f===0&&split==="pilot"&&n===1)examples.push({mode:m,system:ins,input:w,output:o,tokens:[count(ins),count(w),count(o)]});
 }
 }}
 return {tasks,pilot,rows,valid,negative,rejected,attempts,totals,examples};
}
export {lab};
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){const path=process.argv[2]; if(!path) throw Error("Pass rank file"); const enc=tokenizer(readFileSync(path,"utf8")); console.log(JSON.stringify({encoding:"o200k_base",sha256:EXPECTED,golden:verify(enc),...lab(s=>enc(s).length)},null,2));

}
