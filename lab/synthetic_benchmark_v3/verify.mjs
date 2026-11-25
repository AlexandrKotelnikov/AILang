import fs from "node:fs";
import {build,forward,backward,record,prompt,decode} from "./generator.mjs";
const read=p=>fs.readFileSync(new URL(p,import.meta.url),"utf8");
const tasks=build();
const eq=(a,b)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw Error("mismatch");};
eq(tasks,JSON.parse(read("tasks.json")));
for(const t of tasks){eq(forward(t),backward(t));for(const arm of ["D7","E7"])eq(decode(record(t,arm),arm),t);}
eq(tasks.map(t=>({id:t.id,answer:forward(t),n:t.n,m:t.m})),JSON.parse(read("reference.json")));
for(const a of ["B7","C7","D7","E7"])eq(prompt(tasks,a),read("prompts/"+a+".txt"));
console.log("Verified",tasks.length,"tasks, 2 oracles, 4 prompts");
