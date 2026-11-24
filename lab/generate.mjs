// Deterministic synthetic benchmark; Node.js 18+.
// Run from repository root: node lab/generate.mjs
import {mkdirSync,writeFileSync} from 'node:fs';
function generate(){
 const rows=[];
 function add(f,i,ru,en,compact,p,r,rt,et,ct,answer){
   rows.push({id:`${f}-${String(i).padStart(3,"0")}`,family:f,split:(f==="interval"?Math.floor(i/5)%5:i%5)<3?"dev":"test",ru,en,compact,atl:p,ru_trace:rt,en_trace:et,compact_trace:ct,atl_trace:r,answer:String(answer)});
 }
 for(let i=0;i<100;i++){
  const a=2+i%9,x=3+i,b=7+i%13,c=a*x+b;
  add("equation",i,`Найди x из уравнения ${a}x+${b}=${c}; проверь подстановкой.`,`Solve ${a}x+${b}=${c} for x and verify by substitution.`,`Solve ${a}x+${b}=${c}; verify.`,[["goal","solve x"],["given",`${a}x+${b}=${c}`],["must","verify substitution"]],[["infer",`x=(${c}-${b})/${a}=${x}`],["check",`${a}*${x}+${b}==${c}`],["result",`${x}`]],`Вычитаем ${b}, делим на ${a}: x=${x}. Проверка: ${a}*${x}+${b}=${c}.`,`Subtract ${b}, divide by ${a}: x=${x}. Substitution: ${a}*${x}+${b}=${c}.`,`x=(${c}-${b})/${a}=${x}; ${a}*${x}+${b}=${c}.`,x);
  const qty=2+i,price=3+i%17,n=4+i%7,total=qty*price,ans=n*price;
  add("proportion",i,`${qty} одинаковых изделий стоят ${total} руб. Сколько стоят ${n} изделий по той же цене?`,`A batch of ${qty} identical items costs ${total} RUB. What do ${n} items cost at the same unit price?`,`Same unit price: ${qty} items cost ${total} RUB; cost of ${n}?`,[["given",`${qty} items=${total} RUB; same unit price`],["goal",`cost(${n}) RUB`]],[["infer",`unit=${total}/${qty}=${price}`],["result",`${n}*${price}=${ans} RUB`]],`Цена за штуку ${total}/${qty}=${price} руб.; стоимость ${n}*${price}=${ans} руб.`,`Unit price ${total}/${qty}=${price} RUB; cost ${n}*${price}=${ans} RUB.`,`Unit=${price}; ${n}*${price}=${ans} RUB.`,ans);
  const base=100+10*i,pct=10*(1+i%5),val=base*(100-pct)/100;
  add("discount",i,`Цена ${base} руб. Скидка ${pct}%. Найди цену после скидки.`,`An item costs ${base} RUB. Apply a ${pct}% discount and find the final price.`,`Price ${base} RUB; ${pct}% discount; final price?`,[["given",`price=${base} RUB; discount=${pct}%`],["goal","final price RUB"]],[["infer",`${base}*(100-${pct})/100`],["result",`${val} RUB`]],`После скидки ${base}*(100-${pct})/100=${val} руб.`,`Final price ${base}*(100-${pct})/100=${val} RUB.`,` ${base}*(100-${pct})/100=${val} RUB.`.trim(),val);
  const v1=10+i,v2=v1+4*(1+i%8),w=(3*v1+v2)/4;
  add("weighted",i,`Показание ${v1} держалось 3 часа, ${v2} — 1 час. Найди среднее по времени за 4 часа.`,`A reading is ${v1} for three hours and ${v2} for one hour. Find its time-weighted average over four hours.`,`Time weighted mean: ${v1} for 3 h, ${v2} for 1 h.`,[["given",`v=${v1},${v2}; t=3,1 h`],["goal","time-weighted mean"]],[["infer",`(${v1}*3+${v2})/4`],["result",`${w}`]],`Среднее по времени (${v1}*3+${v2})/4=${w}.`,`Weighted mean (${v1}*3+${v2})/4=${w}.`,`(${v1}*3+${v2})/4=${w}.`,w);
  const flow=50*(i+1),converted=3*(i+1);
  add("units",i,`Переведи расход ${flow} л/мин в м³/ч.`,`Convert a flow rate of ${flow} liters per minute to cubic meters per hour.`,`Convert ${flow} L/min to m3/h.`,[["given",`flow=${flow} L/min`],["goal","flow m3/h"]],[["infer",`${flow}*60/1000`],["result",`${converted} m3/h`]],`Умножаем на 60 и делим на 1000: ${converted} м³/ч.`,`Multiply by 60 and divide by 1000: ${converted} m3/h.`,` ${flow}*60/1000=${converted} m3/h.`.trim(),converted);
  const A=`A${i}`,B=`B${i}`,mode=i%4;
  const prem=[`${A} true`,`${B} false`,`${B} true`,`${A} false`][mode],target=[B,A,A,B][mode],answer=["true","false","unknown","unknown"][mode],logic=["modus ponens","modus tollens","converse invalid","inverse invalid"][mode],logicRu=["прямой вывод","контрапозиция","обратное следствие не гарантировано","отрицание основания не гарантирует отрицания следствия"][mode],premRu=[`${A} истинно`,`${B} ложно`,`${B} истинно`,`${A} ложно`][mode];
  add("implication",i,`Из ${A} следует ${B}. Известно: ${premRu}. Определи истинность ${target} (истина, ложь или неизвестно).`,`If ${A} then ${B}. Given ${prem}. Determine whether ${target} is true, false, or unknown.`,`${A} implies ${B}; ${prem}; ${target}: true/false/unknown?`,[["given",`${A}=>${B}; ${prem}`],["goal",`${target}: true/false/unknown`]],[["infer",logic],["result",`${target}=${answer}`]],`Применяем правило: ${logicRu}. ${target}: ${answer}.`,`Use ${logic}. ${target}: ${answer}.`,`${logic}; ${target}=${answer}.`,answer);
  const j=i%2,da=`P${i}`,db=`Q${i}`,disj=j?`${db} false`:`${da} false`,disjRu=j?`${db} ложно`:`${da} ложно`,other=j?da:db;
  add("disjunction",i,`Хотя бы одно из ${da}, ${db} истинно. ${disjRu}. Что известно о ${other}?`,`At least one of ${da}, ${db} is true. Given ${disj}, what is the truth value of ${other}?`,`${da} or ${db}; ${disj}; ${other}?`,[["given",`${da}|${db}; ${disj}`],["goal",`${other} truth`]],[["infer","disjunctive syllogism"],["result",`${other}=true`]],`Одно высказывание ложно, поэтому второе ${other} истинно.`,`One disjunct is false; therefore ${other} is true.`,`${disj}; other=${other}=true.`,`true`);
  const lo=i+10,hi=lo+5+i%4,z=[lo-1,lo,hi-1,hi,hi+1][i%5],inside=z>=lo&&z<hi,yes=inside?"yes":"no";
  add("interval",i,`Допустим диапазон [${lo}, ${hi}), левая граница включена, правая нет. Входит ли ${z} в диапазон?`,`The allowed interval is [${lo}, ${hi}), inclusive on the left and exclusive on the right. Is ${z} allowed?`,`Allowed [${lo},${hi}); is ${z} inside?`,[["given",`${lo}<=x<${hi}; x=${z}`],["goal","allowed?"]],[["check",`${lo}<=${z}<${hi}: ${inside}`],["result",yes]],`Проверка ${lo}<=${z}<${hi}: ${inside?"да":"нет"}.`,`Check ${lo}<=${z}<${hi}: ${yes}.`,`${lo}<=${z}<${hi}? ${yes}.`,yes);
  const cap=30+i,ca=cap+1+i%3,cb=cap-1,cc=cap-2,pa=10+i,pb=pa+2,pc=pa+(i%2?1:3),best=pb<pc?"B":"C";
  add("constraints",i,`Выбери самый дешёвый вариант с расходом не более ${cap} единиц. A: расход ${ca}, цена ${pa}; B: расход ${cb}, цена ${pb}; C: расход ${cc}, цена ${pc}.`,`Select the lowest-price option with resource usage at most ${cap}. A: usage ${ca}, price ${pa}; B: usage ${cb}, price ${pb}; C: usage ${cc}, price ${pc}.`,`Min price; usage<=${cap}. A(${ca},${pa}), B(${cb},${pb}), C(${cc},${pc}); pairs usage,price.`,[["goal","min price option"],["given",`(usage,price): A(${ca},${pa}),B(${cb},${pb}),C(${cc},${pc})`],["must",`usage<=${cap}`]],[["infer","A infeasible; B,C feasible"],["check",`${pb} vs ${pc}`],["result",best]],`A превышает лимит. B и C допустимы; сравниваем ${pb} и ${pc}, выбираем ${best}.`,`A exceeds the limit. B and C qualify; compare ${pb} and ${pc}, choose ${best}.`,`A invalid; B,C valid; min(${pb},${pc})->${best}.`,best);
  const alarm=`alarm${i}`,sensor=`sensor${i}`,pressure=`pressure${i}`;
  add("uncertainty",i,`Сигнал ${alarm} мог возникнуть из-за отказа ${sensor} или реального повышения ${pressure}. Независимых показаний нет. Доказан ли отказ датчика?`,`Signal ${alarm} could indicate failure of ${sensor} or a real rise in ${pressure}. No independent readings exist. Is sensor failure established?`,` ${alarm}: ${sensor} fault or ${pressure} rise possible. No independent readings. Fault established?`.trim(),[["given",`${alarm}: ${sensor} fault or ${pressure} rise possible`],["unknown","independent readings"],["goal","fault established?"]],[["infer","both explanations possible"],["result","no; cause unknown"]],`Обе причины возможны; независимых показаний нет. Отказ не доказан.`,`Both causes remain possible; independent readings absent. Fault not established.`,`Both possible; no independent readings; fault unconfirmed.`,`no`);
 }
 return rows;
}
const rows=generate();
if(rows.length!==1000 || new Set(rows.map(r=>r.id)).size!==1000) throw Error('Invalid corpus');
mkdirSync(new URL('./data/',import.meta.url),{recursive:true});
for(const f of new Set(rows.map(r=>r.family))){
 const group=rows.filter(r=>r.family===f);
 if(group.filter(r=>r.split==='dev').length!==60||group.filter(r=>r.split==='test').length!==40)throw Error('Invalid split');
 writeFileSync(new URL('./data/'+f+'.jsonl',import.meta.url),group.map(r=>JSON.stringify(r)).join('\n')+'\n');
}
console.log('Generated '+rows.length+' synthetic cases');
