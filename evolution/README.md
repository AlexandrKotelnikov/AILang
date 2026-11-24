# ATL v0.4 — Evolution Engine

## Scope

A first **deterministic codebook evolution** engine for existing compact English reference messages, not an LLM-trained language. Automatically mine recurring phrases from development data, test candidate dictionary mutations (add/drop/replace), accept only strictly lower measured total cost, and freeze the dictionary for test. Identity (no codebook) is always the starting candidate and can win. No language-model weights or hidden reasoning are accessed.

The codec uses `~i~` to denote the exact expansion at zero-based index i, and escapes a literal tilde as `~~` when a nonempty dictionary is active. Longest match takes precedence, expansions are not recursively decoded, malformed or unknown codes fail closed. With an empty dictionary, the codec is identity. No code execution. A lossless round-trip is a software property, **not evidence that an LLM can understand or generate the codes**.

## Experiment

Existing v0.2 corpus: 600 development cases and 400 test cases, ten synthetic families. Each case contributes its existing compact English prompt and reference derivation. Candidate mining uses development only; top 32 repeated contiguous fragments are ranked by a character-frequency heuristic (also used to shortlist candidates in token mode). Up to eight dictionary entries, deterministic greedy local search; this does not guarantee the global optimum. Cost includes the complete dictionary/usage instruction plus encoded prompt and trace, with one instruction per hypothetical batch of 1, 10, or 100 cases. The same common instruction is charged to the identity control. No chat framing, task separators, or actual repeated API usage are modeled. These are static text batches, not a claim that API messages are free or that model context is larger. Corpus references are authored synthetic strings, not live generations.

| Hypothetical batch | Identity total chars | Evolved total chars | Test reduction | Dictionary entries |
|---:|---:|---:|---:|---:|
| 1 | 56966 | 56966 | 0.00% | 0 |
| 10 | 32126 | 32126 | 0.00% | 0 |
| 100 | 29642 | 26842 | 9.45% | 3 |

Each configuration round-trips all 2,000 prompt and trace strings exactly; only batch 100 learns a nonempty dictionary in the character experiment. The dictionary contains phrases common in the benchmark; some phrases come from reference answers, so do not use this exact codebook to claim unbiased model accuracy. The next inference evaluation should derive any input codebook from training prompts alone, or explicitly control for answer leakage. Do not tune against the reported test split.

## Unseen-family stress test

For each of ten families, search a new dictionary using 540 dev cases from the other nine families, then measure on the 40 test cases of the excluded family. Pay the full dictionary once per test fold (actual 40 cases). This is not an independent external benchmark. Results:

| Excluded family | Reduction (chars) |
|---|---:|
| constraints | -5.70% |
| discount | -9.99% |
| disjunction | -11.55% |
| equation | -11.55% |
| implication | -7.86% |
| interval | -13.14% |
| proportion | -8.63% |
| uncertainty | -4.76% |
| units | -12.48% |
| weighted | -10.31% |

Aggregate: 30056 -> 32623 code points (-8.54% reduction). Negative values mean expansion. This quantifies how a family-specific dictionary can fail under distribution shift.

## Reproduce

Node 18+; no dependencies for the character proxy:
```sh
node evolution/run.mjs --self-test
node evolution/run.mjs --out results/evolution-chars.json
node evolution/family-audit.mjs
```
For real static token counts, install and pin js-tiktoken in your environment (record the installed version for reproducibility):
```sh
npm install --no-save --package-lock=false js-tiktoken
node evolution/run.mjs --encoding o200k_base --out results/evolution-o200k.json
node evolution/run.mjs --encoding cl100k_base --out results/evolution-cl100k.json
```
The token backend is implemented but was not run here: no tokenizer package or network access to retrieve it. It measures encoded fixed strings, not model API usage. The report records the encoding, input hashes and code hash. Pin the installed package version separately. A dictionary optimized by character length need not save tokens.

## Decision gate

Proceed to actual inference only after token counts and a leakage-controlled design. Compare plain Draft, Nano and evolved codebook with matched inputs/output requirements. Independent calls, provider total token usage and reasoning token usage where reported, paired final-answer accuracy, decoding validity and failure rate, latency, and all additional encoder/decoder/tool costs. Test genuinely unseen task families and noninferiority at a prespecified accuracy margin. Evolution of semantic operations and agent-generated macros remains future work. Character-only improvements do not establish model compute savings.
