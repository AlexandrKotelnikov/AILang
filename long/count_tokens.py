"""Static tokenizer comparison of exact Long Reasoning pilot messages."""
import argparse
import json
from pathlib import Path
from importlib.metadata import version

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--encoding", default="o200k_base")
    args = p.parse_args()
    import tiktoken
    enc = tiktoken.get_encoding(args.encoding)
    report = json.loads((Path(__file__).parent / "pilot-report.json").read_text(encoding="utf-8"))
    stats = {}
    for row in report["rows"]:
        s = stats.setdefault(row["mode"], dict(instruction=0, prompt=0, output=0))
        for key, field in (("instruction", "system"), ("prompt", "user"), ("output", "output")):
            s[key] += len(enc.encode(row[field], disallowed_special=()))
    for s in stats.values():
        s["total"] = s["instruction"] + s["prompt"] + s["output"]
    draft = stats["draft"]
    for s in stats.values():
        s["total_saving_vs_draft_pct"] = 100 * (1 - s["total"] / draft["total"])
    print(json.dumps(dict(encoding=args.encoding, tiktoken=version("tiktoken"),
                         scope="fixed texts; excludes framing, hidden reasoning and API usage",
                         modes=stats), indent=2))
if __name__ == "__main__":
    main()
