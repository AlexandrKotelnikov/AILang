"""Tokenize fixed pilot strings, not model execution."""
import argparse
import json
from pathlib import Path
import importlib.metadata

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--encoding", default="o200k_base")
    args = p.parse_args()
    import tiktoken
    enc = tiktoken.get_encoding(args.encoding)
    rows = json.loads((Path(__file__).parent / "pilot-messages.json").read_text(encoding="utf-8"))
    stats = {}
    for r in rows:
        s = stats.setdefault(r["mode"], dict(instruction=0, prompt=0, output=0))
        for k, field in (("instruction","system"),("prompt","user"),("output","output")):
            s[k] += len(enc.encode(r[field], disallowed_special=()))
    for s in stats.values():
        s["total"] = s["instruction"] + s["prompt"] + s["output"]
    print(json.dumps(dict(encoding=args.encoding, tiktoken=importlib.metadata.version("tiktoken"),
                         scope="fixed text only; no chat framing or hidden reasoning",
                         modes=stats), indent=2))
if __name__ == "__main__":
    main()
