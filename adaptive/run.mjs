// Reproduce using an official rank file, supplied locally; no dependency installation.
import {readFileSync,readdirSync,writeFileSync,mkdirSync} from "node:fs";
import {dirname} from "node:path";
import {tokenizer,verify,EXPECTED} from "./tokenizer.mjs";
import {cases,verifyCases} from "./complex.mjs";
import {run} from "./router.mjs";
const rankPath=process.argv[2];if(!rankPath)throw Error("Usage: node adaptive/run.mjs path/to/o200k_base.tiktoken [report.json]");
const enc=tokenizer(readFileSync(rankPath,"utf8"));const golden=verify(enc);verifyCases();
const cache=new Map();const count=s=>{if(!cache.has(s))cache.set(s,enc(s).length);return cache.get(s);};
const dir=new URL("../lab/data/",import.meta.url);const corpus=readdirSync(dir).filter(f=>f.endsWith(".jsonl")).sort().flatMap(f=>readFileSync(new URL(f,dir),"utf8").trim().split("\n").map(JSON.parse));
const result={encoding:"o200k_base",rank_sha256:EXPECTED,...run(corpus,cases,count)};
const folderResults={};for(const folder of ["nano","long","compression"]){const name=folder==="compression"?"pilot-messages.json":"pilot-report.json",p=JSON.parse(readFileSync(new URL("../"+folder+"/"+name,import.meta.url),"utf8")),rows=folder==="compression"?p:p.rows,stats={};for(const r of rows){const s=stats[r.mode]??={n:0,instruction:0,input:0,output:0};s.n++;s.instruction+=count(r.system);s.input+=count(r.user);s.output+=count(r.output);}for(const s of Object.values(stats))s.total=s.instruction+s.input+s.output;const d=stats.draft;for(const s of Object.values(stats)){s.saving_vs_draft_pct=100*(1-s.total/d.total);s.output_saving_vs_draft_pct=100*(1-s.output/d.output);}folderResults[folder]=stats;}
const out=process.argv[3]??"results/adaptive.json";mkdirSync(dirname(out),{recursive:true});writeFileSync(out,JSON.stringify({golden_vectors:golden,router:result,previous_pilots:folderResults},null,2)+"\n");console.log(JSON.stringify({golden_vectors:golden,router:result.reports,previous_pilots:folderResults},null,2));
