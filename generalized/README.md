# ATL v0.5.4 — Generalized Semantic Verification

## Scope
New deterministic synthetic corpus: 20 tasks for each of six (atom count, maximum clause width) combinations: n=6/8, k=2/3/4. The first generated clause has width k. Satisfiable original formulas only; duplicates in each group rejected by full model set and query identity. Labels are naturally imbalanced (18 T, 30 F, 72 U). This is a development experiment, not held-out LLM evaluation.

For a model set M and every k-subset S of the atom universe, store the allowed assignments on S as a 2^k-bit mask. A candidate is equivalent exactly when all masks and the signed query agree, provided both formulas have width at most k, 1<=k<=n, and use the same ordered atom universe. Proof: if a candidate model falsifies a clause of the reference, extend its clause's variable set to a k-subset. Its restricted assignment is forbidden by the reference but allowed by the candidate, contradicting equality of projections. Apply symmetrically. Empty formulas and contradictory candidates are covered; exact query identity is checked separately. This is a standard bounded-width logical property, not a new mathematical theorem. Even/odd parity on k variables shows order k-1 can fail for k=2,3,4.

## Mutation audit
5,156 mutations: 1,544 equivalent, 3,612 meaning-changing. Deletion, literal sign flip, cyclic atom substitution, random clause addition, and query flip. 120 positive controls; 600 canonical body roundtrips. All required-order checks and bidirectional clause entailment checks agree with exhaustive model equality.

| Audit | Corrupt mutations accepted |
|---|---:|
| Answer only | 3023 |
| Unary projections + query | 1849 |
| Pair projections + query | 632 |
| Triple projections + query | 99 |
| Fourth-order projections + query | 0 |
| Adaptive required order + query | 0 |
| Mutual clause entailment + query | 0 |

No equivalent mutation rejected. Mutations are correlated and deliberately constructed; these are descriptive counts, not real LLM error rates.

## Static o200k_base benchmark
All bodies represent the same satisfying assignments and share the same signed query header. Standard spaced CNF, adjacent ATL clauses, greedily reduced adjacent clauses, dense k-projection masks, model bitmap, and input-only adaptive choice among reduced clauses, masks and bitmap (includes mode prefix). Canonical output is a single label per task. Input serialization is lossless semantically, not necessarily syntactically.

| Representation | System | Input | Output | Total |
|---|---:|---:|---:|---:|
| cnf | 7800 | 4041 | 120 | 11961 |
| atl | 7680 | 3708 | 120 | 11508 |
| reduced | 7680 | 2616 | 120 | 10416 |
| projection | 10200 | 6039 | 120 | 16359 |
| bitmap | 8400 | 2585 | 120 | 11105 |
| adaptive | 13560 | 2259 | 120 | 15939 |

Adaptive chooses reduced clauses 48 times, projections 13, bitmap 59. Compared with plain CNF, adaptive body (including headers/prefixes) saves 44.10% but complete per-task static total is 33.26% higher. Reduced clauses win complete totals (12.92% lower than CNF); no minimum-size guarantee. This is standard redundancy elimination, not a comparison against all optimized standard CNF implementations.

Hypothetical instruction amortization: charging each mode's system string once instead of 120 times gives CNF 4226, ATL 3892, reduced 2800, projections 6244, bitmap 2775, adaptive 2492 tokens. These are arithmetic on measured counts, NOT tokenization of grouped messages. No delimiters, API framing, actual model output, cache or hidden reasoning included. Adaptive is 10.20% below bitmap in this idealized calculation, so the next step should test real grouped strings with a strong fixed-format and full-cost router baseline.

Dense projection size is C(n,k)*2^k raw bits; a full model bitmap requires 2^n bits. Neither dominates in all regimes. Verification needs a gold reference. Enumeration is exponential and no deployment-time latency or CPU benchmark was performed. SAT-based mutual entailment and width-bounded projection are suitable future scalability controls.

## Reproduction
The full official rank vocabulary is available at https://openaipublic.blob.core.windows.net/encodings/o200k_base.tiktoken . In this run the exact contents were obtained through https://api.github.com/repos/tryAGI/Tiktoken/contents/data/o200k_base.tiktoken (a text response in the connected GitHub client); the official SHA-256 446a9538cb6c348e3516120d7c08b09f57c36495e2acfffe59a5bf8b0cfb1a2d and three reference token sequences were verified. The experiment function was executed in JavaScript; standalone Node wrapper not independently executed.

```sh
node generalized/run.mjs /path/to/o200k_base.tiktoken generalized-report.json
```

See report.json for group-level counts and exact totals. No LLM calls or novelty/quality claim. Next: compare actual grouped serialized strings and per-request full-cost routes, then independent translation/inference on frozen external tasks.
