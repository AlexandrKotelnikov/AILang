function build(seed=2026112507){
 const alphabet="ABCDEFGHIJKLMNOPQRST";
 let state=seed>>>0;
 function next(){state^=state<<13;state^=state>>>17;state^=state<<5;return state>>>0;}
 function rand(n){const limit=4294967296-(4294967296%n);let r;do{r=next();}while(r>=limit);return r%n;}
 function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=rand(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
 const tasks=[];
 for(const n of [5,10,20])for(const m of [5,20,100])for(let rep=0;rep<3;rep++){
  const labels=alphabet.slice(0,n),initial=shuffle([...labels]).join("");
  const swaps=Array.from({length:m},()=>{const a=rand(n);let b=rand(n-1);if(b>=a)b++;return labels[a]+labels[b];});
  tasks.push({id:"P"+String(tasks.length+1).padStart(3,"0"),n,m,initial,swaps,query:labels[rand(n)]});
 }
 return shuffle(tasks);
}

function forward(t){const a=[...t.initial];for(const p of t.swaps){const i=p.charCodeAt(0)-65,j=p.charCodeAt(1)-65;[a[i],a[j]]=[a[j],a[i]];}return a[t.query.charCodeAt(0)-65];}

function backward(t){let q=t.query;for(let i=t.swaps.length-1;i>=0;i--){const [a,b]=t.swaps[i];if(q===a)q=b;else if(q===b)q=a;}return t.initial[q.charCodeAt(0)-65];}

function record(t,arm){
 const actors=[...t.initial].map((_,i)=>String.fromCharCode(65+i));
 if(arm==="B7")return `${t.id}: There are ${t.n} actors named ${actors.join(", ")}. Each actor holds one distinct item, also labeled with a capital letter. At the beginning, ${actors.map((a,i)=>`actor ${a} holds item ${t.initial[i]}`).join(", ")}. The following exchanges happen in order. ${t.swaps.map(([a,b])=>`Next, actors ${a} and ${b} exchange the items they currently hold.`).join(" ")} After all exchanges, which item does actor ${t.query} hold?`;
 if(arm==="C7")return `${t.id}: Initial ${actors.map((a,i)=>a+" holds "+t.initial[i]).join(", ")}. Swap ${t.swaps.map(([a,b])=>a+" and "+b).join("; ")}. Final item of ${t.query}?`;
 if(arm==="D7")return [t.id,t.initial,...t.swaps,t.query].join(",");
 if(arm==="E7")return `${t.id}:${t.initial}/${t.swaps.join("")}/${t.query}`;
 throw Error("arm");
}

function prompt(tasks,arm){
 const common="Solve each independent task without external tools or code. Return only ID=LETTER, one line per task in input order, no headings or explanations. Each actor holds exactly one distinct item. Actors and item labels are capital letters. Each exchange swaps the current items of the two actors. Execute exchanges in listed order and return the final item label of the queried actor.\n";
 const headers={B7:"Each paragraph describes one task in English.\n",C7:"Each line describes initial assignments, ordered exchanges, and the queried actor in compact English.\n",D7:"CSV per line: ID,initial,swap1,...,swapK,query. Initial lists item labels in actor order A onward; its length gives the number of actors. Each swap is a pair of actor letters. Last field is the queried actor.\n",E7:"Records: ID:initial/swaps/query. Initial lists item labels in actor order A onward; its length gives the number of actors. Swaps is a string of actor letters split into consecutive pairs. Last field is the queried actor.\n"};
 return common+headers[arm]+tasks.map(t=>record(t,arm)).join("\n")+"\n";
}

function decode(line,arm){let id,initial,swaps,query;if(arm==="D7"){const a=line.split(",");id=a.shift();initial=a.shift();query=a.pop();swaps=a;}else if(arm==="E7"){const m=/^(P\d{3}):([A-T]+)\/([A-T]+)\/([A-T])$/.exec(line);if(!m||m[3].length%2)throw Error("wire");id=m[1];initial=m[2];swaps=m[3].match(/../g);query=m[4];}else throw Error("arm");const n=initial.length,m=swaps.length,labels="ABCDEFGHIJKLMNOPQRST".slice(0,n);if(!/^P\d{3}$/.test(id)||![5,10,20].includes(n)||![5,20,100].includes(m)||[...initial].sort().join("")!==labels||query.length!==1||!labels.includes(query)||swaps.some(p=>p.length!==2||p[0]===p[1]||![...p].every(x=>labels.includes(x))))throw Error("invalid");return {id,n,m,initial,swaps,query};}
export {build,forward,backward,record,prompt,decode};
