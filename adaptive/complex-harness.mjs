import {cases,verifyCases} from "./complex.mjs";
const modes=["draft","nano","nano-ascii"];
const common="Solve accurately. Give a brief checkable derivation and end with FINAL: <answer> in the requested format.";
const styles={"draft":"Use terse English notes or equations.","nano":"Use compact notation.","nano-ascii":"Use compact ASCII notation."};
function messages(t,m){if(!modes.includes(m))throw Error("Unknown mode");return [{role:"system",content:common+" "+styles[m]},{role:"user",content:t.prompt}];}
function extract(s){if(typeof s!=="string")return null;const lines=s.trim().split(/\r?\n/);if(lines.filter(x=>/^\s*FINAL\s*:/i.test(x)).length!==1)return null;return lines.at(-1).match(/^FINAL:\s*(\S.*?)\s*$/)?.[1]??null;}
function correct(t,s){const a=extract(s);if(a===null)return false;if(t.answerType==="integer")return /^\d+$/.test(a)&&Number(a)===Number(t.answer);if(t.answerType==="fraction")return /^\d+\/[1-9]\d*$/.test(a)&&a===t.answer;return a===t.answer;}
const tasks=cases.filter(t=>t.split==="test");
function verifiedAnswers(){verifyCases();return Object.fromEntries(tasks.map(t=>[t.id,t.answer]));}
function selfTest(){verifyCases();if(tasks.length!==36||tasks.some(t=>!correct(t,"FINAL: "+t.answer)||correct(t,"FINAL: "+t.answer+"\nextra")))throw Error("Complex grading");return true;}
export {tasks,modes,messages,extract,correct,verifiedAnswers,selfTest};
