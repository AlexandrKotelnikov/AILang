// ATL-Nano v0.3.2: zero-dictionary development pilot.
const modes=[
  "draft",
  "nano",
  "nano-ascii",
  "nano-state"
];
const common="Solve accurately; give a checkable derivation, then a final line FINAL: <answer>.";
const styles={
  "draft": "Use terse English notes or equations.",
  "nano": "Use compact notation.",
  "nano-ascii": "Use compact ASCII notation.",
  "nano-state": "Use compact notation; combine repeated transitions."
};
const tasks=[
  {
    "id": "branch",
    "family": "logic",
    "prompt": "A implies B and C. B and C together imply D. D implies E. E is false. Determine whether A is true, false or unknown.",
    "answer": "false"
  },
  {
    "id": "loop",
    "family": "algorithm",
    "prompt": "Starting with x=4, for i=1,2,3,4,5,6 in order: if x is even set x=x/2+i; otherwise set x=2*x-i. Give final x as an integer.",
    "answer": "10"
  },
  {
    "id": "cascade",
    "family": "engineering",
    "prompt": "Two series separators treat 1000 kg/h feed with 30 mass% solute. Stage 1 recovers 60% of solute; stage 2 recovers 75% of remaining solute. Combined recovered solute loses 8% during drying. Find net solute kg/h (number only).",
    "answer": "248.4"
  },
  {
    "id": "path",
    "family": "graph",
    "prompt": "Directed edges and costs: S->A 4, S->B 2, A->C 3, B->A 1, B->C 6, A->T 9, C->T 2, B->T 12. Find shortest S to T distance (number only).",
    "answer": "8"
  },
  {
    "id": "inventory",
    "family": "planning",
    "prompt": "Start with stock 25, capacity 40. For each day, first receive 12 (discard overflow), then fulfill demand up to available stock. Demands over 5 days: 18,5,30,8,20. Find total unfulfilled demand (number only).",
    "answer": "0"
  },
  {
    "id": "subset",
    "family": "optimization",
    "prompt": "Choose a subset of A,B,C,D,E maximizing benefit. Tuples (cost,benefit): A(2,4),B(3,7),C(5,11),D(4,8),E(6,14). Budget 10. A and B cannot both be chosen. No repeats. Output chosen letters in alphabetical order; if tied, lexicographically smallest string.",
    "answer": "DE"
  },
  {
    "id": "conditional",
    "family": "probability",
    "prompt": "Box A has 3 red and 1 blue; box B has 1 red and 3 blue. Choose one box with equal probability, draw two without replacement. Given that the first draw is red, find probability second draw is red. Output reduced fraction.",
    "answer": "1/2"
  },
  {
    "id": "balance",
    "family": "math",
    "prompt": "A loan balance starts at 1000. At the end of each month apply 10% interest then pay 200. After 3 months what is the remaining balance? Give a number only; no rounding during calculation.",
    "answer": "669"
  }
];
const responses={
  "branch": [
    "Assume A true: B,C true, then D true, then E true. Contradicts E false; A false.\nFINAL: false",
    "A⇒(B∧C); (B∧C)⇒D; D⇒E; ¬E⇒¬A.\nFINAL: false",
    "A=>(B&C); (B&C)=>D; D=>E; !E=>!A.\nFINAL: false",
    "A=>(B&C); (B&C)=>D; D=>E; !E=>!A.\nFINAL: false"
  ],
  "loop": [
    "Even/odd rule at i=1..6: 4->3->4->5->6->8->10.\nFINAL: 10",
    "x₀…₆=(4,3,4,5,6,8,10).\nFINAL: 10",
    "x[0..6]=[4,3,4,5,6,8,10].\nFINAL: 10",
    "x:4->3->4->5->6->8->10 (i=1..6).\nFINAL: 10"
  ],
  "cascade": [
    "Solute=300 kg/h; recover 180 then 90 kg/h. Drying retains 0.92*(180+90)=248.4 kg/h.\nFINAL: 248.4",
    "1000·0.3[0.6+0.4·0.75]·0.92=248.4 kg/h.\nFINAL: 248.4",
    "1000*.3*(.6+.4*.75)*.92=248.4 kg/h.\nFINAL: 248.4",
    "300*(1-.4*.25)*.92=248.4 kg/h.\nFINAL: 248.4"
  ],
  "path": [
    "Dijkstra: B=2, A=min(4,2+1)=3, C=min(2+6,3+3)=6, T=min(2+12,3+9,6+2)=8.\nFINAL: 8",
    "d(B,A,C,T)=(2,min(4,3),min(8,6),min(14,12,8))=(2,3,6,8).\nFINAL: 8",
    "dB=2; dA=min(4,3)=3; dC=min(8,6)=6; dT=min(14,12,8)=8.\nFINAL: 8",
    "dB=2; dA=min(4,3)=3; dC=min(8,6)=6; dT=min(14,12,8)=8.\nFINAL: 8"
  ],
  "inventory": [
    "Available before demand: 37,31,38,20,24. Closing stocks: 19,26,8,12,4; every demand is met.\nFINAL: 0",
    "a=(37,31,38,20,24)≥d=(18,5,30,8,20) componentwise; unmet=0.\nFINAL: 0",
    "a=[37,31,38,20,24]; a[i]>=d[i] all; unmet=0.\nFINAL: 0",
    "s'=max(0,min(40,s+12)-d); s=(25,19,26,8,12,4); available>=d all.\nFINAL: 0"
  ],
  "subset": [
    "Allowed triples before budget check: ACD costs 11, ACE 13, ADE 12, BCD 12, BCE 14, BDE 13, CDE 15; none fit (triples with AB forbidden). Feasible pairs AC=15, AD=12, AE=18, BC=18, BD=15, BE=21, CD=19, DE=22; CE over budget. Best single=14; DE wins.\nFINAL: DE",
    "min permitted triple cost=11>10. Feasible pair gains AC15 AD12 AE18 BC18 BD15 BE21 CD19 DE22; singles≤14. max DE22.\nFINAL: DE",
    "min cost(allowed triples)=11>10; pairs AC15 AD12 AE18 BC18 BD15 BE21 CD19 DE22; max=DE22; singles<=14.\nFINAL: DE",
    "triples: min cost=11>10; pair gains {AC15,AD12,AE18,BC18,BD15,BE21,CD19,DE22}; singles<=14; argmax DE.\nFINAL: DE"
  ],
  "conditional": [
    "P(A|R)=3/4 and P(B|R)=1/4. Second red probabilities are 2/3 and 0. Weighted result (3/4)*(2/3)=1/2.\nFINAL: 1/2",
    "P(R₂|R₁)=(3/4)(2/3)+(1/4)0=1/2.\nFINAL: 1/2",
    "P(R2|R1)=(3/4)*(2/3)+(1/4)*0=1/2.\nFINAL: 1/2",
    "P(A|R1)=3/4; P(R2|R1)=3/4*2/3=1/2.\nFINAL: 1/2"
  ],
  "balance": [
    "Apply interest then payment: 1000->900->790->669.\nFINAL: 669",
    "bₙ=1.1bₙ₋₁−200; (1000,900,790,669).\nFINAL: 669",
    "b[n]=1.1*b[n-1]-200; [1000,900,790,669].\nFINAL: 669",
    "b'=1.1b-200; 1000->900->790->669.\nFINAL: 669"
  ]
};
function reference(){
 const models=[];for(let n=0;n<32;n++){const [a,b,c,d,e]=[0,1,2,3,4].map(i=>!!(n>>i&1));if((!a||(b&&c))&&(!(b&&c)||d)&&(!d||e)&&!e)models.push(a);}
 let x=4;for(let i=1;i<=6;i++)x=x%2===0?x/2+i:2*x-i;
 const sol=1000*.3;const recovered=(sol*.6+sol*(1-.6)*.75)*.92;
 const edges=[["S","A",4],["S","B",2],["A","C",3],["B","A",1],["B","C",6],["A","T",9],["C","T",2],["B","T",12]];
 const dist={S:0,A:Infinity,B:Infinity,C:Infinity,T:Infinity};for(let i=0;i<4;i++)for(const [a,b,w] of edges)dist[b]=Math.min(dist[b],dist[a]+w);
 let stock=25,unmet=0;for(const d of [18,5,30,8,20]){stock=Math.min(40,stock+12);unmet+=Math.max(0,d-stock);stock=Math.max(0,stock-d);}
 const opts=[[2,4],[3,7],[5,11],[4,8],[6,14]];let best={id:"",gain:-1};for(let m=0;m<32;m++){if((m&3)===3)continue;let cost=0,gain=0,id="";opts.forEach(([c,g],i)=>{if(m>>i&1){cost+=c;gain+=g;id+="ABCDE"[i]}});if(cost<=10&&(gain>best.gain||(gain===best.gain&&id<best.id)))best={id,gain};}
 let redFirst=0,bothRed=0;for(const r of [3,1])for(let i=0;i<4;i++)for(let j=0;j<4;j++){if(i===j)continue;if(i<r){redFirst++;if(j<r)bothRed++;}}
 function gcd(a,b){return b?gcd(b,a%b):a}const g=gcd(bothRed,redFirst);
 let balance=1000;for(let i=0;i<3;i++)balance=balance*11/10-200;
 return {branch:models.length&&models.every(a=>!a)?"false":"unknown",loop:String(x),cascade:String(Math.round(recovered*1e9)/1e9),path:String(dist.T),inventory:String(unmet),subset:best.id,conditional:`${bothRed/g}/${redFirst/g}`,balance:String(balance)};
}

