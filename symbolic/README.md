# ATL v0.4.9 — Symbolic Execution Engine
Affine arithmetic modulo 97, three variables, two outputs, 16–48 query rows per task. The compiler performs structural common-subexpression elimination (commutative addition) and dead-code elimination, then extracts affine coefficients. A scalar evaluator and four basis probes independently reconstruct and check coefficients; every query is checked on original and optimized graphs. This is restricted affine arithmetic, not arbitrary symbolic execution.

120 deterministic generated cases (24 development, 96 pilot, same generator); 720 valid output fixtures and 2160 malformed mutations verified across all cases. 3128 pilot query rows. Original 2836 nodes, reduced 1311; CSE removed 153, DCE 1372. Important: dead nodes and repeated expressions are deliberately injected, and the random intermediate block is not required by outputs. Thus 53.8% node reduction is a synthetic stress result, not a general estimate. No external benchmark or independent inference.

## Static counts
Verified o200k_base rank file (199998 mergeable ranks, checksum 446a9538cb6c348e3516120d7c08b09f57c36495e2acfffe59a5bf8b0cfb1a2d, three golden token sequences). Counts include system, input and canonical output separately for each of 96 tasks; no chat framing, runtime overhead, caching or hidden reasoning. Full official tiktoken parity pending.

| Mode | System | Input | Output | Total |
|---|---:|---:|---:|---:|
| full-direct | 10176 | 24236 | 4200 | 38612 |
| reduced-direct | 10176 | 16611 | 4200 | 30987 |
| full-dense | 11424 | 24236 | 576 | 36236 |
| reduced-dense | 11424 | 16611 | 576 | 28611 |
| reduced-sparse | 14016 | 16611 | 544 | 31171 |
| atl-sparse | 14592 | 16611 | 704 | 31907 |

Reduced dense gives 25.90% fewer static tokens than full direct; direct vs coefficient output delegates expansion to a deterministic evaluator. Compare full-direct/reduced-direct and full-dense/reduced-dense to isolate input compression. Reduced-sparse costs more than reduced-dense once instructions are included; ATL adds further overhead. Dense and sparse are standard mathematical encodings, not novel language primitives. All six methods receive queries; removing query lists from symbolic arms would change the comparison and was not done. Reference scores are not model accuracy. The standalone Node scripts have not been run; the core lab ran in a JS runtime against the verified dictionary.

## Reproduce
Obtain the rank file as described in adaptive/README.md.
```sh
node symbolic/static.mjs /path/to/o200k_base.tiktoken
node symbolic/static.mjs /path/to/o200k_base.tiktoken pilot.json --all-fixtures
node symbolic/inference.mjs --fixtures pilot.json --model YOUR_MODEL
ATL_API_URL=https://YOUR_AUTHORIZED_ENDPOINT ATL_API_KEY=YOUR_KEY node symbolic/inference.mjs --fixtures pilot.json --model YOUR_MODEL --execute --limit 5 --out inference.json
```
The full run is 576 sequential calls. Canonical exact-match scoring after trimming whitespace; all errors counted incorrect; provider usage stored unmodified; efficiency omitted if usage incomplete. First N IDs for smoke test only. Default model sampling settings depend on provider; pin model/settings and repeat seeds before confirmatory inference. No endpoint or key available in this experiment.

## Next gate
Use live randomly generated dependency chains and nonlinear/piecewise functions, include query-free symbolic controls as a separate arm, and compare model-only with deterministic solver baseline. Predeclare a paired accuracy noninferiority margin and measure actual provider token usage (including reported reasoning). Never infer hidden reasoning savings from static counts.
