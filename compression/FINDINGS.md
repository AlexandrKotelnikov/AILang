# Pilot findings — development only

All eight independently computed reference answers match the 40 authored visible solutions. This is a format demonstration, not an accuracy estimate for independent model generation. No model calls or tokenizer measurements were performed.

| Mode | Output code points | Instruction code points | User code points | Total code points |
|---|---:|---:|---:|---:|
| baseline | 1216 | 1248 | 1309 | 3773 |
| draft | 585 | 1304 | 1309 | 3198 |
| native | 502 | 1568 | 1309 | 3379 |
| micro | 431 | 1888 | 1309 | 3628 |
| adaptive | 413 | 1757 | 1309 | 3479 |

The adaptive mode has the shortest visible output, but Draft has the lowest total text length when the instruction is repeated per task. Adaptive saves 172 output code points compared with Draft and adds 453 instruction code points. Its net cost is 281 additional code points. Native is closest to Draft in total length among ATL variants. This indicates the need to reduce fixed protocol overhead and test longer, unfamiliar tasks. Characters are not tokens; conclusions about actual computational cost are not supported. No assumption of free repeated system messages or cached context is made.

Next research: compare a minimal no-dictionary notation instruction against the Draft control on genuinely unseen, longer tasks, including multiple logical operations in a single response. Count actual model usage; include failures, uncertainty intervals and a prespecified accuracy threshold. Do not tune on that held-out dataset.
