import json,re,sys
from pathlib import Path
r=json.loads(Path(__file__).with_name("reference.json").read_text())
a=Path(sys.argv[1]).read_text().splitlines()
if len(a)!=len(r) or any(not re.fullmatch(re.escape(x["id"])+r"=\([A-E]\)",s) for x,s in zip(r,a)):
    print(json.dumps({"strict":False,"received":len(a),"expected":len(r)}))
else:
    wrong=[{"id":x["id"],"expected":x["answer"],"actual":s.split("=")[1]} for x,s in zip(r,a) if s.split("=")[1]!=x["answer"]]
    print(json.dumps({"strict":True,"correct":len(r)-len(wrong),"total":len(r),"wrong":wrong},indent=2))
