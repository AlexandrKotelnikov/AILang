function build(seed=2026112508){
 let s=seed>>>0;
 const next=()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return s>>>0;};
 function rand(n){let v;const lim=4294967296-4294967296%n;do{v=next();}while(v>=lim);return v%n;}
 function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=rand(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
 const tasks=[];
 for(const n of [8,16])for(const m of [40,120])for(let k=0;k<3;k++){
 const labels="ABCDEFGHIJKLMNOP".slice(0,n), initial=shuffle(labels).join("");
 const ops=Array.from({length:m},()=>{const a=rand(n);let b=rand(n-1);if(b>=a)b++;return "SLG"[rand(3)]+labels[a]+labels[b];});
 const queries=shuffle(labels).slice(0,3).join("");
 tasks.push({id:"Q"+String(tasks.length+1).padStart(3,"0"),n,m,initial,ops,queries});
 }
 return shuffle(tasks);
}

function forward(t){const a=[...t.initial];for(const [op,x,y] of t.ops){const i=x.charCodeAt(0)-65,j=y.charCodeAt(0)-65;if(op==="S"||(op==="L"&&a[i]<a[j])||(op==="G"&&a[i]>a[j]))[a[i],a[j]]=[a[j],a[i]];}return [...t.queries].map(x=>a[x.charCodeAt(0)-65]).join("");}

function inverse(t){const p=new Map([...t.initial].map((v,i)=>[v,String.fromCharCode(65+i)]));const itemAt=x=>[...p].find(z=>z[1]===x)[0];for(const [op,x,y] of t.ops){const a=itemAt(x),b=itemAt(y);if(op==="S"||(op==="L"&&a<b)||(op==="G"&&a>b)){p.set(a,y);p.set(b,x);}}return [...t.queries].map(itemAt).join("");}

function decode(line,arm){let id,initial,ops,queries;if(arm==="D8"){const a=line.split(",");id=a.shift();initial=a.shift();queries=a.pop();ops=a;}else if(arm==="E8"){const a=line.split(/[:/]/);if(a.length!==4||a[2].length%3)throw Error("bad record");[id,initial,,queries]=a;ops=a[2].match(/.../g);}else throw Error("arm");const n=initial.length,m=ops.length,labels="ABCDEFGHIJKLMNOP".slice(0,n);if(!/^Q\d{3}$/.test(id)||![8,16].includes(n)||![40,120].includes(m)||[...initial].sort().join("")!==labels||queries.length!==3||new Set(queries).size!==3||![...queries].every(x=>labels.includes(x))||ops.some(p=>p.length!==3||!"SLG".includes(p[0])||p[1]===p[2]||!labels.includes(p[1])||!labels.includes(p[2])))throw Error("invalid record");return {id,n,m,initial,ops,queries};}

function record(t,arm){const actors=[...t.initial].map((_,i)=>String.fromCharCode(65+i));if(arm==="D8")return [t.id,t.initial,...t.ops,t.queries].join(",");if(arm==="E8")return `${t.id}:${t.initial}/${t.ops.join("")}/${t.queries}`;if(arm==="C8")return `${t.id}: Initial ${actors.map((a,i)=>a+" holds "+t.initial[i]).join(", ")}. ${t.ops.map(([op,a,b])=>op==="S"?`Swap ${a} and ${b}`:`Swap ${a} and ${b} if ${a}'s item ${op==="L"?"<":">"} ${b}'s item`).join("; ")}. Final items of ${[...t.queries].join(", ")}?`;if(arm==="B8")return `${t.id}: At the beginning, ${actors.map((a,i)=>`actor ${a} holds item ${t.initial[i]}`).join(", ")}. Execute the following operations in order. ${t.ops.map(([op,a,b])=>op==="S"?`Next, actors ${a} and ${b} exchange the items they currently hold.`:`Next, compare the items currently held by actors ${a} and ${b}. If the item held by actor ${a} is alphabetically ${op==="L"?"earlier":"later"} than the item held by actor ${b}, exchange their items; otherwise leave both unchanged.`).join(" ")} After all operations, what are the items held by actors ${[...t.queries].join(", ")}, in that order?`;throw Error("arm");}

function prompt(tasks,arm){const common="Solve each independent task without external tools or code. Return only ID=XYZ, one line per task in input order, where XYZ are the three final item labels in the exact requested actor order. Each actor holds exactly one distinct capital-letter item. Execute operations in listed order; conditional swaps compare the CURRENT item labels in alphabetical order, not actor labels. If a condition is false, change nothing.\n";const headers={B8:"Each paragraph describes one task in English.\n",C8:"Each line uses compact English; < and > compare item labels alphabetically.\n",D8:"CSV: ID,initial,op1,...,opK,queries. Initial lists item labels in actor order A onward. Each operation is three letters: Sab swaps actors a,b always; Lab swaps if current item of a is alphabetically earlier than that of b; Gab swaps if later. The final field lists three queried actors in order.\n",E8:"Records: ID:initial/ops/queries. Initial lists item labels in actor order A onward. Split ops into consecutive triples Sab, Lab or Gab: S always swaps actors a,b; L swaps if current item of a is alphabetically earlier than b's item; G swaps if later. Queries lists three actors in order.\n"};return common+headers[arm]+tasks.map(t=>record(t,arm)).join("\n")+"\n";}
export {build,forward,inverse,decode,record,prompt};
