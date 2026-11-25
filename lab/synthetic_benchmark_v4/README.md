# Stage 8: state-dependent permutation pilot

Stage 7 closed with ceiling accuracy. Stage 8 tests conditional state transitions rather than unconditional swaps, preventing the simple backward single-query shortcut. Three output labels per task; 12 independently generated instances across 8/16 actors and 40/120 operations (3 per cell). All four arms use identical operations, initial states and queries; S is unconditional, L/G compare current item labels. No answer in prompts.

Use fresh temporary chats, same model/settings, no tools, one prompt verbatim per run. Fixed order: D8 B8 E8 C8; E8 C8 B8 D8; C8 D8 E8 B8. Do not share generator, reference, or other arms in test chats. Record model/settings and raw output. Exact sequence accuracy is primary; per-item accuracy and complexity secondary. Missing/duplicate IDs incorrect. Time/API usage optional. Repeated runs are not independent tasks. This is a public pilot, not confirmatory evidence. Static counts pending; run count_tokens.py with tiktoken installed.

Dual independent state representations agree on 12 references; both machine formats round-trip all 12 cases. No model runs yet.
