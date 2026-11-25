import json,re,sys,collections,pathlib
root=pathlib.Path(__file__).resolve().parent
gold=json.loads((root/"reference.json").read_text())
rows=collections.defaultdict(list)
for line in pathlib.Path(sys.argv[1]).read_text().splitlines():
 m=re.fullmatch(r"(Q\d{3})=([A-P]{3})",line.strip().rstrip("\\"))
 if m: rows[m[1]].append(m[2])
results=[]
for t in gold:
 a=rows[t["id"]][0] if len(rows[t["id"]])==1 else ""
 results.append({**t,"response":a,"exact":a==t["answer"],"items_correct":sum(x==y for x,y in zip(a,t["answer"]))})
print(json.dumps({"exact":sum(r["exact"] for r in results),"tasks":len(gold),"items_correct":sum(r["items_correct"] for r in results),"items_total":3*len(gold),"cases":results},indent=2))
