import json,re,sys
from pathlib import Path
from collections import defaultdict
ref=json.loads(Path(__file__).with_name("reference.json").read_text())
lines=Path(sys.argv[1]).read_text().splitlines()
answers={}; invalid=[]; duplicate=[]
for line in lines:
    m=re.fullmatch(r"(P\d{3})=([A-T])",line.strip().rstrip("\\"))
    if not m: invalid.append(line); continue
    i,a=m.groups()
    if i in answers: duplicate.append(i)
    else: answers[i]=a
expected={x["id"] for x in ref}; unknown=sorted(set(answers)-expected)
wrong=[]; cells=defaultdict(lambda:{"correct":0,"total":0})
for x in ref:
    c=cells[f'{x["n"]}x{x["m"]}']; c["total"]+=1
    a=answers.get(x["id"])
    if a==x["answer"] and x["id"] not in duplicate: c["correct"]+=1
    else: wrong.append({**x,"actual":a})
strict=lines==[f'{x["id"]}={answers.get(x["id"])}' for x in ref] and not (invalid or duplicate or unknown)
print(json.dumps({"strict":strict,"correct":len(ref)-len(wrong),"total":len(ref),"by_cell":cells,"wrong":wrong,"invalid":invalid,"duplicate":duplicate,"unknown":unknown},indent=2))
