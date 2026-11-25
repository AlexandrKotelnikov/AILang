// Template-specific, fail-closed compiler. No answer is used during compilation.
const names=["Alice","Bob","Claire","Dave","Eve"],labels="ABCDE",templates=[
  [
    "Alice, Bob, Claire, Dave, and Eve are dancers at a square dance. At the start of a song, they each have a partner",
    "is dancing with ",
    "Throughout the song, the dancers often trade partners.",
    "switch partners",
    "At the end of the dance, ",
    " is dancing with"
  ],
  [
    "Alice, Bob, Claire, Dave, and Eve are friends and avid readers who occasionally trade books. At the start of the semester, they each buy one new book",
    "gets ",
    "As the semester proceeds, they start trading around the new books.",
    "swap books",
    "At the end of the semester, ",
    " has"
  ],
  [
    "Alice, Bob, Claire, Dave, and Eve are on the same team in a soccer match. At the start of the match, they are each assigned to a position",
    "is playing ",
    "As the game progresses, pairs of players occasionally swap positions.",
    "trade positions",
    "At the end of the match, ",
    " is playing"
  ],
  [
    "Alice, Bob, Claire, Dave, and Eve are holding a white elephant gift exchange. At the start of the event, they are each holding a present of a different color",
    "has a ",
    "As the event progresses, pairs of people swap gifts.",
    "swap their gifts",
    "At the end of the event, ",
    " has the"
  ],
  [
    "Alice, Bob, Claire, Dave, and Eve are playing a game. At the start of the game, they are each holding a ball",
    "has a ",
    "As the game progresses, pairs of players trade balls.",
    "swap balls",
    "At the end of the game, ",
    " has the"
  ]
];
function reconstruct(c){const t=templates[c.template];return t[0]+": "+names.map((n,i)=>n+" "+t[1]+c.items[i]).join(", ").replace(", Eve ",", and Eve ")+".\n"+t[2]+" "+c.swaps.map(([a,b],i)=>(i===0?"First":i===4?"Finally":"Then")+", "+names[a]+" and "+names[b]+" "+t[3]+".").join(" ")+" "+t[4]+names[c.query]+t[5]+"\nOptions:\n"+c.options.map((s,i)=>"("+labels[i]+") "+s).join("\n");}

function compile(q){
 const template=templates.findIndex(t=>q.startsWith(t[0]+": "));if(template<0)return null;
 const t=templates[template],parts=q.split("\nOptions:\n");if(parts.length!==2)return null;
 const opts=parts[1].split("\n"),options=opts.map((s,i)=>s.startsWith("("+labels[i]+") ")?s.slice(4):null);
 if(options.length!==5||options.some(x=>!x)||new Set(options).size!==5)return null;
 const init=parts[0].slice(t[0].length+2).split(".\n")[0];
 const items=names.map((n,i)=>{let start=(i===4?"and ":"")+n+" "+t[1];const off=init.indexOf(start);if(off<0)return null;let end=i===4?init.length:init.indexOf(", ",off+start.length);if(end<0)return null;return init.slice(off+start.length,end)});
 if(items.some(x=>!x)||new Set(items).size!==5||items.some(x=>!options.includes(x)))return null;
 const re=/\b(?:First|Then|Finally), (Alice|Bob|Claire|Dave|Eve) and (Alice|Bob|Claire|Dave|Eve) /g;
 const swaps=[...parts[0].matchAll(re)].map(m=>[names.indexOf(m[1]),names.indexOf(m[2])]);
 const query=names.findIndex(n=>parts[0].endsWith(t[4]+n+t[5]));
 if(swaps.length!==5||swaps.some(([a,b])=>a===b)||query<0)return null;
 const c={template,items,options,swaps,query};
 return reconstruct(c)===q?c:null;
}

function project(c){return {initial:c.items.map(x=>labels[c.options.indexOf(x)]).join(""),swaps:c.swaps.map(([a,b])=>labels[a]+labels[b]),query:labels[c.query]};}

function solve1(c){let a=c.items.slice();for(const [i,j] of c.swaps)[a[i],a[j]]=[a[j],a[i]];return "("+labels[c.options.indexOf(a[c.query])]+")";}

function solve2(c){let q=c.query;for(const [i,j] of c.swaps.slice().reverse())q=q===i?j:q===j?i:q;return "("+labels[c.options.indexOf(c.items[q])]+")";}

function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}}

function sample(a,n){const b=a.slice(),r=rng(20261125);for(let i=b.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b.slice(0,n);}

function encode(rows,mode){
 if(mode==="raw")return "id,question\n"+rows.map(x=>x.id+',\"'+x.question.replace(/"/g,'""')+'\"').join("\n");
 if(mode==="prose")return rows.map(x=>{const p=project(x.compiled);return x.id+": Initial "+[...p.initial].map((v,i)=>labels[i]+" holds "+v).join(", ")+". Swap "+p.swaps.map(s=>s[0]+" and "+s[1]).join("; ")+". Final item of "+p.query+"?"}).join("\n");
 if(mode==="csv")return "id,initial,swap1,swap2,swap3,swap4,swap5,query\n"+rows.map(x=>{const p=project(x.compiled);return [x.id,p.initial,...p.swaps,p.query].join(",")}).join("\n");
 if(mode==="atl")return rows.map(x=>{const p=project(x.compiled);return x.id+":"+p.initial+"/"+p.swaps.join("")+"/"+p.query}).join("\n");
 throw Error("unknown");
}

function decode(line,mode){if(mode==="atl"){const m=/^(T\d{4}):([A-E]{5})\/([A-E]{10})\/([A-E])$/.exec(line);if(!m)throw Error("wire");return {id:m[1],initial:m[2],swaps:m[3].match(/../g),query:m[4]};}const a=line.split(",");if(a.length!==8)throw Error("arity");return {id:a[0],initial:a[1],swaps:a.slice(2,7),query:a[7]};}

function prompt(rows,mode){let common="Solve each question independently without external tools or code. Return only ID=(A), ID=(B), etc., one line per question in input order, no headings or explanations.\n";
 if(mode==="raw")return common+"Input: CSV id,question; quoted fields can contain line breaks and doubled quotes.\n"+encode(rows,mode)+"\n";
 common+="Actors A,B,C,D,E hold distinct items labeled A,B,C,D,E (the original multiple-choice labels). Initial assignments are in actor order A..E. Each swap exchanges the current items of its two actors, in listed order. Return the item label held by the queried actor after all five swaps, in parentheses.\n";
 const desc={prose:"Each record gives initial assignments, five swaps and the queried actor in English.\n",csv:"CSV columns: id,initial,swap1..swap5,query. Initial is five item letters; each swap is two actor letters.\n",atl:"Records: ID:initial/swaps/query. Initial is five item letters; swaps is ten actor letters split into five consecutive pairs; query is one actor letter.\n"};return common+desc[mode]+encode(rows,mode)+"\n";
}
export {compile,reconstruct,project,solve1,solve2,sample,encode,decode,prompt};
