import {selfTest,staticReport} from "./core.mjs";
console.error(selfTest());
console.log(JSON.stringify(staticReport(s=>s.length,"ASCII characters"),null,2));
