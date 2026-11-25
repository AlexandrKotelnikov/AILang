import {readFileSync} from "node:fs";
import {tokenizer,verify,EXPECTED} from "./tokenizer.mjs";
import {batchCandidates,permCandidates,select} from "./route-v2.mjs";
const args=process.argv.slice(2);
function arg(flag){const i=args.indexOf(flag);if(i<0||!args[i+1]||args[i+1].startsWith("--"))throw Error("Required: "+flag);return args[i+1];}
try{
 const mode=arg("--mode"), rows=JSON.parse(readFileSync(arg("--input"),"utf8"));
 const candidates=mode==="batch"?batchCandidates(rows):mode==="permutation"?permCandidates(rows):null;
 if(!candidates)throw Error("Mode must be batch or permutation");
 const encode=tokenizer(readFileSync(arg("--ranks"),"utf8"));const golden=verify(encode);
 const skillText=readFileSync(new URL("../SKILL.md",import.meta.url),"utf8");
 const result=select(candidates,s=>encode(s).length,{skillText,skillLoaded:args.includes("--skill-loaded")});
 console.log(JSON.stringify({version:"0.2.0",encoding:"o200k_base",rank_sha:EXPECTED,golden,measurement:"static modeled input text only; excludes API framing, tool and reference loading, output, caching and hidden reasoning",...result},null,2));
}catch(e){console.error(e.message);process.exitCode=1;}
