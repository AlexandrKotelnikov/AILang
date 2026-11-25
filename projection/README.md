# ATL v0.5.3 — Semantic Projection Audit

This is a gold-referenced verifier experiment, not model inference or a new compression grammar. Replicates the v0.5.2 deterministic fixtures and mutation suite.

## Result
120 tasks, 7,680 truth checks, 5,120 mutations, 3,063 meaning-changing mutations, 120 positive controls. No false rejection of equivalent mutations.

| Audit | False accepts | Rate among corrupt mutations | Tasks with at least one false accept |
|---|---:|---:|---:|
| Original answer only | 1801 | 58.80% | 120 |
| Answer and exact query identity | 1761 | 57.49% | 120 |
| All unary projections and query identity | 328 | 10.71% | 52 |
| All pair projections and query identity | 0 | 0% | 0 |

## Why pair projections suffice for 2-CNF
For each pair of atoms, record which of its four possible value assignments extend to a satisfying model of the full formula. If two 2-CNF formulas over the same universe (at least two atoms) have identical pair projections, each clause of either formula holds in every model of the other: a falsified binary clause would exhibit a pair value forbidden by the first formula; unit clauses follow by extending the variable with another atom. Thus the model sets coincide. The converse is immediate. Query identity is checked separately. Empty model sets are covered by the same argument. This is a standard logical consequence of bounded clause width, not a priority claim.

For six atoms, 15 pair masks of four bits encode the signature (60 raw bits, before any metadata); this is not a tokenizer measurement or a claim that a signature is smaller than every formula. The signature needs a gold reference and satisfiability checks. It is not a proof of accurate translation from arbitrary natural language.

Boundary: even and odd parity on three variables each admit every assignment to every pair but have disjoint full model sets; both are representable by 3-CNF. Pair checks are therefore not sufficient for general 3-CNF or FOL.

## Reproduction
```sh
node projection/run.mjs > projection-report.json
```
The experiment function was executed in JavaScript and verified against v0.5.2 aggregate counts; standalone Node execution not independently performed. See report.json. The corpus is the same development corpus, not held-out. Mutations are correlated; no LLM accuracy, billed usage, token compression or timing claims.

Next: freeze an external held-out logical translation set with independent gold annotations; compare model-generated representations using exact semantics, answer quality and billed token/cost measurements. Separate source translation, verification and downstream reasoning costs.
