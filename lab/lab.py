#!/usr/bin/env python3
"""Static reference token counts and development-only alias search."""
import argparse
import csv
import hashlib
import json
import platform
from collections import Counter
from functools import lru_cache
from importlib.metadata import version
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CANDIDATES = json.loads((ROOT / "candidates.json").read_text())
BASE = {k: v[0] for k, v in CANDIDATES.items()}
MODES = ("ru", "en", "compact", "atl_base", "atl_opt")
COMMON = "Solve the task. Give a brief derivation and final answer."
MEANINGS = dict(goal="objective", given="input facts", must="hard requirement",
                unknown="missing information", infer="derived statement",
                check="verification", result="answer")


def load_cases():
    rows = [json.loads(line) for p in sorted((ROOT / "data").glob("*.jsonl"))
            for line in p.read_text(encoding="utf-8").splitlines()]
    if len(rows) != 1000 or len({r["id"] for r in rows}) != 1000:
        raise ValueError("Expected 1000 unique case IDs")
    for r in rows:
        for k, value in r["atl"] + r["atl_trace"]:
            if k not in BASE or not value:
                raise ValueError("Invalid ATL field")
    counts = Counter((r["family"], r["split"]) for r in rows)
    if len(counts) != 20 or any(s not in ("dev", "test") or n != (60 if s == "dev" else 40)
                                for (f, s), n in counts.items()):
        raise ValueError("Invalid split")
    return rows


def render(fields, aliases, sep=": "):
    return "\n".join(aliases[k] + sep + v for k, v in fields)


def instruction(aliases, sep):
    dictionary = "; ".join(aliases[k] + "=" + MEANINGS[k] for k in BASE)
    return (COMMON + " Use ATL fields, one per line, label followed by "
            + repr(sep) + " then value. Labels: " + dictionary
            + ". Preserve units, constraints, negation and uncertainty. "
              "Operators: => implies; | OR; <= and < inequalities; == equality.")


def texts(row, mode, aliases, sep):
    if mode.startswith("atl_"):
        if mode == "atl_base":
            aliases, sep = BASE, ": "
        return (render(row["atl"], aliases, sep),
                render(row["atl_trace"], aliases, sep), instruction(aliases, sep))
    return row[mode], row[mode + "_trace"], COMMON


def optimize(dev, count, overhead):
    def objective(aliases, sep):
        raw = sum(count(render(r["atl"], aliases, sep))
                  + count(render(r["atl_trace"], aliases, sep)) for r in dev)
        repeats = len(dev) if overhead == "per_case" else 1
        return raw + repeats * count(instruction(aliases, sep))

    aliases, sep = BASE.copy(), ": "
    before = best = objective(aliases, sep)
    for _ in range(3):
        improved = False
        for k, choices in CANDIDATES.items():
            for choice in choices:
                trial = dict(aliases, **{k: choice})
                if len(set(trial.values())) != len(trial):
                    continue
                score = objective(trial, sep)
                if score < best:
                    aliases, best, improved = trial, score, True
        for candidate in (": ", ":"):
            score = objective(aliases, candidate)
            if score < best:
                sep, best, improved = candidate, score, True
        if not improved:
            break
    return aliases, sep, before, best


def evaluate(rows, count, aliases, sep):
    details = []
    for r in rows:
        for mode in MODES:
            p, t, sys = texts(r, mode, aliases, sep)
            details.append(dict(id=r["id"], family=r["family"], split=r["split"],
                                mode=mode, prompt=count(p), trace=count(t),
                                instruction=count(sys)))
    summary = []
    for split in ("dev", "test"):
        for mode in MODES:
            group = [r for r in details if r["split"] == split and r["mode"] == mode]
            p = sum(r["prompt"] for r in group)
            t = sum(r["trace"] for r in group)
            h = sum(r["instruction"] for r in group)
            summary.append(dict(split=split, mode=mode, cases=len(group),
                                prompt=p, reference_trace=t, raw=p+t,
                                total_per_case=p+t+h,
                                total_shared_context=p+t+group[0]["instruction"]))
    return details, summary


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--encoding")
    group.add_argument("--hf")
    parser.add_argument("--revision", help="Exact commit SHA for remote HF tokenizers")
    parser.add_argument("--overhead", choices=("per_case", "shared"), default="per_case")
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    if args.encoding:
        import tiktoken
        tok = tiktoken.get_encoding(args.encoding)
        count = lambda x: len(tok.encode(x, disallowed_special=()))
        meta = {"backend":"tiktoken", "version":version("tiktoken"), "encoding":args.encoding}
    else:
        from transformers import AutoTokenizer
        local = Path(args.hf).is_dir()
        if not local and (not args.revision or len(args.revision) != 40 or
                          any(c not in "0123456789abcdef" for c in args.revision.lower())):
            parser.error("Remote HF tokenizer requires an exact 40-character commit SHA")
        tok = AutoTokenizer.from_pretrained(args.hf, revision=args.revision,
                                            local_files_only=local, trust_remote_code=False)
        count = lambda x: len(tok.encode(x, add_special_tokens=False))
        meta = {"backend":"transformers", "version":version("transformers"),
                "tokenizers_version":version("tokenizers"), "model":args.hf,
                "revision":args.revision}
        if local:
            meta["local_file_hashes"] = {str(p.relative_to(args.hf)):hashlib.sha256(p.read_bytes()).hexdigest()
                                          for p in sorted(Path(args.hf).rglob("*")) if p.is_file()}
    count = lru_cache(maxsize=100000)(count)
    rows = load_cases()
    dev = [r for r in rows if r["split"] == "dev"]
    aliases, sep, before, after = optimize(dev, count, args.overhead)
    details, summary = evaluate(rows, count, aliases, sep)
    args.out.mkdir(parents=True, exist_ok=True)
    with (args.out / "counts.csv").open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=details[0].keys())
        writer.writeheader()
        writer.writerows(details)
    meta.update(python=platform.python_version(), overhead_objective=args.overhead,
                corpus_hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest()
                               for p in sorted((ROOT/"data").glob("*.jsonl"))},
                candidate_hash=hashlib.sha256((ROOT/"candidates.json").read_bytes()).hexdigest(),
                scope="static reference text only; not model reasoning/accuracy; no chat framing")
    report = dict(metadata=meta, aliases=aliases, separator=sep,
                  dev_objective_before=before, dev_objective_after=after, summary=summary)
    (args.out/"report.json").write_text(json.dumps(report, indent=2)+"\n", encoding="utf-8")
    (args.out/"atl-prompt.txt").write_text(instruction(aliases, sep)+"\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
