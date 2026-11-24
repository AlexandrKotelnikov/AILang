# ATL-Nano v0.3.2

Zero custom dictionary. Use compact familiar mathematical/logical notation instead of mandatory fields or macro names. Prefer ASCII when tokenizer measurements justify it. Do not assume chained implications have a unique meaning; parenthesize compound propositions, preserve constraints, units, uncertainty, and sufficient derivation evidence. If notation is ambiguous, use ordinary words. Nano-State is a candidate for repeated transitions, not a new formal programming language.

## Modes

All modes receive the same user input and common instruction: Solve accurately; give a checkable derivation, then a final line FINAL: <answer>.

| Mode | Additional instruction |
|---|---|
| draft | Use terse English notes or equations. |
| nano | Use compact notation. |
| nano-ascii | Use compact ASCII notation. |
| nano-state | Use compact notation; combine repeated transitions. |

## Exploratory chat pilot
Eight new development tasks: branching logic, conditional loop, two-stage separation, directed shortest path, inventory, constrained subset selection, conditional probability, and compound balance. Each reference answer is computed by a separate deterministic algorithm. The 32 visible summaries were authored in one ChatGPT conversation, not produced by 32 independent model calls; exact final-answer scoring is not verification of every derivation. The tasks and examples were developed together and are not blinded or held out. All counts below are Unicode code points, not tokens. Instruction is counted per task, plus unchanged user text and output; excludes chat framing. No hidden reasoning, compute, latency or actual model usage is measured.

| Mode | Correct | Instruction | User | Output | Total | Total reduction vs Draft |
|---|---:|---:|---:|---:|---:|---:|
| draft | 8/8 | 952 | 1463 | 853 | 3268 | 0.0% |
| nano | 8/8 | 824 | 1463 | 472 | 2759 | 15.6% |
| nano-ascii | 8/8 | 872 | 1463 | 452 | 2787 | 14.7% |
| nano-state | 8/8 | 1064 | 1463 | 468 | 2995 | 8.4% |

The observed advantage applies only to these authored texts. Nano and Nano-ASCII are candidates for further testing; shorter Unicode representations may tokenize poorly. No claim of actual token savings or model accuracy is made.

## Reproduce
Node.js 18+:
```sh
node nano/pilot.mjs
node nano/run.mjs --model YOUR_MODEL
```
The latter is a dry run. For real independent API calls use a compatible server, create the results parent, and execute explicitly:
```sh
mkdir -p results
node nano/run.mjs --execute --model YOUR_MODEL --out results/nano-run
```
Default: 32 requests. For multiple trials increase --max-calls explicitly. See reasoning/README.md for endpoint/key requirements. Provider usage is recorded only when supplied. No hidden reasoning text is collected.

## Measure actual tokenization of the fixed strings
```sh
python -m pip install tiktoken
python nano/count_tokens.py --encoding o200k_base
python nano/count_tokens.py --encoding cl100k_base
```
This static tokenizer benchmark is separate from live inference. No token counts were obtained in the chat environment. Compare ASCII and Unicode and include the instruction on every task; token counts of separately encoded strings exclude chat framing. Preserve a strong Draft control. Future v0.3.3: preregister a held-out multi-step evaluation and run independent API trials before making performance claims.
