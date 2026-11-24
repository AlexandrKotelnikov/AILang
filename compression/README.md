# ATL v0.3.1 — Compression Research

The core question is whether ATL reduces total model work at comparable quality, not merely output length. This pilot uses eight multi-step synthetic tasks with independently computed reference answers and five modes. All modes receive identical English task text and the same final-answer protocol. Baseline uses concise sentences; Draft is a strong terse-English/equation control; Native uses familiar notation; Micro adds four short field labels; Adaptive exposes only a relevant rule (three of eight tasks), or otherwise familiar notation. No hidden reasoning is accessed.

## Single-chat pilot
`pilot-responses.json` contains 40 visible, checkable solution summaries authored in a single ChatGPT conversation. They are not 40 independent model API calls. The comparison is exploratory, not blinded; mode prompts were not executed separately. All reference answers are recomputed by arithmetic, truth-table enumeration, pair enumeration, DAG evaluation or exhaustive subset search. Final answer correctness is not proof of derivation correctness. The tasks and modes are development data, not a held-out benchmark. Character lengths count Unicode code points, including newlines, excluding chat framing. No token counts or internal compute savings are measured. The earlier v0.3 runner and data remain unchanged.

Run:
```sh
node compression/pilot.mjs
python -m pip install tiktoken
python compression/count_tokens.py --encoding o200k_base
```
The second script measures the exact recorded text with a selected tokenizer, not actual inference or API usage. It includes complete per-task instruction overhead. Report both output and total savings against Draft, not only verbose baseline. No claims of model quality or actual token savings are made from this pilot. Next: randomized independent API calls, unfamiliar tasks with verified answers, paired accuracy uncertainty and provider-reported reasoning tokens when available.

## Independent API follow-up

```sh
node compression/run.mjs --model YOUR_MODEL
mkdir -p results
node compression/run.mjs --execute --model YOUR_MODEL --out results/compression-run
```

40 independent requests by default; set --trials and explicitly increase --max-calls if needed. Same endpoint/key rules as the v0.3 runner; see ../reasoning/README.md. Output records include provider-reported token counts only when available and paired complete-case comparisons against both Baseline and Draft. No hidden reasoning text is stored. This runner is implemented but not yet validated against a live provider. Results are development data, not independent holdout evidence.
