// Independent BPE implementation using the exact official o200k_base mergeable ranks.
const EXPECTED="446a9538cb6c348e3516120d7c08b09f57c36495e2acfffe59a5bf8b0cfb1a2d";
const PAT="[^\\r\\n\\p{L}\\p{N}]?[\\p{Lu}\\p{Lt}\\p{Lm}\\p{Lo}\\p{M}]*[\\p{Ll}\\p{Lm}\\p{Lo}\\p{M}]+(?:'[sS]|'[tT]|'[rR][eE]|'[vV][eE]|'[mM]|'[lL][lL]|'[dD])?|[^\\r\\n\\p{L}\\p{N}]?[\\p{Lu}\\p{Lt}\\p{Lm}\\p{Lo}\\p{M}]+[\\p{Ll}\\p{Lm}\\p{Lo}\\p{M}]*(?:'[sS]|'[tT]|'[rR][eE]|'[vV][eE]|'[mM]|'[lL][lL]|'[dD])?|\\p{N}{1,3}| ?[^\\s\\p{L}\\p{N}]+[\\r\\n/]*|\\s*[\\r\\n]+|\\s+(?!\\S)|\\s+";
function sha256Ascii(s){
 const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
 const H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],n=s.length,padded=Math.ceil((n+9)/64)*64;
 if(n>=0x20000000)throw Error("input too long");
 const bytes=new Uint8Array(padded);
 for(let i=0;i<n;i++){const c=s.charCodeAt(i);if(c>127)throw Error("non-ASCII rank data");bytes[i]=c;}
 bytes[n]=128;const bitlen=n*8;for(let i=0;i<4;i++)bytes[padded-1-i]=(bitlen>>>(8*i))&255;
 const ro=(x,n)=>(x>>>n)|(x<<(32-n)),w=new Int32Array(64);
 for(let off=0;off<padded;off+=64){
  for(let i=0;i<16;i++){let j=off+4*i;w[i]=(bytes[j]<<24)|(bytes[j+1]<<16)|(bytes[j+2]<<8)|bytes[j+3];}
  for(let i=16;i<64;i++){let x=w[i-15],y=w[i-2];w[i]=(w[i-16]+(ro(x,7)^ro(x,18)^(x>>>3))+w[i-7]+(ro(y,17)^ro(y,19)^(y>>>10)))|0;}
  let [a,b,c,d,e,f,g,h]=H;
  for(let i=0;i<64;i++){let t1=(h+(ro(e,6)^ro(e,11)^ro(e,25))+((e&f)^(~e&g))+K[i]+w[i])|0,t2=((ro(a,2)^ro(a,13)^ro(a,22))+((a&b)^(a&c)^(b&c)))|0;h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;}
  [a,b,c,d,e,f,g,h].forEach((x,i)=>H[i]=(H[i]+x)|0);
 }
 return H.map(x=>(x>>>0).toString(16).padStart(8,"0")).join("");
}

function from64(s){
 const abc="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";let bits=0,n=0,out="";
 for(const c of s){if(c==="=")break;let v=abc.indexOf(c);if(v<0)throw Error("base64");bits=(bits<<6)|v;n+=6;if(n>=8){n-=8;out+=String.fromCharCode((bits>>>n)&255);}}
 return out;
}

function utf8(s){
 let out="";for(const c of s){let cp=c.codePointAt(0);if(cp>=0xd800&&cp<=0xdfff)cp=0xfffd;
 if(cp<128)out+=String.fromCharCode(cp);
 else if(cp<2048)out+=String.fromCharCode(192|(cp>>6),128|(cp&63));
 else if(cp<65536)out+=String.fromCharCode(224|(cp>>12),128|((cp>>6)&63),128|(cp&63));
 else out+=String.fromCharCode(240|(cp>>18),128|((cp>>12)&63),128|((cp>>6)&63),128|(cp&63));}
 return out;
}

function tokenizer(raw){
 if(sha256Ascii(raw)!==EXPECTED)throw Error("Vocabulary checksum mismatch");
 const rank=new Map();for(const line of raw.trimEnd().split("\n")){const [key,n]=line.split(" ");rank.set(from64(key),Number(n));}
 if(rank.size!==199998)throw Error("Vocabulary size mismatch");
 const pattern=new RegExp(PAT,"gu"),cache=new Map();
 function piece(p){if(cache.has(p))return cache.get(p);const b=utf8(p);let ids;
  if(rank.has(b))ids=[rank.get(b)];
  else{const parts=b.split("");while(parts.length>1){let idx=-1,min=Infinity;for(let i=0;i<parts.length-1;i++){const r=rank.get(parts[i]+parts[i+1]);if(r!==undefined&&r<min){idx=i;min=r;}}
   if(idx<0)break;parts.splice(idx,2,parts[idx]+parts[idx+1]);}ids=parts.map(x=>{if(!rank.has(x))throw Error("missing byte");return rank.get(x);});}
  if(cache.size>=100000)cache.clear();cache.set(p,ids);return ids;
 }
 return s=>{const m=s.match(pattern)||[];if(m.join("")!==s)throw Error("regex coverage");return m.flatMap(piece);};
}
const golden=[["antidisestablishmentarianism",[493,129901,376,160388,21203,2367]],["2 + 2 = 4",[17,659,220,17,314,220,19]],["お誕生日おめでとう",[8930,9697,243,128225,8930,17693,4344,48669]]];
function verify(encode){for(const [s,ids] of golden)if(JSON.stringify(encode(s))!==JSON.stringify(ids))throw Error("Golden vector mismatch: "+s);return golden.length;}
export {tokenizer,verify,sha256Ascii,EXPECTED};
