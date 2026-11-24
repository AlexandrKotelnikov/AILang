import {readFileSync} from "node:fs";
import {tasks,pilotReport,verifiedAnswers} from "./core.mjs";
const samples=JSON.parse(readFileSync(new URL("./pilot-responses.json",import.meta.url),"utf8"));
for(const t of tasks)if(t.answer!==verifiedAnswers()[t.id])throw Error("Reference mismatch "+t.id);
const report=pilotReport(tasks,samples);
if(report.records.length!==40||report.records.some(r=>!r.correct))throw Error("Pilot regression");
console.log(JSON.stringify(report,null,2));
