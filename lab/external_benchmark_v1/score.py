"""Strict answer-only scoring. python score.py response.txt"""
import sys,json,re
from pathlib import Path
from decimal import Decimal
from collections import Counter
ROOT=Path(__file__).resolve().parent
REF=json.loads((ROOT/"pilot_reference.json").read_text(encoding="utf8"))
NUM=re.compile(r"-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?\Z")
OPT=re.compile(r"\([A-F]\)\Z")
def score(raw,ref=REF):
    lines=raw.splitlines()
    if len(lines)!=len(ref):
        return {"strict":False,"error":"line count","received":len(lines),"expected":len(ref)}
    wrong=[]; counts=Counter(); totals=Counter()
    for line,r in zip(lines,ref):
        k,sep,v=line.partition("=")
        if not sep or k!=r["id"] or not (NUM.fullmatch(v) if k.startswith("M") else OPT.fullmatch(v)):
            return {"strict":False,"error":"id/order/value syntax","expected_id":r["id"]}
        ok=Decimal(v)==Decimal(r["answer"]) if k.startswith("M") else v==r["answer"]
        totals[k[0]]+=1; counts[k[0]]+=int(ok)
        if not ok: wrong.append({"id":k,"expected":r["answer"],"actual":v})
    return {"strict":True,"correct":sum(counts.values()),"total":len(ref),"by_category":{k:{"correct":counts[k],"total":v} for k,v in totals.items()},"wrong":wrong}
if __name__=="__main__":
    print(json.dumps(score(Path(sys.argv[1]).read_text(encoding="utf8")),indent=2))
