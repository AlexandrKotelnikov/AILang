import {readFileSync} from "node:fs";
import {tokenizer,verify,EXPECTED} from "../adaptive/tokenizer.mjs";
import {selfTest,staticReport} from "./core.mjs";
if(!process.argv[2])throw Error("Pass path to official o200k_base.tiktoken");
const enc=tokenizer(readFileSync(process.argv[2],"utf8"));
const goldenPassed=verify(enc),tests=selfTest();
console.log(JSON.stringify({goldenPassed,tests,...staticReport(s=>enc(s).length,"o200k_base ordinary text tokens"),vocab_sha256:EXPECTED},null,2));
