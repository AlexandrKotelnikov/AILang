# AILang semantic benchmark v2 — Tracking Shuffled Objects

Narrow compiler for five known BBH templates, not a general natural-language compressor. Source: pinned BIG-Bench-Hard blob cfff515e5214bed7393f390235824c08259a41f7. Upstream MIT notice in ../external_benchmark_v1/licenses/BBH.txt. Original question text retained in audit data; projected wire drops irrelevant narrative and renames actors/items by stable option IDs. Compiler uses question text only, never target; exact template reconstruction is required, otherwise return null (caller should fall back to raw). Independent forward and reverse state algorithms verify projected semantics against official target; these algorithms are for testing, not used to construct prompts. Templates inspected across the source pool before sampling; fresh instances relative to stage 5, not an unseen-family or training-contamination-free holdout.

Accepted 250/250; 225 eligible after excluding previous pilot IDs; seeded shuffle selects 100. Four negative fixtures rejected; CSV and ATL projected wires round-trip. All accepted cases matched both state solvers. Reject/fallback coverage explicitly recorded in manifest. No claim that omitted prose is always irrelevant outside these templates.

## Four arms

B6 raw CSV original wording; C6 compact English with the same semantic projection; D6 semantic CSV; E6 semantic ATL. Identical output labels and tasks. Common semantic header charged in full, no answer included. C6/D6 distinguish benefits of semantic projection from notation. B6 vs C6 also changes explicit state representation, so not a pure string-compression comparison.

| Arm | Input chars | o200k_base tokens | Token saving vs B6 |
|---|---:|---:|---:|
| B6 | 65655 | 16020 | 0.00% |
| C6 | 14250 | 5214 | 67.45% |
| D6 | 3519 | 1848 | 88.46% |
| E6 | 3118 | 1384 | 91.36% |

Token counts computed using existing independent JS encoder with SHA-256-verified ranks, 3 golden vectors passed. No API or hidden reasoning usage. Stage 5 token follow-up in stage5_token_followup.json. Compression computation is deterministic and local, but runtime not measured; account for compiler/decoder cost in end-to-end comparisons.

Run B6, E6, C6, D6 in separate temporary chats with same model/settings, then randomized repeated cycles. Do not include answers, prior runs, repo links, or tools. Record displayed reasoning time, full latency and provider usage if possible. Score with python score.py response.txt. Run node verify.mjs for pilot verification; connector executed the equivalent JS checks, not the Node/Python command-line scripts. No inference results yet. Public benchmark may be in model training; high accuracy may mask differences. Future work: harder permutation counts, unseen templates, ambiguity-preserving GSM8K and cross-model replication.
