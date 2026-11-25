import {readFileSync,writeFileSync} from "node:fs";
import {tokenizer,verify} from "../adaptive/tokenizer.mjs";
function lab(encode, allFixtures=false) {
 const mod=x=>((x%97)+97)%97, w=x=>String(x).padStart(2,"0"), eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 function rng(seed){let s=seed>>>0;return n=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return Math.floor(s/4294967296*n)}}
 function make(i){const r=rng(13579+i*104729),nodes=[];const add=(op,a,b)=>{nodes.push([op,a,b]);return nodes.length+3};const plus=(a,b)=>add("+",a,b),minus=(a,b)=>add("-",a,b),mul=(a,b)=>add("*",a,b);
 const family=["sparse","dense","mixed"][i%3], n=8+r(9);
 let p=plus(1,2),q=plus(2,1),s=minus(p,q); // zero, structural CSE possible
 for(let j=0;j<n;j++){const a=r(nodes.length+4), b=r(nodes.length+4);r(3)===0?mul(a,1+r(96)):plus(a,b);}
 function linear(vars){let v=mul(vars[0],1+r(96));for(let j=1;j<vars.length;j++)v=plus(v,mul(vars[j],1+r(96)));return v;}
 const o1=plus(linear(family==="dense"?[0,1,2,3]:[1]),s);
 const o2=minus(plus(linear(family==="sparse"?[0,3]:[0,1,2,3]),p),q);
 for(let j=0;j<3;j++)mul(r(nodes.length+4),1+r(96));
 const queries=Array.from({length:16+8*r(5)},()=>[r(97),r(97),r(97)]);
 return {id:i,family,nodes,outputs:[o1,o2],queries};
 }
 function scalar(g,x){const v=[1,...x];for(const [op,a,b] of g.nodes)v.push(mod(op==="+"?v[a]+v[b]:op==="-"?v[a]-v[b]:v[a]*b));return g.outputs.map(k=>v[k]);}
 function compile(g){const v=Array.from({length:4},(_,i)=>Array.from({length:4},(_,j)=>+(i===j)));for(const [op,a,b] of g.nodes)v.push(v[a].map((z,j)=>mod(op==="+"?z+v[b][j]:op==="-"?z-v[b][j]:z*b)));return g.outputs.map(k=>v[k]);}
 function evaluate(c,x){return c.map(row=>mod(row[0]+row[1]*x[0]+row[2]*x[1]+row[3]*x[2]));}
 function optimize(g){const map=[0,1,2,3],pool=new Map(),nodes=[];for(const [op,a,b] of g.nodes){let x=map[a],y=op==="*"?b:map[b];if(op==="+"&&x>y)[x,y]=[y,x];const k=[op,x,y].join(",");if(!pool.has(k)){pool.set(k,nodes.length+4);nodes.push([op,x,y]);}map.push(pool.get(k));}const out=g.outputs.map(i=>map[i]),live=new Set();function mark(i){if(i<4||live.has(i))return;live.add(i);const [op,a,b]=nodes[i-4];mark(a);if(op!=="*")mark(b);}out.forEach(mark);const remap=[0,1,2,3],reduced=[];for(let j=0;j<nodes.length;j++){const i=j+4;if(!live.has(i))continue;const [op,a,b]=nodes[j];remap[i]=reduced.length+4;reduced.push([op,remap[a],op==="*"?b:remap[b]]);}return {...g,nodes:reduced,outputs:out.map(i=>remap[i]),cse:g.nodes.length-nodes.length,dead:nodes.length-reduced.length};}
 const modes=["full-direct","reduced-direct","full-dense","reduced-dense","reduced-sparse","atl-sparse"];
 const base="All arithmetic modulo 97, residues 0..96. Nodes 0=1,1=x,2=y,3=z. Each semicolon-separated triple defines the next node in order: operator, left node index, right node index (or literal scalar for *). O lists two output node indices. Q lists query triples x,y,z, each encoded as six decimal digits (two per value, leading zeros).";
 const systems=Object.fromEntries(modes.map(m=>[m,base+" "+(m.endsWith("direct")?"Return only the concatenation of both output values for each query in order, each value exactly two decimal digits.":m.endsWith("dense")?"Return only two affine coefficient rows in output order, concatenated, each row has four two-digit residues in order constant,x,y,z. The evaluator expands rows for all queries.": "Return only two affine coefficient rows separated by /, each row is a single hexadecimal mask digit (bits 1,2,4,8 for constant,x,y,z) followed by exactly two decimal digits for each nonzero coefficient in that order. Omit zero coefficients. The evaluator expands rows for all queries."+(m==="atl-sparse"?" Prefix the answer with ATL:.":""))]));
 function input(g){return g.nodes.map(n=>n.join(",")).join(";")+"\nO:"+g.outputs.join(",")+"\nQ:"+g.queries.map(q=>q.map(w).join("")).join(",");}
 function sparse(c){return c.map(row=>row.reduce((m,z,j)=>m+(z?1<<j:0),0).toString(16)+row.filter(Boolean).map(w).join("")).join("/");}
 function parse(m,s,g){if(m==="atl-sparse"){if(!s.startsWith("ATL:"))throw Error("prefix");s=s.slice(4);}function digits(s){if(!/^(?:\d{2})*$/.test(s))throw Error("digits");const a=(s.match(/../g)||[]).map(Number);if(a.some(x=>x>96))throw Error("range");return a;}
 if(m.endsWith("direct")){const a=digits(s);if(a.length!==g.queries.length*2)throw Error("length");return {direct:a};}
 if(m.endsWith("dense")){const a=digits(s);if(a.length!==8)throw Error("length");return {coeff:[a.slice(0,4),a.slice(4)]};}
 const rows=s.split("/");if(rows.length!==2)throw Error("rows");return {coeff:rows.map(row=>{if(!/^[0-9a-f]/.test(row))throw Error("mask");const mask=parseInt(row[0],16),a=digits(row.slice(1));if(a.some(x=>!x))throw Error("zero");const out=Array.from({length:4},(_,j)=>mask&(1<<j)?a.shift():0);if(a.length||out.includes(undefined))throw Error("length");return out;})};}
 function score(m,s,g,c){try{const v=parse(m,s,g);if(v.coeff&&!eq(v.coeff,c))return false;return eq(v.direct??g.queries.flatMap(x=>evaluate(v.coeff,x)),g.queries.flatMap(x=>scalar(g,x)));}catch{return false;}}
 const count=s=>encode(s).length;
 const totals=Object.fromEntries(modes.map(m=>[m,{system:0,input:0,output:0,total:0,passed:0}]));
 const byFamily={};let original=0,reduced=0,cse=0,dead=0,queries=0,mutations=0,verified=0;const fixtures=[];
 for(let i=0;i<120;i++){const g=make(i),opt=optimize(g),c=compile(g);const b=scalar(g,[0,0,0]);const probes=[[1,0,0],[0,1,0],[0,0,1]].map(x=>scalar(g,x));const ref=b.map((z,j)=>[z,...probes.map(p=>mod(p[j]-z))]);if(!eq(c,ref)||!eq(c,compile(opt)))throw Error("coefficient mismatch");for(const x of g.queries){if(!eq(scalar(g,x),evaluate(c,x))||!eq(scalar(g,x),scalar(opt,x)))throw Error("query mismatch");}verified++;
 for(const m of modes){const inp=input(m.startsWith("full")?g:opt),out=m.endsWith("direct")?g.queries.flatMap(x=>scalar(g,x)).map(w).join(""):m.endsWith("dense")?c.flat().map(w).join(""):(m==="atl-sparse"?"ATL:":"")+sparse(c);
 if(!score(m,out,g,c))throw Error("valid output rejected");for(const bad of [out+"!",out.slice(0,-1),out+"00"]){if(score(m,bad,g,c))throw Error("invalid accepted");mutations++;}
 if(i>=24){const a=totals[m],s=count(systems[m]),p=count(inp),o=count(out);a.system+=s;a.input+=p;a.output+=o;a.total+=s+p+o;a.passed++;const f=byFamily[g.family]??={};f[m]=(f[m]??0)+s+p+o;if(allFixtures||i<27)fixtures.push({id:i,mode:m,system:systems[m],input:inp,expected:out});}}
 if(i>=24){original+=g.nodes.length;reduced+=opt.nodes.length;cse+=opt.cse;dead+=opt.dead;queries+=g.queries.length;}
 }
 return {version:"0.4.9",development:24,test:96,verified,validFormats:verified*modes.length,mutations,queries,original,reduced,cse,dead,totals,byFamily,fixtures};
}
const encode=tokenizer(readFileSync(process.argv[2],"utf8"));verify(encode);const result=lab(encode,process.argv.includes("--all-fixtures"));if(process.argv[3]&&process.argv[3]!=="--all-fixtures")writeFileSync(process.argv[3],JSON.stringify(result,null,2)+"\n");else console.log(JSON.stringify(result,null,2));
