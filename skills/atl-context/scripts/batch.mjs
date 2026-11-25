import {readFileSync} from "node:fs";
import {tokenizer,verify,EXPECTED} from "./tokenizer.mjs";
import {route} from "./batch-core.mjs";
const args=process.argv.slice(2);
function arg(flag){const i=args.indexOf(flag);if(i<0||!args[i+1])throw Error("Required: "+flag);return args[i+1];}
try{
 const encode=tokenizer(readFileSync(arg("--ranks"),"utf8"));verify(encode);
 const rows=JSON.parse(readFileSync(arg("--input"),"utf8"));
 const skill=readFileSync(new URL("../SKILL.md",import.meta.url),"utf8");
 const result=route(rows,s=>encode(s).length,skill,{skillLoaded:args.includes("--skill-loaded")});
 console.log(JSON.stringify({encoding:"o200k_base",rank_sha:EXPECTED,measurement:"static input text only; no API framing, output, caching or hidden reasoning",...result},null,2));
}catch(e){console.error(e.message);process.exitCode=1;}
