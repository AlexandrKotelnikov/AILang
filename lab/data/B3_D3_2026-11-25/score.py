"""Strict JSON scoring. Usage: python score.py B3_answer.json D3_answer.json"""
import json, sys
from pathlib import Path
from collections import Counter
ref=json.loads(Path(__file__).with_name('reference.json').read_text())
expected={x['id']:x['answer'] for x in ref}

def score(path):
    try:
        data=json.loads(Path(path).read_text(encoding='utf-8'))
    except (OSError,ValueError) as exc:
        return {'file':str(path),'strict_format':False,'error':str(exc),'accuracy_pct':None}
    if not isinstance(data,list):return {'file':str(path),'strict_format':False,'error':'Expected JSON array','accuracy_pct':None}
    valid=[x for x in data if isinstance(x,dict) and set(x)=={'id','answer'} and isinstance(x['id'],str)]
    counts=Counter(x['id'] for x in valid)
    matches={x['id']:x['answer'] for x in valid if counts[x['id']]==1 and x['id'] in expected}
    good={k for k,v in matches.items() if type(v)==type(expected[k]) and v==expected[k]}
    wrong=[{'id':k,'expected':v,'actual':matches.get(k),'reason':'missing_or_duplicate' if k not in matches else 'incorrect'} for k,v in expected.items() if k not in good]
    order_ok=[x['id'] for x in valid]==list(expected)
    types_ok=all(x['id'] in expected and type(x['answer'])==type(expected[x['id']]) for x in valid)
    return {'file':str(path),'strict_format':len(data)==len(valid)==len(ref) and order_ok and types_ok,'returned':len(data),'correct':len(good),'total':len(ref),'accuracy_pct':100*len(good)/len(ref),'family_correct':{f:sum(k.startswith(f) for k in good) for f in 'IGS'},'missing_or_duplicate':sum(k not in matches for k in expected),'unknown_ids':[k for k in counts if k not in expected],'wrong':wrong}
if __name__=='__main__':
    if len(sys.argv)<2:raise SystemExit('Usage: python score.py response.json [response2.json ...]')
    print(json.dumps([score(p) for p in sys.argv[1:]],ensure_ascii=False,indent=2))
