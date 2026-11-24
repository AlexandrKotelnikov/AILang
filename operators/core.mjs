// ATL v0.4.4 — lossless repeat operators for prefix certificates.
function engine(){
 const profiles=["sparse","mixed","dense"];
 const modes=["dense","compact-rle","atl-rle"];
 function rng(seed){let x=seed>>>0;return n=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return Math.floor(x/4294967296*n);};}
 function cases(){const all=[];for(const profile of profiles)for(let k=0;k<80;k++){
  const r=rng(918217+k*7919+profiles.indexOf(profile)*121013),n=60+r(121),jobs=[];
  for(let i=0;i<n;i++){let s=profile==="dense"?i*3:profile==="mixed"?r(n):r(20);let e=s+1+r(profile==="dense"?3:profile==="mixed"?16:30);jobs.push([s,e,1+r(90)]);}
  jobs.sort((a,b)=>a[1]-b[1]||a[0]-b[0]||a[2]-b[2]);
  all.push({id:profile+"-"+k,profile,split:k<20?"dev":"pilot",jobs});}return all;}
 function valid(jobs){return Array.isArray(jobs)&&jobs.length<=200&&jobs.every((j,i)=>Array.isArray(j)&&j.length===3&&j.every(Number.isSafeInteger)&&j[0]>=0&&j[1]>j[0]&&j[1]<=1000&&j[2]>=0&&j[2]<=1000&&(!i||jobs[i-1][1]<=j[1]));}
 function solve(jobs){if(!valid(jobs))throw Error("invalid task");const d=[0];for(let i=0;i<jobs.length;i++){let p=i;while(p>0&&jobs[p-1][1]>jobs[i][0])p--;d.push(Math.max(d[i],d[p]+jobs[i][2]));}return d.slice(1);}
 function oracle(jobs){if(!valid(jobs))throw Error("invalid task");const end=jobs.at(-1)?.[1]??0,d=Array(end+1).fill(0);for(let t=1;t<=end;t++){d[t]=d[t-1];for(const [s,e,w] of jobs)if(e===t)d[t]=Math.max(d[t],d[s]+w);}return d[end];}
 function verify(jobs,d,answer){if(!valid(jobs)||!Array.isArray(d)||d.length!==jobs.length||!Number.isSafeInteger(answer)||!d.every(x=>Number.isSafeInteger(x)&&x>=0&&x<=200000))return false;
  for(let i=0;i<jobs.length;i++){let best=0;for(let j=0;j<i;j++)if(jobs[j][1]<=jobs[i][0])best=Math.max(best,d[j]);if(d[i]!==Math.max(i?d[i-1]:0,best+jobs[i][2]))return false;}return (d.at(-1)??0)===answer;}
 function runs(d){const a=[];for(const v of d){if(a.length&&a.at(-1)[0]===v)a.at(-1)[1]++;else a.push([v,1]);}return a;}
 const prefix={"dense":"DP: ","compact-rle":"DP: ","atl-rle":"D:"};
 function render(d,mode){if(!modes.includes(mode))throw Error("mode");let items;
  if(mode==="dense")items=d.map(String);else items=runs(d).map(([v,n])=>{const raw=Array(n).fill(v).join(","),encoded=mode==="atl-rle"?`${v}*${n}`:`${v}x${n}`;return n>1&&encoded.length<raw.length?encoded:raw;});
  return prefix[mode]+(items.join(",")||"-")+"\nFINAL: "+(d.at(-1)??0);}
 function parse(text,mode,n){if(!modes.includes(mode)||typeof text!=="string"||text.length>20000||!Number.isSafeInteger(n)||n<0||n>200)return null;
  const m=text.match(/^([^\r\n]+)\r?\nFINAL: (0|[1-9][0-9]*)$/);if(!m||!m[1].startsWith(prefix[mode]))return null;
  const answer=Number(m[2]),body=m[1].slice(prefix[mode].length),d=[];if(!Number.isSafeInteger(answer)||answer>200000)return null;
  if(body!=="-")for(const item of body.split(",")){const re=mode==="dense"?/^(0|[1-9][0-9]*)$/:mode==="atl-rle"?/^(0|[1-9][0-9]*)(?:\*([1-9][0-9]*))?$/:/^(0|[1-9][0-9]*)(?:x([1-9][0-9]*))?$/;const p=item.match(re);if(!p)return null;const v=Number(p[1]),k=p[2]?Number(p[2]):1;if(!Number.isSafeInteger(v)||v>200000||!Number.isSafeInteger(k)||k>n-d.length||p[2]&&k<2)return null;for(let i=0;i<k;i++)d.push(v);}
  return d.length===n?{d,answer}:null;}
 function instruction(mode){const common="Solve weighted interval scheduling. Output optimal totals for every job prefix in order (d0=0), then a newline and FINAL: <integer>. ";return common+(mode==="dense"?"Use DP: followed by comma-separated integers.":mode==="compact-rle"?"Use DP: followed by comma-separated integers or value x count (without spaces) for repeated equal totals; count is total occurrences.":"Use D: followed by comma-separated integers or value*count for repeated equal totals; count is total occurrences.")+" Use - for an empty vector. No extra text.";}
 function prompt(jobs){return "Jobs [start,end,value] sorted by finish: "+JSON.stringify(jobs)+". Maximize value with nonoverlapping jobs (end<=next start).";}
 function selfTest(){let accepted=0,rejected=0,agreements=0;function check(x,msg){if(!x)throw Error(msg);}
  for(const t of cases()){const d=solve(t.jobs),a=oracle(t.jobs);check(verify(t.jobs,d,a),"oracle "+t.id);agreements++;
   for(const mode of modes){const s=render(d,mode),p=parse(s,mode,d.length);check(p&&JSON.stringify(p.d)===JSON.stringify(d)&&verify(t.jobs,p.d,p.answer),"roundtrip");accepted++;
    for(const bad of [s+"\nextra",s.replace(/FINAL: \d+$/,"FINAL: "+(a+1)),s.replace(/^(DP: |D:)\d+/, "$1200001")]){const q=parse(bad,mode,d.length);check(!q||!verify(t.jobs,q.d,q.answer),"tamper");rejected++;}}
   const wrong=d.slice();wrong[0]++;check(!verify(t.jobs,wrong,a),"intermediate tamper");rejected++;
  }
  for(const s of ["D:3*0\nFINAL: 3","D:3*999999999\nFINAL: 3","D:3*1\nFINAL: 3","D:03\nFINAL: 3","D:3,\nFINAL: 3","D:3*-2\nFINAL: 3","D:3*2\nFINAL: 3"]){check(!parse(s,"atl-rle",1),"invalid syntax");rejected++;}
  for(const mode of modes){const p=parse(render([],mode),mode,0);check(p&&verify([],p.d,p.answer),"empty");}
  return {cases:agreements,accepted,rejected,empty_modes:3};}
 function report(count=s=>s.length,unit="ASCII characters"){const rows=[];for(const t of cases().filter(t=>t.split==="pilot"))for(const mode of modes){const d=solve(t.jobs),system=count(instruction(mode)),input=count(prompt(t.jobs)),output=count(render(d,mode));rows.push({profile:t.profile,mode,system,input,output,total:system+input+output});}
  const summary=[];for(const profile of ["all",...profiles])for(const mode of modes){const g=rows.filter(r=>r.mode===mode&&(profile==="all"||r.profile===profile));summary.push({profile,mode,n:g.length,...Object.fromEntries(["system","input","output","total"].map(k=>[k,g.reduce((a,r)=>a+r[k],0)]))});}return {unit,scope:"Static oracle-generated reference strings; no framing or inference",summary};}
 return {cases,solve,oracle,verify,render,parse,instruction,prompt,selfTest,report,modes};
}
export const {cases,solve,oracle,verify,render,parse,instruction,prompt,selfTest,report,modes}=engine();
