# ATL v0.4.2 — Semantic Compiler

This experiment replaces phrase substitutions with a family-specific positional JSON intermediate representation. It is an input compiler for the six existing synthetic families, not a universal language or a model-trained tokenizer. The schema is sent on every ATL request. There is no answer or solution in the wire format. The semantics are defined by schema instructions; roundtrip verifies structured data and oracle consistency, not a model's understanding.

Four arms, fixed before independent inference:
- draft: original English prompt + terse answer notes.
- compact: manually compact English with the same answer-note instruction; strong control.
- atl-input: canonical ATL array + schema, same answer-note instruction.
- atl-io: identical ATL input + compact ASCII derivation instruction (visible output only).

All 72 cases passed data roundtrip and both reference solvers; malformed wire fixtures rejected. Since the schemas and compact control were designed after the existing families were known, the old 36-case test split is a regression/pilot, not an independent unseen-family evaluation.

## Measured static ASCII character counts (36 test cases)
| Mode | Instructions | Input | Total |
|---|---:|---:|---:|
| draft | 5148 | 15183 | 20331 |
| compact | 5148 | 11570 | 16718 |
| atl-input | 13956 | 6322 | 20278 |
| atl-io | 18096 | 6322 | 24418 |

Characters are NOT tokens. These figures exclude output and chat framing. Compare against compact, not merely draft. Per-family breakdown is in char-report.json. Official tiktoken counting script is included but was not run in the development environment (library unavailable); no model inference or hidden reasoning token measurements were made.

## Run from root
```sh
node semantic/static.mjs
python -m pip install tiktoken
python semantic/count_tokens.py --encoding o200k_base
node semantic/run.mjs --model YOUR_MODEL
mkdir -p results
node semantic/run.mjs --execute --model YOUR_MODEL --out results/semantic-run
```
144 independent requests at one trial, dry run unless --execute. See reasoning/README.md for API configuration; use an environment variable for the API key. Do not commit keys or private results. To run multiple trials set --trials and explicit --max-calls. Reports include actual provider usage where available. No hidden text is stored.

## Decision protocol
Primary comparator compact vs atl-input (input effect), secondary atl-input vs atl-io (output instruction effect). Also report draft. Compare attempts including failures, paired completed usage-covered groups, format compliance and total tokens per correct answer. Report missing usage, model ID, output cap, temperature and failures. Provider-reported reasoning tokens, if available, are a subset of output, not added. Static savings do not establish real-inference savings.

The 36 test cases cannot establish a 2 percentage point noninferiority margin: even zero observed losses in 36 independent paired cases gives a one-sided 95% exact upper bound of 1-0.05^(1/36)=7.98% on the loss-event probability. For zero losses and one predeclared comparison, at least 149 independent cases are needed to reach 2%. Repeated trials on the same case are not independent cases. Before claiming a benefit, freeze the compiler, evaluate new task families and independently sampled instances, predeclare a paired confidence procedure and include stronger controls. No tuning on a final holdout. A correct final answer does not by itself establish a correct derivation.

## Scope and next work
Internal trusted synthetic inputs only; decoder checks canonical shape, arity and integer leaves, not all semantic constraints. For a general compiler, add typed validation, new families with independently sampled instances, and an executable compact certificate language with verification. A closed model's hidden reasoning cannot be controlled or inspected by this language; evaluate only exposed metrics.
