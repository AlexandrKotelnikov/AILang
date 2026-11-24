import {report,tasks,verifiedAnswers,extract} from "./core.mjs";
for(const t of tasks)if(t.answer!==verifiedAnswers()[t.id])throw Error("reference mismatch");
if(extract("FINAL: 1\nFINAL: 2")!==null)throw Error("format");
const r=report();if(r.rows.length!==32)throw Error("fixture count");
console.log(JSON.stringify(r,null,2));
