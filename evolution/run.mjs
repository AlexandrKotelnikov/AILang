// Node 18+. Default: character proxy, NOT token counts.
import {readFileSync,readdirSync,writeFileSync,mkdirSync} from "node:fs";
import {createHash} from "node:crypto";
import {parseArgs} from "node:util";
import {chars,run,selfTest} from "./core.mjs";
const {values:v}=parseArgs({options:{encoding:{type:"string"},out:{type:"string",default:"results/evolution.json"},"self-test":{type:"boolean"}}});
console.error(selfTest());
if(v["self-test"])process.exit(0);
let count=chars,unit="unicode_code_points";
if(v.encoding){
 const {getEncoding}=await import("js-tiktoken");
 const enc=getEncoding(v.encoding);
 count=s=>enc.encode(s,[],[]).length;
 unit="tokens:"+v.encoding;
}
const cache=new Map(),raw=count;
count=s=>{if(!cache.has(s)){if(cache.size>=150000)cache.clear();cache.set(s,raw(s));}return cache.get(s);};
const dir=new URL("../lab/data/",import.meta.url),rows=[],hashes={};
for(const file of readdirSync(dir).filter(x=>x.endsWith(".jsonl")).sort()){
 const body=readFileSync(new URL(file,dir),"utf8");
 hashes[file]=createHash("sha256").update(body).digest("hex");
 rows.push(...body.trim().split("\n").map(JSON.parse));
}
const report=run(rows,count,unit);
report.metadata={node:process.version,corpus_hashes:hashes,core_sha256:createHash("sha256").update(readFileSync(new URL("./core.mjs",import.meta.url))).digest("hex")};
import {dirname} from "node:path";
mkdirSync(dirname(v.out),{recursive:true});writeFileSync(v.out,JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
