# ATL v0.4.6 — Recursive Engine

Infer a,b from 12 calibration observations, then forecast 80–180 states. Two bounded synthetic families: modular affine s'=(a*s+b+u) mod M and clipped accumulation s'=clip(s+a*u+b,0,M). Candidate domain a=1..9, b=-9..9. Generator rejects ambiguous calibration. Formula family is given, not discovered. The recurrence program contains coefficients and forecast length, and relies on the input context for the initial forecast state, input sequence and transition rule.

Example: R:3,-2,120 followed by FINAL: 47 (illustrative only). The compact control uses Replay: a=3,b=-2,n=120. Both delegate trajectory expansion to the same interpreter. Dense requires coefficients, explicit trajectory and final state. Final-only returns just the last state; no certificate. Do not equate final-only with full trace evidence.

## Executed tests
240 generated tasks (60 dev,180 pilot), unique calibration checked by an alternative constraint filter; independent trace replay agrees for every state. 720 valid certificates, 2885 rejected mutations, 240 final-only checks. These are software tests, not model accuracy.

## Static token counts
Independent JavaScript BPE with official o200k_base ranks; 199998 ranks, SHA-256 446a9538cb6c348e3516120d7c08b09f57c36495e2acfffe59a5bf8b0cfb1a2d, three golden sequences passed. Full official Python parity pending. No chat framing, hidden reasoning, inference, tool latency or billing.

| Mode | System | Input | Output | Total |
|---|---:|---:|---:|---:|
| dense | 12870 | 58643 | 48930 | 120443 |
| compact-rec | 15030 | 58643 | 2880 | 76553 |
| atl-rec | 14130 | 58643 | 2160 | 74933 |
| final-only | 9090 | 58643 | 720 | 68453 |

ATL vs dense: 95.59% output, 37.79% total savings; vs equivalent compact recurrence: 25% output, 2.12% total. Final-only is cheaper and is a different output contract. The gain is mostly ordinary program representation and external computation, not a novel language or private reasoning compression. Tasks are deliberately recurrence-friendly and not externally sampled. The verifier effectively solves this small parameter-identification problem, so a direct algorithm baseline is essential for practical usefulness.

## Reproduce
Node 18+ from repository root:
```sh
node recursive/static.mjs /path/to/o200k_base.tiktoken
node recursive/run.mjs --model YOUR_MODEL
mkdir -p results
node recursive/run.mjs --execute --model YOUR_MODEL --out results/recursive-run
```
The vocabulary is obtainable from the official URL or the GitHub mirror niieani/gpt-tokenizer blob fbc14c2e1e71f5f666d5513d8a94da81381fe0be (verify SHA before use). CLI/API integration not executed here. Independent run defaults to dry run, 720 calls per full trial. Primary comparison compact-rec vs atl-rec on verified certificates per million provider tokens; separately compare common final-answer outcomes across all arms. No real inference yet.
