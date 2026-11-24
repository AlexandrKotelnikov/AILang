# ATL v0.4.1 — Adaptive Evolution and Complex Reasoning

## Token counts (not character estimates)
The vocabulary was retrieved from the public mirror `niieani/gpt-tokenizer/data/o200k_base.tiktoken`, Git blob `fbc14c2e1e71f5f666d5513d8a94da81381fe0be`. Its SHA-256 matches the official OpenAI tiktoken definition: `446a9538cb6c348e3516120d7c08b09f57c36495e2acfffe59a5bf8b0cfb1a2d`. The independent JavaScript byte-pair encoder implements the o200k_base pre-tokenization pattern and rank merges for ordinary text. Three official cookbook token-ID sequences match exactly. It is not the official tiktoken library; Unicode regex and special-token edge cases may differ. Optional parity.py compares aggregate pilot counts with official Python tiktoken. Full parity has not been run. These are static text counts with instruction overhead, not measured API usage, chat framing, hidden reasoning or independent model accuracy.

| Pilot/mode | Draft total | ATL total | Total reduction |
|---|---:|---:|---:|
| v0.3.1 Adaptive | 903 | 956 | -5.87% |
| v0.3.2 Nano | 1008 | 901 | 10.62% |
| v0.3.2 Nano-ASCII | 1008 | 880 | 12.70% |
| v0.3.2 Nano-State | 1008 | 917 | 9.03% |
| v0.3.3 Nano | 1385 | 1325 | 4.33% |
| v0.3.3 Replay | 1385 | 2779 | -100.65% |

Full results are in token-report.json. The pilots use different task sets and manually authored or templated text, not independent generations.

## Adaptive routing
Mine codebooks from development **input prompts only** (no solutions or answers). A global codebook and per-family codebooks compete with identity. Search add/drop/replace mutations against measured token cost. Freeze the bank before evaluation. The router selects the cheapest encoding on incoming prompt text, including the entire dictionary instruction; no test-answer information is used. Every selected encoding is round-tripped. The identity option guarantees no increase in the measured static input-token objective by construction. It does not guarantee actual inference accuracy, no overhead in model responses, or runtime/billing savings. Mixed order interleaves case indices, domain order groups by family. One instruction is charged per hypothetical batch; per-case input strings are counted separately (no message framing/separators). Routing computation is not included. No model inference was run.

| Batch | Order | Old test prompt+instruction tokens | Routed tokens | Saving | Compressed groups |
|---:|---|---:|---:|---:|---:|
| 1 | mixed | 12087 | 12087 | 0.00% | 0/400 |
| 1 | domain | 12087 | 12087 | 0.00% | 0/400 |
| 10 | mixed | 7047 | 7047 | 0.00% | 0/40 |
| 10 | domain | 7047 | 6847 | 2.84% | 20/40 |
| 100 | mixed | 6543 | 6207 | 5.14% | 4/4 |
| 100 | domain | 6543 | 5988 | 8.48% | 4/4 |

On 36 new complex test cases the router uses identity in every tested group; no input-token saving on these new tasks. This is a successful fallback, not proof of generalization. The bank was trained only on the older synthetic corpus.

## Harder tasks
72 deterministic synthetic tasks (36 dev / 36 test), six families, 12 variants each. No external benchmark; answers are checked by two implementations (some share the same mathematical identity).
- shortest path with a one-use edge discount, expanded state graph (Bellman-Ford vs Dijkstra)
- 12-item, two-resource subset selection with dependencies and exclusions (4096 subsets vs pruned recursion)
- three-class Bayesian inference with five conditional tests (exact rational)
- 18–22 job precedence graphs with time lags (forward vs memoized evaluation)
- 64–152-day inventory with supply outages and demand spikes (two state update forms)
- 12-variable Boolean entailment (4096 assignments vs pruned DFS).

The test split is unseen parameter variants, not independent unseen families. The code generates answers and validates reference computations; no model accuracy has been measured. The new independent-inference harness compares Draft, Nano and Nano-ASCII on the same 36 test prompts; 108 calls by default, dry run unless explicitly executed. Do not pass answer data in the API request.

## Reproduce
Download the official rank file from https://openaipublic.blob.core.windows.net/encodings/o200k_base.tiktoken . Do not commit the vocabulary; the encoder checks its hash.
```sh
node adaptive/run.mjs /path/to/o200k_base.tiktoken
python -m pip install tiktoken
python adaptive/parity.py
node adaptive/complex-run.mjs --model YOUR_MODEL
mkdir -p results
node adaptive/complex-run.mjs --execute --model YOUR_MODEL --out results/complex-run
```
The last command needs a compatible local/remote API (see reasoning/README.md). Outputs are actual provider usage only when supplied. Independent calls and Python parity are not yet executed.

## Next gate
Freeze the tasks and compare independent model generations; track exact answer accuracy, format, quality of derivations, provider usage incl. reasoning tokens where available, and latency with a predeclared noninferiority margin. Evolve semantically equivalent operator expressions rather than only repeated strings, with executable reference verification and input-only training. Test against strong Draft and program-aided controls.
