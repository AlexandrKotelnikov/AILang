# Stage 7: synthetic permutation reasoning pilot

Stage 6 is closed without time metrics. Stage 7 tests representation under independently varied task complexity. The same 27 newly generated tasks appear in four arms: B7 verbose English, C7 compact English, D7 semantic CSV, E7 compact ATL. Labels and semantics are identical. All initial item mappings and swap sequences are generated before reference solving. Xorshift32 seed 2026112507; 3 tasks in each of 9 actor/swap cells (5/10/20 actors × 5/20/100 swaps). No prompts contain answers. Do not share this README, generator, reference or other arms in test chats.

## Protocol
Use separate fresh temporary chats, same model/settings, no tools. Copy one prompt file verbatim per run. Cycle 1 D7 B7 E7 C7; cycle 2 E7 C7 B7 D7; cycle 3 C7 D7 E7 B7. This order is fixed before inference, not fully counterbalanced. Record raw response, model, settings, optional displayed reasoning and wall time, usage if API available; missing metrics are null. Score with python score.py response.txt. Primary outcome: per-arm accuracy (including missing/duplicate IDs as incorrect), paired differences per case and complexity cell. Secondary: visible input token counts, output formatting, optional time. Repeated runs are not independent tasks. Pilot only; no superiority claim without larger independent replications.

## Static verification
{"dual_oracle_matches":27,"wire_roundtrips":54,"negative_fixtures":3,"nonidentity_initials":27,"unique_tasks":27}. Token counts use the existing independent JS encoder, SHA-256 verified vocabulary and 3 official golden vectors, not model billing. See manifest.json. Equivalent JS checks executed before commit; verify.mjs and score.py are included for local reproducibility (not executed as CLI in this session).

| Arm | Input tokens | Reduction vs B7 |
|---|---:|---:|
| B7 | 18440 | 0.00% |
| C7 | 6119 | 66.82% |
| D7 | 2672 | 85.51% |
| E7 | 1600 | 91.32% |

No model accuracy results yet. Public pilot instances are not a secret holdout. Generate a fresh withheld seed for confirmatory testing. This is a task-family benchmark, not a general semantic compiler.
