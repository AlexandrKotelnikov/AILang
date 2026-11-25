# Adaptive / compact chat pilot follow-up (2026-11-25)

Original 24-task pilot: see CHAT-PILOT.md and chat-pilot-observed-2026-11-25.json. A/B/C each have 24/24 semantic gold matches in one user-reported trial. A/B raw JSON validity is not verified.

## D and E, original pilot

- D: chat-pilot-compact.txt, a manually reviewed typed representation, 493 o200k_base tokens vs B=713. Accuracy pending. It is NOT a generic lossless text encoder.
- E: chat-pilot-adaptive.txt, selected from five reversible generic layouts by exact whole-prompt token count. E chose natural, identical to B; it adds no independent treatment, so no new E run is needed except a replication. The router is a prototype, not yet integrated into the installed skill.
- Exact counts and vocabulary provenance: chat-pilot-adaptive-tokens.json.

## New 120-task development benchmark

Run structured-pilot-v2-natural.txt and structured-pilot-v2-compact.txt in independent clean temporary chats outside the project, with identical model and reasoning effort, no additional messages or tools, randomized order, and ideally five repetitions per arm. Do not provide the scorer, source, gold, links, or prior answers to solver chats. Save unmodified model outputs; log model, effort, time, run order, and any errors. Neither prompt includes the answer key. The benchmark is public and synthetic, NOT a private held-out benchmark. Keep future confirmatory tasks private until scoring.

Natural = 1378; compact = 1001 static o200k_base tokens (27.36% fewer). Both share rules, case parameters, and question templates; no artificially repeated question prose in the natural control. The comparison measures typed representation given structured inputs, not free-text extraction cost.

From repository root:
```sh
node skills/atl-context-eval/structured-pilot-v2.mjs --self-test
node skills/atl-context-eval/structured-pilot-v2.mjs --score answer.json
node skills/atl-context-eval/structured-pilot-v2.mjs --ranks /local/o200k_base.tiktoken
```

Do not repair invalid JSON in the strict score. Record parse errors as protocol failures; semantic transcription can be scored separately, with provenance. Report accuracy per domain, paired task differences, strict format success, latency, and static prompt length. No claim of reasoning compression, provider usage savings, or noninferiority is justified. Include output/reasoning/retries and compiler costs in a future API experiment; pre-register a noninferiority margin and use fresh tasks.

The exact dictionary was obtained from tryAGI/Tiktoken Git blob fbc14c2e1e71f5f666d5513d8a94da81381fe0be and verified against the official o200k_base SHA-256 and three golden token sequences. Source code self-test was executed via the JavaScript tool environment, not the Node CLI or official Python tiktoken.
