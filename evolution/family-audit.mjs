// Leave-one-family-out static stress test.
import {readFileSync,readdirSync} from "node:fs";
import {chars,codec,mine,measure,evolve} from "./core.mjs";
const dir=new URL("../lab/data/",import.meta.url);
const rows=readdirSync(dir).filter(f=>f.endsWith(".jsonl")).sort().flatMap(f=>readFileSync(new URL(f,dir),"utf8").trim().split("\n").map(JSON.parse));
const folds=[];
for(const family of [...new Set(rows.map(r=>r.family))].sort()){
 const train=rows.filter(r=>r.split==="dev"&&r.family!==family),test=rows.filter(r=>r.split==="test"&&r.family===family);
 const candidates=mine(train.flatMap(r=>[r.compact,r.compact_trace]));
 const result=evolve(train,chars,100,candidates),baseline=measure(test,[],chars,100),evolved=measure(test,result.dict,chars,100);
 const c=codec(result.dict);for(const r of test)for(const s of [r.compact,r.compact_trace])if(c.decode(c.encode(s))!==s)throw Error("Fold roundtrip");
 folds.push({family,train_cases:train.length,test_cases:test.length,dict:result.dict,baseline:baseline.total,evolved:evolved.total,saving_pct:100*(1-evolved.total/baseline.total)});
}
const b=folds.reduce((a,r)=>a+r.baseline,0),e=folds.reduce((a,r)=>a+r.evolved,0);
console.log(JSON.stringify({folds,total_baseline:b,total_evolved:e,total_saving_pct:100*(1-e/b)},null,2));
