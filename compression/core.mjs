// ATL v0.3.1 compression experiment. Node 18+.
const modes=["baseline","draft","native","micro","adaptive"];
const common="Solve accurately. Give a checkable derivation; end with exactly one line FINAL: <answer>. Follow the requested answer format.";
const styles={"baseline":"Use concise English sentences.","draft":"Use terse English notes or equations.","native":"Use familiar mathematical or logical notation; omit prose where clear.","micro":"Use optional G: given, I: inference, C: check, U: unknown. Omit redundant fields; preserve premises and units.","adaptive":"Use familiar notation; use the optional local rule only when its premises hold."};
const rules={"chain":"MT(X,Y): X=>Y and !Y entail !X.","disjunction":"DS(X,Y): X|Y and !X entail Y.","schedule":"EF(X)=duration(X)+max(EF(predecessors)); max(empty)=0."};
const tasks=[{"id":"chain","family":"logic","prompt":"A implies B, B implies C, C implies D. D is false. Determine A (true, false or unknown). Justify using the premises.","answer":"false"},{"id":"disjunction","family":"logic","prompt":"At least one of P and Q holds; P is false; Q implies R; R implies S. Is S true, false or unknown? Justify.","answer":"true"},{"id":"mass","family":"engineering","prompt":"Feed is 1200 kg/h, 80% active component by mass. 75% of the active component reacts; each kg reacted yields 1 kg product before separation, which recovers 95%. Calculate recovered product in kg/h. Give a number only as final answer.","answer":"684"},{"id":"tank","family":"engineering","prompt":"A perfectly mixed tank initially holds 500 L at 2 g/L solute. Add 100 L at 8 g/L, mix, withdraw 150 L, then add 50 L pure water. Find final concentration in g/L; final answer numeric.","answer":"2.7"},{"id":"schedule","family":"planning","prompt":"Unlimited parallel workers. A takes 3 h; B takes 4 h after A; C takes 5 h after A; D takes 2 h after both B and C; E takes 4 h after D. Earliest completion in hours? Final answer numeric.","answer":"14"},{"id":"pairs","family":"algorithm","prompt":"In the array [2,4,1,5,3,6], count distinct index pairs i<j for which a[i]+a[j]>=7. Final answer numeric.","answer":"9"},{"id":"probability","family":"math","prompt":"An urn contains 5 red and 4 blue balls. Draw 2 without replacement. Find the probability of exactly one red. Final answer as reduced fraction.","answer":"5/9"},{"id":"selection","family":"optimization","prompt":"Choose any subset of A,B,C,D to maximize gain. Each tuple is (cost,hours,gain): A=(4,3,8), B=(6,4,11), C=(5,2,10), D=(3,4,7). Total cost<=10 and hours<=7. No repeats. Final answer: selected letters in alphabetical order without separators.","answer":"AB"}];
function instructions(t,m){
 if(!modes.includes(m))throw Error("bad mode");
 return common+" "+styles[m]+(m==="adaptive"&&rules[t.id]?" "+rules[t.id]:"");
}

function messages(t,m){return [{role:"system",content:instructions(t,m)},{role:"user",content:t.prompt}]}

function extract(s){
 if(typeof s!=="string")return null;
 const ls=s.trim().split(/\r?\n/);
 if(ls.filter(x=>/^\s*FINAL\s*:/i.test(x)).length!==1)return null;
 return ls.at(-1).match(/^FINAL:\s*(\S.*?)\s*$/)?.[1]??null;
}

function correct(t,s){
 const a=extract(s);if(a===null)return false;
 if(/^\d+(?:\.\d+)?$/.test(t.answer))return /^[+-]?\d+(?:\.\d+)?$/.test(a)&&Math.abs(Number(a)-Number(t.answer))<1e-9;
 return a===t.answer;
}

function verifiedAnswers(){
 const pairs=[2,4,1,5,3,6].flatMap((x,i,a)=>a.slice(i+1).filter(y=>x+y>=7)).length;
 const jobs=[["A",3,[]],["B",4,["A"]],["C",5,["A"]],["D",2,["B","C"]],["E",4,["D"]]];
 const ends={};for(const [k,d,p] of jobs)ends[k]=d+Math.max(0,...p.map(x=>ends[x]));
 const options=[[4,3,8],[6,4,11],[5,2,10],[3,4,7]];let best={gain:-1,id:""};
 for(let mask=0;mask<16;mask++){let c=0,h=0,g=0,id="";options.forEach(([a,b,d],i)=>{if(mask>>i&1){c+=a;h+=b;g+=d;id+="ABCD"[i]}});if(c<=10&&h<=7&&g>best.gain)best={gain:g,id};}
 const logic=[];for(let mask=0;mask<16;mask++){const [a,b,c,d]=[0,1,2,3].map(i=>!!(mask>>i&1));if((!a||b)&&(!b||c)&&(!c||d)&&!d)logic.push(a);}
 const disj=[];for(let mask=0;mask<16;mask++){const [p,q,r,s]=[0,1,2,3].map(i=>!!(mask>>i&1));if((p||q)&&!p&&(!q||r)&&(!r||s))disj.push(s);}
 const draws=Array.from({length:9},(_,i)=>i<5).flatMap((x,i,a)=>a.filter((y,j)=>j!==i&&x!==y)).length;
 function gcd(a,b){return b?gcd(b,a%b):a};const div=gcd(draws,72);
 return {chain:String(logic.every(x=>!x)?false:"unknown"),disjunction:String(disj.every(Boolean)?true:"unknown"),mass:String(1200*0.8*0.75*0.95),tank:String((500*2+100*8)*(1-150/600)/500),schedule:String(ends.E),pairs:String(pairs),probability:`${draws/div}/${72/div}`,selection:best.id};
}

function pilotReport(tasks,samples){
 const count=s=>[...s].length;
 const rec=tasks.flatMap(t=>modes.map((mode,i)=>{
  const out=samples[t.id][i];const instr=instructions(t,mode);return {id:t.id,mode,correct:correct(t,out),prompt_chars:count(t.prompt),instruction_chars:count(instr),output_chars:count(out)};
 }));
 const summary=modes.map(mode=>{const g=rec.filter(r=>r.mode===mode);const s=k=>g.reduce((a,r)=>a+r[k],0);return {mode,correct:g.filter(r=>r.correct).length,n:g.length,prompt_chars:s("prompt_chars"),instruction_chars:s("instruction_chars"),output_chars:s("output_chars"),total_chars:s("prompt_chars")+s("instruction_chars")+s("output_chars")};});
 return {scope:"Single-chat authored visible derivations, not independent calls; Unicode code points only; no hidden reasoning, usage, latency, or token claims.",answers_verified:verifiedAnswers(),summary,records:rec};
}
export {modes,tasks,instructions,messages,extract,correct,verifiedAnswers,pilotReport};
