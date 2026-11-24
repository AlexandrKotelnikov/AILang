import {readFileSync} from "node:fs";
import {selfTest,report} from "./core.mjs";
import {tokenizer,verify} from "../adaptive/tokenizer.mjs";
console.error(JSON.stringify(selfTest()));
const path=process.argv[2];
let count=s=>s.length,unit="ASCII characters";
if(path){const enc=tokenizer(readFileSync(path,"utf8"));verify(enc);count=s=>enc(s).length;unit="o200k_base tokens (independent rank implementation)";}
console.log(JSON.stringify(report(count,unit),null,2));
