# AILang External Benchmark v1 — preregistered pilot

Original GSM8K test (1,319) and three BBH tasks (250 each): 2,069 source questions. The 100-question balanced pilot uses 25 per category, deterministic hash-ranked sampling, original wording untouched. Source blob identities and sample IDs: manifest.json. See licenses/ for upstream MIT notices. Public benchmarks may have been seen in training; not a fresh holdout. Do not show reference to test models.

## Six arms, same questions and answer-only output

| Arm | Input | Strategy guidance | Questions |
|---|---|---|---:|
| B5 | Compact JSON | No | 100 |
| D5 | AILang record framing | No | 100 |
| R5 | Compact JSON | Yes | 100 |
| A5 | AILang record framing | Yes | 100 |
| C5 | CSV | No | 100 |
| K5 | CSV | Yes | 100 |

AILang in this pilot means lightweight record framing, not semantic compression. All question text is verbatim and losslessly round-trips for all three formats. The guidance is identical across all guided arms. TOON/TRON and Chain of Draft require additional controlled arms using their actual implementations/protocols; not tested here. No hidden chain-of-thought requested. Strategy guidance is a prompt intervention, not direct control of internal reasoning.

## Procedure

Run each prompt in a fresh independent temporary chat outside the project, same model and settings, no tools, reference or prior responses. Randomize order; first pilot order B5, A5, C5, R5, D5, K5. At least 10 independent cycles (rotate/randomize order). For stronger claims use fresh samples and multiple model families. Measure exact input/output text tokens with the same tokenizer; if using API also record usage fields, reasoning tokens, cached input, first-token and total latency. Chat-displayed reasoning time is a separate user-reported measure. Record all trials including malformed/truncated responses. No result claims before observed responses.

Primary comparisons D5-B5 (framing), R5-B5 (guidance), A5-D5 (guidance), A5-R5 (framing), and CSV controls. Report per-category accuracy, strict format success, time and tokens per correct answer; compare paired item outcomes and variation across runs, not independent treatment of all pooled answers. For noninferiority preregister a justified margin and collect enough independent trials; 100 questions is an engineering pilot only.

## Reproduce

Node 18+: `node build.mjs` downloads pinned source blobs, verifies Git SHA-1, reconstructs exact prompts, and exports the full 2,069-question collection and separate answers. Python: `python score.py response.txt`, `python -m unittest test_score.py`. Optional `pip install tiktoken` and `python count_tokens.py response.txt` for o200k_base counts (not billing or hidden tokens). Initial artifacts built through GitHub connector; Node downloader and Python scorer supplied for local execution, not executed in that environment. JavaScript encoding roundtrip tested for all six prompts. Exact token counts unavailable at preparation.

Original source repositories: https://github.com/openai/grade-school-math and https://github.com/suzgunmirac/BIG-Bench-Hard. Do not train on benchmark data.