function messages(t,m){if(!modes.includes(m))throw Error("mode");return [{role:"system",content:common+" "+styles[m]},{role:"user",content:t.prompt}];}

function extract(s){if(typeof s!=="string")return null;const lines=s.trim().split(/\r?\n/);if(lines.filter(x=>/^\s*FINAL\s*:/i.test(x)).length!==1)return null;return lines.at(-1).match(/^FINAL:\s*(\S.*?)\s*$/)?.[1]??null;}

function correct(t,s){const a=extract(s);if(a===null)return false;if(/^\d+(?:\.\d+)?$/.test(t.answer))return /^[+-]?\d+(?:\.\d+)?$/.test(a)&&Math.abs(Number(a)-Number(t.answer))<1e-9;return a===t.answer;}

function report(){
 const chars=s=>[...s].length;
 const rows=tasks.flatMap(t=>modes.map((mode,i)=>{
  const [sys,user]=messages(t,mode),output=responses[t.id][i];
  return {id:t.id,mode,system:sys.content,user:user.content,output,expected:t.answer,correct:correct(t,output),ascii_output:/^[\x00-\x7F]*$/.test(output),instruction_chars:chars(sys.content),prompt_chars:chars(user.content),output_chars:chars(output)};
 }));
 const summary=modes.map(mode=>{const a=rows.filter(r=>r.mode===mode),sum=k=>a.reduce((n,r)=>n+r[k],0);return {mode,correct:a.filter(r=>r.correct).length,n:a.length,ascii_outputs:a.filter(r=>r.ascii_output).length,instruction_chars:sum("instruction_chars"),prompt_chars:sum("prompt_chars"),output_chars:sum("output_chars"),total_chars:sum("instruction_chars")+sum("prompt_chars")+sum("output_chars")};});
 return {scope:"Authored visible solution summaries within one chat; no independent inference, token counts or hidden reasoning measurements.",reference:reference(),summary,rows};
}
const verifiedAnswers=reference;
export {modes,tasks,messages,extract,correct,verifiedAnswers,report};
