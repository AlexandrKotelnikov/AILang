# Stage 4: input/output compression factorial pilot

Four formats, one shared dataset of 1,000 questions. See [preregistration](../B4_D4_E4_F4_preregistration.md).

| Arm | Input | Output | Correct | Total characters | Reduction vs B4 |
|---|---|---|---:|---:|---:|
| B4 | English | JSON | 1000/1000 | 43550 | 0% |
| D4 | AILang | JSON | 1000/1000 | 35785 | 17.83% |
| E4 | AILang | Compact | 999/1000 | 11559 | 73.46% |
| F4 | English | Compact | 1000/1000 | 19323 | 55.63% |

Canonical character counts exclude paste artifacts. One E4 error: S1004, LIMIT instead of STOP. Mean descriptive savings across the two levels of the other factor: 7764.5 characters for input compression, 24226.5 for output compression. No causal or statistical generalization from one run per arm. No timing or token measurements available. The original raw B4 and D4 pasted files are identical, and independent generation was not independently verified. E4/F4 pasted messages were normalized. F4 values and reference reconstructed from verified matching B4 values (the original local reference was used for scoring before publishing, and its SHA-256 matched preregistration); check against preregistered hash before reuse. Generator and original dataset metadata remain in the local experiment ZIP, not in this commit. Public reference must not be sent to evaluation models.

Reproduce comparison: `python score.py`. This verifies the archived normalized values, not independent generation or raw-format fidelity.
