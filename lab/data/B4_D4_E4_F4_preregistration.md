# AILang B4 / D4 / E4 / F4 — preregistered 2x2 pilot

1000 questions per arm, identical cases and scoring, seed 20261126 (a seed label, not execution date). No identical full case from B3/D3. 34 inventory, 33 scheduling, 33 decisions, ten questions each. New unsigned positional inventory fields remove signed-zero ambiguity; the pressure/temperature LIMIT predicate is explicitly parenthesized. Both are prospective changes, not proven fixes. Two reference implementations agree on all 1000 answers.

| Arm | Input | Output |
|---|---|---|
| B4 | natural English | JSON object array |
| D4 | compact AILang | JSON object array |
| E4 | compact AILang | case lines (10 values per line) |
| F4 | natural English | case lines (10 values per line) |

Run in independent temporary chats outside the project, same model and reasoning setting, no reference files, tools or code. Paste only the designated prompt. Record timestamps at submission, first visible output and completion; record displayed reasoning duration separately if available. Prefer API runs with exact usage, including reasoning and cached input tokens where returned. Do not assume the tokenizer corresponds to the model's internal encoding. Do not substitute time between messages for actual latency. Save the first response as-is; do not retry failed or truncated outputs silently.

For a first block use B4, E4, D4, F4; subsequent blocks use the orders E4,F4,B4,D4; D4,B4,F4,E4; F4,D4,E4,B4, then repeat or randomize in balanced blocks. At least 10 runs per arm recommended; first block alone is exploratory. A fixed dataset estimates run-to-run variability, not cross-dataset generalization; use new seeds and holdout tasks for that. Outputs and reference are public after publication: do not allow retrieval during tests.

Score `python score.py B4 response.json` or `python score.py E4 response.txt` (substitute arm). Report strict-format pass independently from item accuracy; missing or duplicate items count as incorrect. Reordered correct responses retain item accuracy but fail strict format. Seven tests: `python -m unittest -v test_score`. Regenerate: `python generate.py`. Install tiktoken and obtain official o200k_base ranks if needed for exact text token counts; without it metrics report unavailable. Tokenization of reference outputs is a proxy, not a measured generation cost.

Compare D4-B4 and E4-F4 for input effect, F4-B4 and E4-D4 for output effect; interaction = (E4-F4)-(D4-B4). For a lower-is-better metric a negative difference indicates a reduction. Report absolute values, paired differences and uncertainty across runs/cases. Do not treat 1000 correlated questions as 1000 independent observations. Predefine accuracy noninferiority margin (proposed 0.5 percentage points, exploratory until agreed); require confidence intervals before claiming noninferiority. Record format failure and truncation rates. Hidden reasoning compression requires API usage data or a different direct test, not inferred from visible text.

The canonical compact reference has 100 lines, 4038 characters; canonical minified JSON 28300. Reference character savings are deterministic, not experimental model outcomes. Actual response format and token usage must be recorded. No B4/D4/E4/F4 model responses have been collected yet.

## Pre-run artifact fingerprints (SHA-256)

```json
{
  "B4": "0381f97a9c1fc8d2945cac32334c7de0445c42dab3b2f7e3c89e0bdbfe47d8e5",
  "D4": "3d1134a76c3ed3a71b5db075794bb12cd66b74a625cc635929377e6d50ca6734",
  "E4": "6980bdea0f408b3fd8e07668f39179a19433a7704a6ceb00941befeac6cf4b8d",
  "F4": "7f45ace5dc52aba2e10c5887c9e6945c829eb4a3630c062582316ba15b84762a",
  "reference": "c168121741132d29f682fd682ee2f4fe7933fe93cbd380a85df0a95234cc96d4",
  "cases": "0fa1cd7508908112f981f2527bdac27010ee911ce7260592c90bbe5cb86e6ba7"
}
```

Pre-run text character counts: B4 15250 / 28300, D4 7485 / 28300, E4 7520 / 4038, F4 15285 / 4038 (input / canonical reference output). Token counts not measured locally. Full prompts, reference, cases, generator and scorer are distributed in the experiment ZIP and intentionally not included in this preregistration commit; publish them together with observed responses after the runs.
