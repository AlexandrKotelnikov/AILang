// Reproduce report.json. Usage: node skills/atl-context-eval/check.mjs /path/to/o200k_base.tiktoken
import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
import {tokenizer,verify,EXPECTED} from "../atl-context/scripts/tokenizer.mjs";
import {group,expand,normalize,route} from "../atl-context/scripts/batch-core.mjs";
const read=(p)=>readFileSync(new URL(p,import.meta.url),"utf8");
if(!process.argv[2])throw Error("Provide a local o200k_base rank file");
const encode=tokenizer(readFileSync(process.argv[2],"utf8")), count=s=>encode(s).length;
const golden=verify(encode),skill=read("../atl-context/SKILL.md");
const cases=JSON.parse(read("./cases.json")),report=JSON.parse(read("./report.json"));
assert.equal(EXPECTED,report.rank_sha);
assert.equal(golden,report.golden);
assert.equal(count(skill),report.skill_file_tokens);
assert.equal(count(skill.split("---")[1].trim()),report.metadata_text_tokens);
for(const c of cases)assert.deepEqual(expand(JSON.parse(JSON.stringify(group(c.rows)))),normalize(c.rows));
for(const invalid of [[],[{id:"a",context:"x",task:"t"},{id:"a",context:"y",task:"u"}],[{id:"a",context:"x",task:2}],[{id:"a",context:"x",task:"t",extra:1}]])assert.throws(()=>group(invalid));
const results=cases.map(c=>{
 const a=route(c.rows,count,skill),b=route(c.rows,count,skill,{skillLoaded:true});
 for(const r of [a,b])assert.equal(r.selectedInputTokens,Math.min(r.baseline.total,r.candidate.total));
 return {case:c.name,n:c.rows.length,baseline_payload:a.baseline.payload,group_payload:a.candidate.payload,cold:{flat:a.baseline.total,group:a.candidate.total,mode:a.mode},warm:{flat:b.baseline.total,group:b.candidate.total,mode:b.mode}};
});
assert.deepEqual(results,report.results);
console.log("Verified exact fixture roundtrips, rejection cases, routing, and report token counts.");
