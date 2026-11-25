import json
from pathlib import Path
from collections import Counter
p=Path(__file__).parent
ref=json.loads((p/'reference.json').read_text())
expected={x['id']:x['answer'] for x in ref}
for arm in ('B4','D4','E4','F4'):
    if arm in ('B4','D4'):
        rows=json.loads((p/(arm+'_response.json')).read_text())
    else:
        rows=[]
        for line in (p/(arm+'_response.txt')).read_text().splitlines():
            key,body=line.split(':')
            vals=body.split(',')
            assert len(vals)==10
            for i,v in enumerate(vals,1):
                rows.append({'id':f'{key}{i:02}', 'answer':v if key.startswith('S') else int(v)})
    assert len(rows)==1000 and [x['id'] for x in rows]==list(expected)
    wrong=[x for x in rows if type(x['answer']) is not type(expected[x['id']]) or x['answer']!=expected[x['id']]]
    print(arm, len(rows)-len(wrong), '/', len(rows), wrong)
