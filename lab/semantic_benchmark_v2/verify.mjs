import fs from "node:fs";import {compile,reconstruct,project,solve1,solve2,sample,prompt} from "./compiler.mjs";
const read=n=>fs.readFileSync(new URL(n,import.meta.url),"utf8");const rows=JSON.parse(read("pilot_questions.json")),ref=JSON.parse(read("reference.json"));
for(let i=0;i<rows.length;i++){const x=rows[i],c=compile(x.question);if(!c||reconstruct(c)!==x.question||JSON.stringify(project(c))!==JSON.stringify(x.wire)||solve1(c)!==ref[i].answer||solve2(c)!==ref[i].answer)throw Error(x.id);}
for(const [id,mode] of Object.entries({"B6":"raw","C6":"prose","D6":"csv","E6":"atl"}))if(prompt(rows,mode)!==read("prompts/"+id+".txt"))throw Error(id);
console.log("Verified",rows.length,"pilot cases and 4 prompts");
