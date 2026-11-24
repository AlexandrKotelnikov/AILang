"""Optional independent parity check against official Python tiktoken on saved pilot strings.
Run from repository root after obtaining the official vocabulary and installing tiktoken:
python adaptive/parity.py
"""
import json
from pathlib import Path
from collections import defaultdict
import tiktoken

root = Path(__file__).resolve().parent.parent
expected = json.loads((root/"adaptive/token-report.json").read_text(encoding="utf-8"))["results"]
enc = tiktoken.get_encoding("o200k_base")
for folder in ("compression","nano","long"):
    name = "pilot-messages.json" if folder == "compression" else "pilot-report.json"
    data = json.loads((root/folder/name).read_text(encoding="utf-8"))
    rows = data if folder == "compression" else data["rows"]
    stats = defaultdict(lambda: dict(n=0,instruction=0,input=0,output=0,total=0))
    for r in rows:
        s = stats[r["mode"]]
        s["n"] += 1
        for field, key in (("system","instruction"),("user","input"),("output","output")):
            s[key] += len(enc.encode(r[field], disallowed_special=()))
        s["total"] = s["instruction"] + s["input"] + s["output"]
    for mode, values in stats.items():
        for key, value in values.items():
            assert value == expected[folder][mode][key], (folder,mode,key,value,expected[folder][mode][key])
print("Aggregate pilot counts match official tiktoken.")
