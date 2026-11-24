"""Count exact static ordinary-text tokens using official tiktoken, not API usage."""
import argparse,json,subprocess
from pathlib import Path
from importlib.metadata import version
import tiktoken
p=argparse.ArgumentParser()
p.add_argument("--encoding",default="o200k_base")
a=p.parse_args()
root=Path(__file__).resolve().parent
raw=subprocess.check_output(["node",str(root/"messages.mjs")],text=True)
enc=tiktoken.get_encoding(a.encoding)
count=lambda s:len(enc.encode(s,disallowed_special=()))
rows=[]
for r in json.loads(raw):
    instruction,input_=map(count,[r["system"],r["user"]])
    rows.append({k:r[k] for k in ("id","split","family","mode")}|dict(instruction=instruction,input=input_,total=instruction+input_))
summary=[]
for split in ("dev","test"):
    for family in ("all",*sorted({r["family"] for r in rows})):
        for mode in ("draft","compact","atl-input","atl-io"):
            g=[r for r in rows if r["split"]==split and r["mode"]==mode and (family=="all" or r["family"]==family)]
            summary.append(dict(split=split,family=family,mode=mode,n=len(g),**{k:sum(r[k] for r in g) for k in ("instruction","input","total")}))
print(json.dumps(dict(encoding=a.encoding,tiktoken=version("tiktoken"),scope="Static text only; per-request instruction; no framing/output/API usage",summary=summary,rows=rows),indent=2))
