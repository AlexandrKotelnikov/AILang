# ATL v0.4.4 — Executable Repeat Operators

Lossless run-length representation of verifiable weighted-interval scheduling prefix certificates. This is a conventional compression technique, not a new mathematical compression algorithm. The experiment tests its usefulness as a bounded language operator.

Example:
```
D:12*6,18*3,24
FINAL: 24
```
The decoder expands the first line to ten integer states. A repetition count is the total number of occurrences, not the number of additional occurrences. A count must be at least two. The maximum expanded length is fixed by the task (at most 200); oversized, negative, malformed or mismatched runs are rejected. The verifier recomputes the prefix recurrence and checks every state and final value. No arbitrary code execution.

## Experiment
240 newly generated weighted-interval scheduling instances with 60–180 jobs; 80 per profile (sparse, mixed, dense), 20 development and 60 pilot per profile. All are synthetic and from one task family, not externally sourced or blinded. Compared formats:
- dense: comma-separated integer prefix values.
- compact-rle (primary control): identical run semantics using value x count without spaces.
- atl-rle: value*count, with shorter prefix.

Reference encoder chooses repetition when it reduces character length. Equal semantics across RLE arms: do not attribute their common gain to ATL syntax.

## Executed checks
240/240 independent time-indexed oracle agreements; 720/720 lossless format roundtrips and certificate checks; 2,407 malformed/tampered variants rejected, three empty-vector checks. Core executed in JavaScript during development. Node CLI and real inference have not been executed in this environment.

## Static results (180 pilot tasks)
ASCII characters, not tokens. No chat framing, model generation or hidden reasoning.

| Format | System | Input | Output | Total |
|---|---:|---:|---:|---:|
| dense | 39600 | 264569 | 97505 | 401674 |
| compact-rle | 55440 | 264569 | 55453 | 375462 |
| atl-rle | 51840 | 264569 | 55093 | 371502 |

ATL vs dense: 43.50% output-character savings, 7.51% total-character savings. ATL vs compact-rle: 0.65% output and 1.05% total savings. In the dense profile total characters increase from 144260 to 148220; routing matters. No token improvement or LLM accuracy claim is supported by these counts.

| Profile | dense output | compact-rle output | ATL output |
|---|---:|---:|---:|
| sparse | 29653 | 5417 | 5297 |
| mixed | 32081 | 14265 | 14145 |
| dense | 35771 | 35771 | 35651 |

## Reproduce
From repository root, Node 18+:
```sh
node operators/static.mjs
node operators/static.mjs /path/to/o200k_base.tiktoken
node operators/run.mjs --model YOUR_MODEL
mkdir -p results
node operators/run.mjs --execute --model YOUR_MODEL --out results/operator-run
```
Use the official rank file and existing independent tokenizer (see adaptive/README.md); optional tokenizer mode was not executed in this environment, where the rank file and network were unavailable. The runner is adapted from certificate/run.mjs and remains untested against a real endpoint. Dry run defaults to 540 independent requests when executed. See reasoning/README.md for endpoint configuration and ATL_API_KEY. Primary comparison: compact-rle vs atl-rle; secondary: dense vs atl-rle. Count all provider-reported usage for valid and invalid attempts, report coverage, accuracy and proof validity separately.

## Next gate
Run exact tokenizer measurement, mock endpoint smoke test and independent inference on frozen cases. Add an input-only router with a compact baseline and evaluate on new families. Explore delta and arithmetic-progression operators only if they reduce total provider tokens without loss of verified accuracy. Do not claim hidden-reasoning compression from output representation.
