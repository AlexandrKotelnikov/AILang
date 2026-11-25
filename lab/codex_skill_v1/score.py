import collections,json,pathlib,sys
root=pathlib.Path(__file__).resolve().parent
out=pathlib.Path(sys.argv[1])
gold=json.loads((root/"reference.json").read_text())
ids=[r["id"] for r in gold]
report=[]
for p in sorted(out.glob("[123]-[ABC].jsonl")):
    events=[]; invalid_lines=0
    for line in p.read_text().splitlines():
        try: events.append(json.loads(line))
        except ValueError: invalid_lines+=1
    complete=[e for e in events if e.get("type")=="turn.completed"]
    messages=[e["item"].get("text","") for e in events if e.get("type")=="item.completed" and e.get("item",{}).get("type")=="agent_message"]
    text=messages[-1] if messages else ""
    try: parsed=json.loads(text)
    except ValueError: parsed=None
    rows=collections.defaultdict(list)
    if isinstance(parsed,list):
        for r in parsed:
            if isinstance(r,dict) and isinstance(r.get("id"),str): rows[r["id"]].append(r.get("answer"))
    correct=sum(rows[r["id"]]==[r["answer"]] for r in gold)
    ordered=isinstance(parsed,list) and all(isinstance(r,dict) and set(r)=={"id","answer"} for r in parsed) and [r["id"] for r in parsed]==ids
    status_file=p.with_suffix(".exit")
    exit_code=int(status_file.read_text().strip()) if status_file.exists() else None
    usage=complete[-1].get("usage") if len(complete)==1 else None
    tool_types={"command_execution","mcp_tool_call","web_search","file_change","dynamic_tool_call","tool_call"}
    tools=[e.get("item",{}).get("type") for e in events if e.get("type")=="item.completed" and e.get("item",{}).get("type") in tool_types]
    failures=[e.get("type") for e in events if e.get("type") in {"turn.failed","error"}]
    report.append({"run":p.stem,"correct":correct,"total":len(gold),"ordered_exact_schema":ordered,"usage":usage,"exit":exit_code,"completed_events":len(complete),"invalid_event_lines":invalid_lines,"tools":tools,"failures":failures,"protocol_valid":exit_code==0 and len(complete)==1 and not tools and not failures and invalid_lines==0})
result={"runs":report,"unique_tasks":len(gold),"notes":"Scores are descriptive; inspect tool logs manually. Wall time recorded separately in .stderr. Missing usage stays null."}
(out/"score.json").write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n")
print(json.dumps(result,indent=2,ensure_ascii=False))
