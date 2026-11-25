# B3 / D3 chat pilot — 2026-11-25

Paired benchmark of natural English (B3) versus compact AILang notation (D3), 1,000 questions per arm, same ordered JSON output schema. Reported model GPT-6.2. Dataset seed 20261125; 34 inventory, 33 scheduling, 33 decision cases, 10 questions each.

| Metric | B3 | D3 |
| --- | ---: | ---: |
| Correct | 1000/1000 | 998/1000 |
| Inventory | 340/340 | 339/340 |
| Scheduling | 330/330 | 330/330 |
| Decisions | 330/330 | 329/330 |
| Strict format | pass | pass |
| Input characters | 15223 | 7623 |
| Output characters | 28302 | 28299 |
| Visible tokens (reported) | 17490 | 14885 |
| Input tokens (reported) | 7435 | not supplied |
| Output tokens (reported) | 10055 | not supplied |
| Reasoning tokens / timing | not supplied | not supplied |

Input character reduction: 49.9245%. Reported visible-token reduction: 14.8942% (2605 tokens). Accuracy difference: -0.2 percentage points. D3 tokenizer reported o200k_base; B3 tokenizer not confirmed. Token counts are user-supplied, not independently reproduced and not API usage telemetry. No claims about reasoning speed, compute savings, statistical noninferiority, or independent contexts (the protocol requested them but execution conditions were not independently verified). One run per arm; correlated queries within scenarios. Both complete outputs are archived. Public answer keys must not be provided to test models.

D3 discrepancies: I0310 (expected 15, actual 0) and S3309 (expected LIMIT, actual RUN). No causal interpretation of the errors is established.

Reproduce scoring with `python score.py B3_answers.json D3_response.json`. Exact original prompts, reference, raw responses, comparison metrics, protocol and empty measurement template included. Structured cases reconstructed from D3 prompt. Original generator was included in the local ZIP but is not in this commit. Earlier pilot: [D/B2/D2](../chat_pilot_2026-11-25_D_B2_D2.json).

Next: independent randomized repeated runs with new seeds, fixed settings, explicit timing and tokenizer/API telemetry, and separate output-format ablation.
