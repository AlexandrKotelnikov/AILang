# ATL v0.3 — Reasoning Engine

A real-inference evaluation harness for a user-selected OpenAI-compatible chat completion endpoint. No API calls occur by default. No provider-specific compatibility or model performance has been validated yet. Node.js 18+; no npm dependencies.

## Experimental design

Same model, same task, same requested numeric/truth/option answer, same output cap and temperature. Five modes: baseline (ordinary English), draft (short English, not a replication of Chain of Draft), atl-r (ATL output), atl-macro (ATL plus macro dictionary), atl-full (ATL input/output plus macros). The first four share identical user input. The instructions differ intentionally; actual provider prompt usage includes their overhead. Macro definitions are fixed, not tuned against test results. The 1,000 v0.2 cases are synthetic parameter variants of ten families. They do not establish general reasoning ability.

Macros MP, MT, DS, AC, DA encode standard logic rules or invalid inference checks (see macros.md). Generated visible notes are optional for storage; no hidden reasoning content is collected. A macro premise audit is a narrow check on recognized calls in the benchmark's implication/disjunction cases, not a formal proof checker or full derivation verifier.

## Run from repository root

```sh
node reasoning/run.mjs --self-test
node reasoning/run.mjs --model YOUR_MODEL --per-family 2
mkdir -p results
node reasoning/run.mjs --execute --model YOUR_MODEL --per-family 2 --out results/dev-run1
```

Default endpoint: http://127.0.0.1:8000/v1/chat/completions. For a compatible remote server supply --endpoint with its actual HTTPS chat completions URL and set ATL_API_KEY through the environment (never commit a key). Some servers require --max-field max_completion_tokens, or reject temperature; adapters for those servers may be needed. No automatic retries, streaming, or parallel requests. Dry run prints exact number of planned calls and sum of output caps, not a cost estimate. Default 2 per family * 10 families * 5 modes = 100 requests; --max-calls is an explicit safety cap; --per-family 1 makes 50. Output directory must be new and its parent must exist. Use a distinct directory for each run. Local model IDs are server-specific.

Use --split test only after freezing experimental conditions. Example: --split test --per-family 40 --trials 1 --max-calls 2000. This is a within-template holdout, not unseen families. --save-notes stores visible derivations, off by default. Records do not include hidden reasoning_content or API keys. The harness sends only synthetic benchmark prompts to the configured endpoint.

## Outputs

config.json: model, endpoint, selected IDs, corpus/code SHA-256, decoding controls.
records.jsonl: per attempt status, exact answer, correctness, latency, provider-reported input/output/total and optional reasoning token counts, macro audit.
summary.json: per mode and per family accuracy, token sums, coverage, median latency, TRE and paired complete-case comparisons. TRE = correct tasks / total usage-covered tokens * 1,000,000. Reasoning tokens are a subset of completion tokens when reported, not additional tokens. Missing counts remain null; no estimates based on character counts. Failed/incomplete calls count against attempted accuracy. Usage on transport errors may be missing even when billed. Paired results exclude failures and missing usage; compare coverage as well as savings. No statistical significance or matched-accuracy claim is made from point estimates.

The strict FINAL protocol makes answer scoring deterministic. Numeric values are scored in the requested units; units and derivation correctness are not independently graded. A correct final answer alone does not establish valid reasoning. Truncation marked by the provider is not a success. Test suite uses synthetic API fixtures; it measures software behavior, not language-model accuracy. Real inference results are pending.

## Decision gate before v0.4

Run at least two distinct model families with identical paired tasks and multiple trials. Compare ATL-R against draft and baseline, macros against ATL-R, full against macros. Include total prompt overhead, errors and coverage. Predefine an acceptable accuracy loss (e.g. <=2 percentage points with uncertainty intervals), then evaluate token savings at comparable quality. Add genuinely unseen task families and independently verify reasoning before claiming generality. No tuning on the test split.
