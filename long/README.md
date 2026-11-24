# ATL v0.3.3 — Long Reasoning / Replay

## Hypothesis
Represent long sequences using recurrence, state compression, and formula fusion rather than materializing every intermediate state. A compact executable description can preserve reproducibility without storing a full log. This is **not** a claim that a language model performs fewer internal computations.

## Modes
- Draft: strong control, terse English notes or equations (may also use recurrences).
- Nano: compact familiar notation, no custom dictionary.
- Replay: a bounded, task-specific DSL with four whitelisted operations. It can be interpreted without executing arbitrary code. Its entire grammar is included in each system instruction.

The four operations are AFF(n,x,a,b,m), BR(n,x,m), STOCK(n,s,c,r,a,b,m), DAG(n,a,m,p,q). See core.mjs for exact integer semantics. Operands are nonnegative integers <= 1,000,000; 1<=n<=10,000; moduli and DAG offsets must be positive, and starting stock must be <= capacity. No arbitrary expressions, eval, files or network operations are allowed by the interpreter. The specific operations are deliberately limited to the benchmark families, not a general programming language.

## Pilot
Four task families, each at 32, 128 and 512 steps; 12 cases, 2,688 reference state transitions. Reference answers are computed programmatically. Draft, Nano and Replay responses are **deterministic template-rendered solution representations**, not independent LLM responses. Replay checks operation identity, exact operands, every reconstructed state against a separately implemented reference loop, and the submitted final answer. The reference and interpreter implement the same recurrences; this is a software consistency check, not independent evidence of model reasoning quality. The input tasks and templates were developed together.

| Mode | Final answers matching reference | Exact replays | Instruction chars | User chars | Output chars | Total chars |
|---|---:|---:|---:|---:|---:|---:|
| draft | 12/12 | N/A | 1500 | 1810 | 977 | 4287 |
| nano | 12/12 | N/A | 1308 | 1810 | 798 | 3916 |
| replay | 12/12 | 12 | 6156 | 1810 | 349 | 8315 |

Nano total reduction vs Draft: 8.7%. Replay output reduction vs Draft: 64.3%, but total reduction: -94.0%. A negative reduction is an increase. All figures are Unicode code points, not model tokens. Full state log sizes at each scale are diagnostic, not a fair baseline for terse derivations. A recurrence can already compress a long sequence under Draft. Longer execution does not inherently amortize dictionary overhead if Draft also uses a recurrence.

## Reproduce
Node 18+:
```sh
node long/pilot.mjs
node long/run.mjs --model YOUR_MODEL
```
The second command is dry-run only. For real inference (compatible endpoint, optional ATL_API_KEY), create a results parent and explicitly run:
```sh
mkdir -p results
node long/run.mjs --execute --model YOUR_MODEL --out results/long-run
```
36 requests by default. Same endpoint and credential rules as reasoning/README.md. Real API evaluation reports final-answer accuracy separately from strict replay validation. Provider-reported reasoning usage is optional and not added twice. No live inference has been performed.

Static tokenizer comparison:
```sh
python -m pip install tiktoken
python long/count_tokens.py --encoding o200k_base
```
Counts exact fixed strings including instructions, but excludes chat framing. tiktoken is unavailable in the current chat environment; no token counts have been obtained.

## Next gate
Freeze this development set. Add independent unseen tasks, compare against a strong Draft control with matched answer/evidence requirements, run independent LLM calls and measure provider total/visible/reasoning token usage where available. Report failures and uncertainty. For tool-assisted replay experiments, account for any extra model calls and external computation, and compare to equally tool-enabled Draft. Do not equate a replayable program with reduced model inference work.
