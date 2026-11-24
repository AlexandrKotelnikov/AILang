// ATL v0.4.6 — bounded recurrence identification and executable forecasts.
function recursive(){
 const modes=["dense","compact-rec","atl-rec","final-only"];
 const profiles=["modular","clipped"];
 const integer=Number.isSafeInteger;
 function rng(seed){let x=seed>>>0;return n=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return Math.floor(x/4294967296*n);};}
 function valid(t){if(!t||!profiles.includes(t.family))return false;let {limit,start,cal,obs,future}=t;
 return integer(limit)&&limit>=17&&limit<=251&&integer(start)&&start>=0&&start<=(t.family==="modular"?limit-1:limit)&&Array.isArray(cal)&&cal.length>=1&&cal.length<=20&&Array.isArray(obs)&&obs.length===cal.length&&obs.every(x=>integer(x)&&x>=0&&x<=(t.family==="modular"?limit-1:limit))&&Array.isArray(future)&&future.length>=1&&future.length<=200&&[...cal,...future].every(x=>integer(x)&&Math.abs(x)<=20);}
 function step(t,s,u,a,b){let x=t.family==="modular"?a*s+b+u:s+a*u+b;return t.family==="modular"?((x%t.limit)+t.limit)%t.limit:Math.max(0,Math.min(t.limit,x));}
 function replay(t,s,inputs,a,b){return inputs.map(u=>s=step(t,s,u,a,b));}
 function domain(t){let a=[];for(let x=1;x<=9;x++)for(let b=-9;b<=9;b++)a.push([x,b]);return a;}
 function candidates(t){if(!valid(t))throw Error("task");return domain(t).filter(([a,b])=>replay(t,t.start,t.cal,a,b).every((v,i)=>v===t.obs[i]));}
 // Alternative calibration test uses each observed predecessor, not a generated trajectory.
 function alternative(t){if(!valid(t))throw Error("task");let pairs=domain(t);for(let i=0;i<t.cal.length;i++){const prev=i?t.obs[i-1]:t.start,u=t.cal[i],v=t.obs[i];pairs=pairs.filter(([a,b])=>{let y=t.family==="modular"?a*prev+b+u:prev+a*u+b;
 return t.family==="modular"?(y-v)%t.limit===0:v===0?y<=0:v===t.limit?y>=t.limit:y===v;});}return pairs;}
 function independentTrace(t,a,b){let x=t.obs.at(-1),out=[];for(let u of t.future){if(t.family==="modular"){x=a*x+b+u;while(x<0)x+=t.limit;while(x>=t.limit)x-=t.limit;}else{x=x+a*u+b;if(x>t.limit)x=t.limit;else if(x<0)x=0;}out.push(x);}return out;}
 function solve(t){let c=candidates(t);if(c.length!==1)throw Error("ambiguous");let [a,b]=c[0],trace=replay(t,t.obs.at(-1),t.future,a,b);return {a,b,trace,answer:trace.at(-1)};}
 function cases(){let out=[];for(let family of profiles)for(let k=0;k<120;k++){let r=rng(821773+k*8363+(family==="modular"?0:81327));let t;
 for(let retry=0;retry<200;retry++){let limit=family==="modular"?[53,79,101,127,151,199,251][r(7)]:100+r(152),start=r(limit),a=1+r(9),b=r(19)-9,cal=Array.from({length:12},()=>r(21)-10),future=Array.from({length:80+r(101)},()=>r(21)-10);t={id:family+"-"+k,family,split:k<30?"dev":"pilot",limit,start,cal,obs:[],future};t.obs=replay(t,start,cal,a,b);if(candidates(t).length===1)break;t=null;}
 if(!t)throw Error("generator");out.push(t);}return out;}
 function instruction(t,mode){let common=t.family==="modular"?"Infer integer a in 1..9 and b in -9..9 from calibration; s'=(a*s+b+u) mod M (nonnegative residue). ":"Infer integer a in 1..9 and b in -9..9 from calibration; s'=clip(s+a*u+b,0,M). ";
 common+="Forecast from last observed state using future inputs in order. ";
 if(mode==="final-only")return common+"Return exactly FINAL: <last state>.";
 if(mode==="dense")return common+"Output A:<a>,<b> then newline S:<comma-separated forecast states> then newline FINAL: <last state>. No extra text.";
 if(mode==="compact-rec")return common+"Output Replay: a=<a>,b=<b>,n=<forecast length> then newline FINAL: <last state>. This program denotes the complete forecast using the specified recurrence and inputs. No extra text.";
 return common+"Output R:<a>,<b>,<forecast length> then newline FINAL: <last state>. R denotes the complete forecast using the specified recurrence and inputs. No extra text.";}
 function prompt(t){return "M="+t.limit+"; initial="+t.start+"; calibration inputs="+JSON.stringify(t.cal)+"; observed states="+JSON.stringify(t.obs)+"; future inputs="+JSON.stringify(t.future)+".";}
 function render(t,m,r){let end="FINAL: "+r.answer;if(m==="final-only")return end;if(m==="dense")return "A:"+r.a+","+r.b+"\nS:"+r.trace.join(",")+"\n"+end;if(m==="compact-rec")return `Replay: a=${r.a},b=${r.b},n=${r.trace.length}\n`+end;if(m==="atl-rec")return `R:${r.a},${r.b},${r.trace.length}\n`+end;throw Error("mode");}
 function parse(t,m,s){if(!valid(t)||!modes.includes(m)||typeof s!=="string"||s.length>20000)return null;let p;if(m==="final-only"){p=s.match(/^FINAL: (0|[1-9]\d*)$/);return p&&integer(Number(p[1]))?{answer:Number(p[1])}:null;}
 if(m==="dense")p=s.match(/^A:([1-9]),(0|-?[1-9])\nS:((?:0|[1-9]\d*)(?:,(?:0|[1-9]\d*))*)\nFINAL: (0|[1-9]\d*)$/);
 else if(m==="compact-rec")p=s.match(/^Replay: a=([1-9]),b=(0|-?[1-9]),n=([1-9]\d*)\nFINAL: (0|[1-9]\d*)$/);
 else p=s.match(/^R:([1-9]),(0|-?[1-9]),([1-9]\d*)\nFINAL: (0|[1-9]\d*)$/);
 if(!p)return null;let a=Number(p[1]),b=Number(p[2]),answer=Number(p[4]),trace;
 if(!integer(answer)||answer<0||answer>t.limit)return null;
 if(m==="dense"){trace=p[3].split(",").map(Number);if(trace.length!==t.future.length||!trace.every(v=>integer(v)&&v>=0&&v<=t.limit))return null;}else{if(Number(p[3])!==t.future.length)return null;trace=replay(t,t.obs.at(-1),t.future,a,b);}
 return {a,b,trace,answer};}
 function grade(t,m,s){let p=parse(t,m,s),cs=alternative(t);if(cs.length!==1)throw Error("ambiguous task");let [a,b]=cs[0],d=independentTrace(t,a,b),final=typeof s==="string"&&s.length<=20000?s.match(/(?:^|\n)FINAL: (0|[1-9]\d*)$/):null,correct=!!final&&Number(final[1])===d.at(-1);
 return {format:!!p,answer:correct,certificate:m==="final-only"?null:!!p&&p.a===a&&p.b===b&&p.answer===d.at(-1)&&p.trace.every((v,i)=>v===d[i])};}
 function selfTest(){let n=0,positive=0,negative=0,finalOnly=0;let check=(v,msg)=>{if(!v)throw Error(msg);};
 for(let t of cases()){let r=solve(t),c=alternative(t);check(c.length===1&&c[0][0]===r.a&&c[0][1]===r.b&&JSON.stringify(independentTrace(t,r.a,r.b))===JSON.stringify(r.trace),"oracle "+t.id);n++;
 for(let m of modes){let s=render(t,m,r),g=grade(t,m,s);check(g.format&&g.answer&&(m==="final-only"?g.certificate===null:g.certificate),"positive");if(m==="final-only"){finalOnly++;continue;}positive++;
 let bad=[s+"\nextra",render(t,m,{...r,a:r.a===9?1:r.a+1}),render(t,m,{...r,answer:r.answer+1}),m==="dense"?render(t,m,{...r,trace:r.trace.map((v,i)=>i===0?v+1:v)}):render(t,m,{...r,trace:r.trace.slice(1)})];
 for(let x of bad){check(!grade(t,m,x).certificate,"negative");negative++;}
 let wrong=render(t,m,{...r,a:r.a===9?1:r.a+1});let wg=grade(t,m,wrong);check(wg.answer&&!wg.certificate,"answer/cert separation");}}
 let t=cases()[0];for(let s of ["R:1,0,99999999\nFINAL: 1","R:1,0,0\nFINAL: 1","R:0,0,80\nFINAL: 1","R:1,-0,80\nFINAL: 1","R:1,10,80\nFINAL: 1"]){check(!parse(t,"atl-rec",s),"bounds");negative++;}
 return {tasks:n,valid_certificates:positive,invalid_certificates_rejected:negative,final_only_checks:finalOnly};}
 function report(count=s=>s.length,unit="ASCII characters"){let rows=[];for(let t of cases().filter(t=>t.split==="pilot")){let r=solve(t);for(let mode of modes){let system=count(instruction(t,mode)),input=count(prompt(t)),output=count(render(t,mode,r));rows.push({family:t.family,mode,system,input,output,total:system+input+output});}}
 let summary=[];for(let family of ["all",...profiles])for(let mode of modes){let g=rows.filter(r=>r.mode===mode&&(family==="all"||r.family===family));summary.push({family,mode,n:g.length,...Object.fromEntries(["system","input","output","total"].map(k=>[k,g.reduce((s,r)=>s+r[k],0)]))});}return {unit,scope:"Static oracle-authored text; recursive witness delegates expansion to interpreter; final-only has no certificate; no inference or hidden reasoning",summary};}
 return {cases,valid,candidates,alternative,solve,render,parse,grade,instruction,prompt,selfTest,report,modes};
}
export const {cases,valid,candidates,alternative,solve,render,parse,grade,instruction,prompt,selfTest,report,modes}=recursive();
