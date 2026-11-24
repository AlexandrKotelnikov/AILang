# ATL v0.4.3 — Verifiable Reasoning Certificates

This experiment moves from input compression to compact, executable evidence for **visible** reasoning. It does not access or control a closed model's private reasoning. A certificate is a typed witness checked by deterministic code; the checker is not provided to the model during inference.

## New task families
- Maximum directed network flow (7–14 vertices): certificate is a sparse list of positive indexed edge flows and the source side of a cut. Capacity bounds, conservation and equality of flow value to cut capacity prove optimality. Reference solver: Edmonds–Karp; independent oracle: exhaustive cut enumeration.
- Weighted interval scheduling (14–28 jobs): certificate is the vector of optimal values for every job prefix. Verify every recurrence including predecessor compatibility, base case and final value. Independent oracle uses time-indexed DP.

200 deterministic synthetic instances, 100 per family (40 development, 160 pilot). The families and seed generator are authored for this experiment, not externally sourced or a blinded independent holdout. The pilot has no model outputs.

Three arms use exactly the same user input and ask for the same mathematical witness:
- english: compact labeled flow/cut or indexed DP values;
- compact: same flow/cut format, but DP uses a simple comma-separated list without redundant indices;
- atl: canonical positional JSON certificate prefixed by C:.

Example for a three-vertex chain with capacity 2 on both edges:
```
C:[[[0,2],[1,2]],[0]]
FINAL: 2
```
The cut proves no better flow exists. The certificate must not be accepted just because the final answer matches.

## Executed checks
200/200 reference solver and independent oracle agreements; 600/600 formatted reference witnesses accepted (all three arms); 1,406 deliberately invalid variants rejected; 4 additional edge fixtures passed; 200 checks confirmed correct final answers can be counted separately from invalid witnesses. These are software checks, not LLM accuracy measurements.

## Static token pilot
Rank-based independent o200k_base tokenizer, official SHA-256 verified, three golden sequences passed. Counts include system instruction, user input, reference output. No chat framing, hidden reasoning, API usage or model inference. Official Python tokenizer parity is still pending.

| Mode | System | Input | Output | Total |
|---|---:|---:|---:|---:|
| English | 8480 | 27156 | 11912 | 47548 |
| Compact (primary control) | 8160 | 27156 | 8520 | 43836 |
| ATL | 7200 | 27156 | 8280 | 42636 |

Compared with the strong compact control, ATL saves 2.82% visible reference output tokens and 2.74% total static tokens. Compared with labeled English, it saves 30.49% output and 10.33% total. Per-family compact-to-ATL totals: flow 23148 -> 22508; interval 20688 -> 20128. Most of the labeled-English gain is eliminated by simply omitting redundant indices; most remaining total savings arise from system instruction wording. No general language or internal reasoning compression claim is justified.

## Reproduce
From repository root, Node 18+:
```sh
node certificate/static.mjs
node certificate/static.mjs /path/to/o200k_base.tiktoken
node certificate/run.mjs --model YOUR_MODEL
mkdir -p results
node certificate/run.mjs --execute --model YOUR_MODEL --out results/certificate-run
```
Rank file: https://openaipublic.blob.core.windows.net/encodings/o200k_base.tiktoken . See adaptive/README.md for tokenizer limitations and reasoning/README.md for API configuration. Dry run by default; 480 independent calls at one trial. Use ATL_API_KEY environment variable when needed. Never commit private notes or keys. The CLI reuses the existing provider usage accounting; it has not been exercised against a real endpoint.

Primary comparison: compact vs ATL, verified certificates per million provider tokens (including incorrect attempts with known usage). Also report final answer accuracy, proof validity, format compliance, paired completed usage-covered groups, latency, and provider-reported reasoning tokens if available (subset of output, never add twice). No automatic repair or retries. Missing usage may bias efficiency; report coverage.

## Next gate
Freeze the syntax and measurement protocol, run independent inference, then evaluate externally sourced or independently generated new tasks. For a later confirmatory study, predeclare a paired noninferiority procedure and threshold (e.g. 2 pp) before observing results, with enough independently sampled tasks and family-level reporting. Do not claim improved accuracy or hidden token savings based on static oracle outputs. A future executable operator language could express repeated state transitions more compactly, with checks and controlled tool-aided baselines.
