import {cases} from "../adaptive/complex.mjs";
import {modes,messages,selfTest} from "./core.mjs";
selfTest();
console.log(JSON.stringify(cases.flatMap(t=>modes.map(mode=>{
 const [s,u]=messages(t,mode);return {id:t.id,family:t.family,split:t.split,mode,system:s.content,user:u.content};
}))));
