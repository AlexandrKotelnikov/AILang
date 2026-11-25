// Node >= 18, network access required. Fetch immutable Git blobs, verify and generate exact pilot.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";
const root=path.dirname(fileURLToPath(import.meta.url));
const manifest=JSON.parse(fs.readFileSync(path.join(root,"manifest.json"),"utf8"));
const arms={"B5":{"format":"json","guide":false},"D5":{"format":"atl","guide":false},"R5":{"format":"json","guide":true},"A5":{"format":"atl","guide":true},"C5":{"format":"csv","guide":false},"K5":{"format":"csv","guide":true}};
function normalize(s,raw){
 const a=s.key==="M"?raw.trim().split("\n").map(JSON.parse):JSON.parse(raw).examples;
 if(a.length!==s.count)throw Error("count "+s.dataset);
 const rows=a.map((x,i)=>({id:s.key+String(i+1).padStart(4,"0"),question:x.question??x.input,answer:s.key==="M"?x.answer.split("#### ").at(-1).replace(/,/g,"").trim():x.target}));
 if(new Set(rows.map(x=>x.question)).size!==rows.length||rows.some(x=>typeof x.question!=="string"||!(s.key==="M"?/^-?\d+(?:\.\d+)?$/.test(x.answer):/^\([A-F]\)$/.test(x.answer))))throw Error("schema "+s.dataset);
 return rows;
}

function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}

function select(rows,seed,n){return [...rows].sort((a,b)=>hash(seed+":"+a.id)-hash(seed+":"+b.id)||a.id.localeCompare(b.id)).slice(0,n).sort((a,b)=>a.id.localeCompare(b.id))}

function encode(rows,format){const q=rows.map(({id,question})=>({id,question}));
 if(format==="json")return JSON.stringify(q);
 if(format==="atl"){if(q.some(x=>/^@@ /m.test(x.question)))throw Error("delimiter collision");return q.map(x=>"@@ "+x.id+"\n"+x.question).join("\n")}
 if(format==="csv")return "id,question\n"+q.map(x=>x.id+',\"'+x.question.replace(/"/g,'""')+'\"').join("\n");
 throw Error("format");
}

function decode(s,format){
 if(format==="json")return JSON.parse(s);
 if(format==="atl")return s.split(/^@@ /m).slice(1).map((p,i,a)=>{const j=p.indexOf("\n");return {id:p.slice(0,j),question:p.slice(j+1,i===a.length-1?undefined:-1)}});
 if(format==="csv"){const rows=[];let i="id,question\n".length;while(i<s.length){const j=s.indexOf(",",i),id=s.slice(i,j);i=j+1;if(s[i++]!=='"')throw Error("quote");let question="",closed=false;while(i<s.length){const c=s[i++];if(c==='"'){if(s[i]==='"'){question+='"';i++}else{closed=true;break}}else question+=c}if(!closed)throw Error("unterminated");if(i<s.length&&s[i++]!=="\n")throw Error("row delimiter");rows.push({id,question})}return rows}
 throw Error("format");
}

function makePrompt(rows,arm){
 const prefix="Solve each question independently. Do not use external tools or code. Return only one line per question, in input order, as ID=answer. For IDs beginning M, return a plain decimal number without commas or units. For IDs beginning L, T or D, return the option label exactly as (A), (B), etc. No explanations, headings or markdown.\n";
 const guidance="Use these solution strategies: M: track exact quantities and units, form equations, calculate the requested value. L: translate ordering statements to constraints and eliminate inconsistent positions. T: maintain the current owner/object mapping and apply each swap sequentially. D: apply calendar offsets in order, accounting for month lengths and leap years. Check the requested final value or option.\n";
 const descriptor={json:"Input: JSON array of records with id and question fields.\n",atl:"Input: each record starts with @@ followed by its ID; subsequent lines are the question until the next record or end.\n",csv:"Input: CSV with header id,question. Quoted fields may span lines; doubled quotes represent literal quotes.\n"};
 return prefix+(arm.guide?guidance:"")+descriptor[arm.format]+encode(rows,arm.format)+"\n";
}
async function get(s){
 const r=await fetch("https://api.github.com/repos/"+s.repo+"/git/blobs/"+s.sha,{headers:{"Accept":"application/vnd.github+json","User-Agent":"AILang-benchmark"}});
 if(!r.ok)throw Error("HTTP "+r.status+" "+s.path);
 const blob=await r.json(); const bytes=Buffer.from(blob.content,"base64");
 const sha=crypto.createHash("sha1").update("blob "+bytes.length+"\0").update(bytes).digest("hex");
 if(sha!==s.sha)throw Error("blob hash mismatch");
 return bytes.toString("utf8");
}
const rows=[],full=[];
for(const s of manifest.sources){const a=normalize(s,await get(s));full.push(...a);const selected=select(a,manifest.seed,manifest.per_category);if(JSON.stringify(selected.map(x=>x.id))!==JSON.stringify(s.selected_ids))throw Error("selection mismatch");rows.push(...selected)}
const dir=path.join(root,"reproduced");fs.mkdirSync(path.join(dir,"prompts"),{recursive:true});
for(const [id,arm] of Object.entries(arms)){const p=makePrompt(rows,arm),original=fs.readFileSync(path.join(root,"prompts",id+".txt"),"utf8");if(p!==original)throw Error("prompt drift "+id);fs.writeFileSync(path.join(dir,"prompts",id+".txt"),p)}
for(const [name,values] of [["pilot_questions.json",rows.map(({id,question})=>({id,question}))],["pilot_reference.json",rows.map(({id,answer})=>({id,answer}))]]){const content=JSON.stringify(values,null,2)+"\n";if(content!==fs.readFileSync(path.join(root,name),"utf8"))throw Error("artifact drift "+name);fs.writeFileSync(path.join(dir,name),content)}
fs.writeFileSync(path.join(dir,"full_questions.jsonl"),full.map(({id,question})=>JSON.stringify({id,question})).join("\n")+"\n");fs.writeFileSync(path.join(dir,"full_reference.jsonl"),full.map(({id,answer})=>JSON.stringify({id,answer})).join("\n")+"\n");
console.log("Verified pilot",rows.length,"full",full.length);
