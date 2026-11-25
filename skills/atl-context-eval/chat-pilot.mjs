// ATL Context Skill: controlled chat pilot. Node 18+; no model API calls.
import {readFileSync,writeFileSync} from "node:fs";
import {tokenizer,verify} from "../atl-context/scripts/tokenizer.mjs";
import {group,expand,normalize,flatInstruction,groupInstruction,route} from "../atl-context/scripts/batch-core.mjs";
const contexts=[
  {
    "context": "Inventory model. Each question is independent and resets to initial stock 120 units. Events in order: receive 35, request dispatch 48, receive 15, request dispatch 70, request dispatch 40. Reserve is 20 units. For each dispatch, ship min(request, max(0, stock-reserve)); reject the remainder permanently. No other changes. In counterfactuals modify only the stated event or reserve, then replay from the beginning. Return an integer.",
    "tasks": [
      [
        "I01",
        "Final stock?",
        20
      ],
      [
        "I02",
        "Total shipped?",
        150
      ],
      [
        "I03",
        "Total rejected?",
        8
      ],
      [
        "I04",
        "Units shipped in the third dispatch?",
        32
      ],
      [
        "I05",
        "Final stock if the reserve is 40?",
        40
      ],
      [
        "I06",
        "Total rejected if the reserve is 40?",
        28
      ],
      [
        "I07",
        "Final stock if the first receipt is 0?",
        20
      ],
      [
        "I08",
        "Total rejected if the first receipt is 0?",
        43
      ]
    ]
  },
  {
    "context": "Project scheduling model. All tasks are mandatory, start at earliest possible times, with unlimited resources and no overhead. A duration 3 and B duration 5 start at time 0. C duration 4 depends on A; D duration 2 depends on A and B; E duration 6 depends on C and D; F duration 3 depends on B; G duration 2 depends on E and F. A task starts when all dependencies finish. Each question resets to this graph. If changing a duration, change only that one. Return an integer.",
    "tasks": [
      [
        "G01",
        "Project finish time?",
        15
      ],
      [
        "G02",
        "Earliest start of E?",
        7
      ],
      [
        "G03",
        "Project finish time if B duration becomes 9?",
        19
      ],
      [
        "G04",
        "Project finish time if A duration becomes 6?",
        18
      ],
      [
        "G05",
        "Project finish time if E duration becomes 0?",
        10
      ],
      [
        "G06",
        "Project finish time if F duration becomes 10?",
        17
      ],
      [
        "G07",
        "How many distinct longest dependency paths from a starting task through G in the original graph?",
        2
      ],
      [
        "G08",
        "Earliest finish of D if B duration becomes 2?",
        5
      ]
    ]
  },
  {
    "context": "Independent operating decisions. Inputs are temperature T, pressure P, sensor validity V (1 valid, 0 invalid), override O (1 enabled, 0 disabled). Apply these rules in strict priority: if V=0 return HOLD; else if T>90 or P>=50 return STOP; else if O=1 and T<=85 and P<45 return RUN; else if T>=80 or P>=45 return LIMIT; otherwise return RUN. Override cannot bypass HOLD or STOP. Boundaries are exact. Return only the uppercase state as a JSON string.",
    "tasks": [
      [
        "S01",
        "T=90, P=49, V=1, O=1",
        "LIMIT"
      ],
      [
        "S02",
        "T=91, P=10, V=0, O=1",
        "HOLD"
      ],
      [
        "S03",
        "T=85, P=44, V=1, O=1",
        "RUN"
      ],
      [
        "S04",
        "T=85, P=45, V=1, O=1",
        "LIMIT"
      ],
      [
        "S05",
        "T=20, P=50, V=1, O=1",
        "STOP"
      ],
      [
        "S06",
        "T=79, P=44, V=1, O=0",
        "RUN"
      ],
      [
        "S07",
        "T=80, P=44, V=1, O=0",
        "LIMIT"
      ],
      [
        "S08",
        "T=86, P=44, V=1, O=1",
        "LIMIT"
      ]
    ]
  }
];
function stock(reserve=20,receipt=35){let s=120, shipped=0,rejected=0,third=0;for(const [type,n] of [["r",receipt],["d",48],["r",15],["d",70],["d",40]]){if(type==="r")s+=n;else{third=Math.min(n,Math.max(0,s-reserve));s-=third;shipped+=third;rejected+=n-third;}}return {s,shipped,rejected,third};}
function schedule(changes={}){const d={A:3,B:5,C:4,D:2,E:6,F:3,G:2,...changes},deps={A:[],B:[],C:["A"],D:["A","B"],E:["C","D"],F:["B"],G:["E","F"]},finish={},start={},ways={};for(const k of Object.keys(d)){start[k]=Math.max(0,...deps[k].map(x=>finish[x]));finish[k]=start[k]+d[k];ways[k]=deps[k].length?deps[k].filter(x=>finish[x]===start[k]).reduce((s,x)=>s+ways[x],0):1;}return {finish,start,ways};}
function state(t,p,v,o){return !v?"HOLD":t>90||p>=50?"STOP":o&&t<=85&&p<45?"RUN":t>=80||p>=45?"LIMIT":"RUN";}
function selfTest(){const a=stock(),b=stock(40),c=stock(20,0),g=schedule();const computed=[a.s,a.shipped,a.rejected,a.third,b.s,b.rejected,c.s,c.rejected,g.finish.G,g.start.E,schedule({B:9}).finish.G,schedule({A:6}).finish.G,schedule({E:0}).finish.G,schedule({F:10}).finish.G,g.ways.G,schedule({B:2}).finish.D,...[[90,49,1,1],[91,10,0,1],[85,44,1,1],[85,45,1,1],[20,50,1,1],[79,44,1,0],[80,44,1,0],[86,44,1,1]].map(x=>state(...x))];const expected=contexts.flatMap(b=>b.tasks.map(t=>t[2]));if(JSON.stringify(computed)!==JSON.stringify(expected))throw Error("Gold mismatch: "+JSON.stringify({computed,expected}));return expected.length;}
function score(rows){if(!Array.isArray(rows))throw Error("Expected array");const gold=contexts.flatMap(b=>b.tasks.map(([id,task,answer])=>({id,answer}))),map=new Map();let invalid=0;for(const r of rows){if(!r||typeof r!=="object"||Object.keys(r).sort().join(",")!=="answer,id"||typeof r.id!=="string"||map.has(r.id)||!gold.some(g=>g.id===r.id)){invalid++;continue;}map.set(r.id,r.answer);}const ordered=rows.length===gold.length&&rows.every((r,i)=>r?.id===gold[i].id);const errors=gold.filter(g=>!map.has(g.id)||map.get(g.id)!==g.answer).map(g=>({id:g.id,expected:g.answer,actual:map.get(g.id)??null}));return {correct:gold.length-errors.length,total:gold.length,accuracy:(gold.length-errors.length)/gold.length,invalid,ordered,protocol_ok:invalid===0&&ordered,errors};}
const rows=contexts.flatMap(b=>b.tasks.map(([id,task])=>({id,context:b.context,task})));
const common="Solve all 24 independent questions. Do not use external tools or code. Output only the ordered JSON array of objects with exactly the keys id and answer. Use JSON numbers for integer answers and JSON strings for states. Do not output reasoning or markdown.\n";
const skill=readFileSync(new URL("../atl-context/SKILL.md",import.meta.url),"utf8");
function prompts(){const blocks=group(rows);if(JSON.stringify(expand(blocks))!==JSON.stringify(normalize(rows)))throw Error("Roundtrip");return {flat:common+flatInstruction+"\n"+JSON.stringify(rows),natural:common+"Each context below applies to its listed questions.\n"+contexts.map(b=>b.context+"\n"+b.tasks.map(([id,t])=>id+": "+t).join("\n")).join("\n\n"),atl:common+"The following ATL skill is already loaded and the batch is already compiled for this forced-grouped trial; do not run tools.\n"+skill+"\n"+groupInstruction+"\n"+JSON.stringify(blocks)};}
const args=process.argv.slice(2);const arg=k=>{const i=args.indexOf(k);return i<0?null:args[i+1];};
if(args.includes("--self-test")){const n=selfTest(),g=score(contexts.flatMap(b=>b.tasks.map(([id,t,answer])=>({id,answer})))),b=score([]);if(g.correct!==n||!g.protocol_ok||b.correct!==0||b.protocol_ok)throw Error("Scoring");prompts();console.log(JSON.stringify({gold_checks:n,score_checks:2,roundtrip:true}));}
else if(arg("--score")){console.log(JSON.stringify(score(JSON.parse(readFileSync(arg("--score"),"utf8"))),null,2));}
else if(arg("--arm")){const p=prompts()[arg("--arm")];if(!p)throw Error("Unknown arm");process.stdout.write(p);}
else if(arg("--ranks")){const encode=tokenizer(readFileSync(arg("--ranks"),"utf8"));verify(encode);const p=prompts(),counts=Object.fromEntries(Object.entries(p).map(([k,v])=>[k,encode(v).length]));console.log(JSON.stringify({encoding:"o200k_base",static_prompt_tokens:counts,product_route:route(rows,s=>encode(s).length,skill),warning:"Not provider usage; ATL arm forced grouped, excludes hidden reasoning and host framing."},null,2));}
else throw Error("Use --self-test, --arm flat|natural|atl, --score file.json or --ranks file.tiktoken");
