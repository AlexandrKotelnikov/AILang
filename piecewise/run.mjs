import fs from "node:fs";
import {tokenizer,verify} from "../adaptive/tokenizer.mjs";
function experiment(encode){
 const p=97,mod=x=>((x%p)+p)%p,sizes=[1,2,4,8,16,32,64,96];let s=0x7621afe3;
 function rnd(n){s=(Math.imul(1664525,s)+1013904223)>>>0;return Math.floor(s/4294967296*n);}
 function assert(x,m){if(!x)throw Error(m);}
 function chain(){let steps=[],degree=0,muls=0;const n=9+rnd(10);for(let i=0;i<n;i++){let op=degree<4&&((i===n-1&&muls===0)||rnd(4)===0)?"M":"A";if(op==="M"){degree++;muls++;}else degree=Math.max(1,degree);steps.push([op,1+rnd(96),1+rnd(96)]);}return {start:1+rnd(96),steps};}
 function direct(c,x){let v=c.start;for(const [op,a,b] of c.steps)v=mod(op==="M"?v*(a*x+b):a*v+b*x);return v;}
 function coeff(c){let z=[c.start,0,0,0,0];for(const [op,a,b] of c.steps){if(op==="M")assert(z[4]===0,"degree overflow");z=z.map((q,i)=>mod(op==="M"?b*q+(i?a*z[i-1]:0):a*q+(i===1?b:0)));}return z;}
 const poly=(z,x)=>z.reduceRight((a,b)=>mod(a*x+b),0),chainText=c=>c.start+";"+c.steps.map(a=>a.join(",")).join(";");
 const common="All arithmetic modulo 97. Input gives threshold t and two chains. A,a,b updates v=a*v+b*x; M,a,b updates v=v*(a*x+b). Each chain starts at the integer before its semicolon. Use left chain if x<t, else right. x is an integer 0..96.";
 const dense="Return exactly two JSON arrays of five coefficients c0..c4, nested in one array, low degrees first, for the two polynomials modulo 97. Coefficients 0..96.";
 const atl="Return L:c0,c1,c2,c3,c4;R:c0,c1,c2,c3,c4, low degrees first, coefficients 0..96 for the left and right polynomials modulo 97.";
 const python="Return one Python expression in x only, using an if/else conditional and modular Horner polynomials; no prose. Use canonical coefficients 0..96.";
 const systems={direct:common+" Return a JSON array of residues in query order.",dense:common+" "+dense,atl:common+" "+atl,python:common+" "+python,dense_free:common+" "+dense,atl_free:common+" "+atl,python_free:common+" "+python};
 const modes=Object.keys(systems),count=x=>encode(x).length,sys=Object.fromEntries(modes.map(m=>[m,count(systems[m])]));
 const horner=z=>z.slice().reverse().reduce((a,b,i)=>i===0?String(b):"("+a+"*x+"+b+")","")+"%97";
 let fixtures=[],checked=0,mutations=0,queries=0;
 for(const split of ["dev","test"])for(const n of sizes)for(let k=0;k<(split==="dev"?4:10);k++){
 const t=12+rnd(74),l=chain(),r=chain(),q=Array.from({length:97},(_,i)=>i);
 for(let i=q.length-1;i>0;i--){const j=rnd(i+1);[q[i],q[j]]=[q[j],q[i]];}q.length=n;
 const z=[coeff(l),coeff(r)],truth=x=>direct(x<t?l:r,x),evalZ=(zz,x)=>poly(zz[x<t?0:1],x);
 const valid=zz=>Array.isArray(zz)&&zz.length===2&&zz.every(a=>Array.isArray(a)&&a.length===5&&a.every(v=>Number.isInteger(v)&&v>=0&&v<97))&&Array.from({length:97},(_,x)=>evalZ(zz,x)===truth(x)).every(Boolean);
 assert(valid(z),"coefficient verification");
 for(let b=0;b<2;b++)for(let j=0;j<5;j++){let bad=z.map(a=>a.slice());bad[b][j]=mod(bad[b][j]+1);assert(!valid(bad),"accepted mutation");mutations++;}
 const h=z.map(horner),evalH=h.map(x=>new Function("x","return "+x));for(let x=0;x<97;x++){assert(evalH[x<t?0:1](x)===truth(x),"Horner expression");checked++;}
 const input=`t=${t}\nL=${chainText(l)}\nR=${chainText(r)}`,withQ=input+"\nQ="+JSON.stringify(q);
 const outputs={direct:JSON.stringify(q.map(truth)),dense:JSON.stringify(z),atl:"L:"+z[0].join(",")+";R:"+z[1].join(","),python:h[0]+" if x<"+t+" else "+h[1]};
 for(const m of ["dense","atl","python"])outputs[m+"_free"]=outputs[m];
 const costs=Object.fromEntries(modes.map(m=>[m,{system:sys[m],input:count(m.endsWith("_free")?input:withQ),output:count(outputs[m])}]));
 fixtures.push({id:split+"-"+n+"-"+k,split,n,t,l,r,q,coefficients:z,input,withQ,outputs,costs});if(split==="test")queries+=n;
 }
 const total=c=>c.system+c.input+c.output,dev=fixtures.filter(f=>f.split==="dev"),test=fixtures.filter(f=>f.split==="test");
 const means=Object.fromEntries(sizes.map(n=>[n,Object.fromEntries(modes.map(m=>[m,dev.filter(f=>f.n===n).reduce((a,f)=>a+f.costs[m].output,0)/4]))]));
 const choose=(f,bank)=>bank.reduce((a,b)=>f.costs[b].system+f.costs[b].input+means[f.n][b]<f.costs[a].system+f.costs[a].input+means[f.n][a]?b:a);
 const sum=(fs,m)=>fs.reduce((a,f)=>{const c=f.costs[typeof m==="function"?m(f):m];return {system:a.system+c.system,input:a.input+c.input,output:a.output+c.output,total:a.total+total(c)};},{system:0,input:0,output:0,total:0});
 const route=f=>choose(f,modes),routeSame=f=>choose(f,modes.filter(m=>!m.endsWith("_free")));
 const rows=Object.fromEntries([...modes.map(m=>[m,sum(test,m)]),["adaptive",sum(test,route)],["adaptive_same",sum(test,routeSame)]]);
 const groups=sizes.map(n=>{const fs=test.filter(f=>f.n===n);return {n,...Object.fromEntries(modes.map(m=>[m,sum(fs,m).total])),adaptive:sum(fs,route).total,adaptive_same:sum(fs,routeSame).total,choices:Object.fromEntries(modes.map(m=>[m,fs.filter(f=>route(f)===m).length])),sameChoices:Object.fromEntries(modes.map(m=>[m,fs.filter(f=>routeSame(f)===m).length]))};});
 const oracle=test.reduce((a,f)=>a+Math.min(...modes.map(m=>total(f.costs[m]))),0);
 return {seed:"0x7621afe3",dev:dev.length,test:test.length,checked,mutations,queries,systems,means,rows,groups,oracle,fixtures};
}
const raw=fs.readFileSync(process.argv[2],"utf8");const encode=tokenizer(raw);verify(encode);const report=experiment(encode);const out=process.argv[3]||"piecewise-report.json";fs.writeFileSync(out,JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify(report.rows,null,2));
