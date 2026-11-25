# Permutation protocol (experimental)

Use only explicit independent swap tasks with a known source representation. Do not infer a permutation from ambiguous natural language.

Input: JSON array of records with exactly id, initial, swaps, query. IDs match [A-Za-z0-9_-]+ and are unique. Initial is a permutation of the first N uppercase letters, N=2..26. Each swap is a pair of different actor labels. Query is one actor. All labels must lie in the initial alphabet. At least one swap.

```json
[{"id":"P001","initial":"CAB","swaps":["AB","BC"],"query":"B"}]
```

CSV control: P001,CAB,AB,BC,B. Packed candidate: P001:CAB/ABBC/B. Both decode exactly to the same input. Output contract: ID=LETTER in input order; for this example P001=B. The CLI validates source and both roundtrips and selects by measured modeled input cost. It does not solve tasks or guarantee the model will solve them.

```sh
node scripts/optimize.mjs --mode permutation --input /local/permutations.json --ranks /local/o200k_base.tiktoken --skill-loaded
```

Stage 7 tested fixed unconditional swaps, not arbitrary logic. Conditional operations from Stage 8 remain research-only until evaluated.
