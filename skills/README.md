# ATL Context Skill — product MVP 0.1.0

Installable Agent Skills-format prototype derived from the AILang research series (base 400cb53). The research version remains ATL v0.5.4. This MVP implements exact-context deduplication and input-only routing, not universal natural-language compression or hidden thought control.

## Try it
Copy `skills/atl-context` into a compatible skill directory (for example `.agents/skills/atl-context` in a Codex project). Invoke `$atl-context` explicitly where supported. The skill is intended for independent tasks; ordinary conversation should remain ordinary. See [batch protocol](atl-context/references/batch.md) for local execution. No credentials, downloads, or API calls are built in. Host installation has not been tested.

## Evaluation
[Static report](atl-context-eval/report.json) and [exact fixture](atl-context-eval/cases.json). The current run checks 25 assertions and three golden tokenizer sequences. The skill file is 226 static o200k_base tokens. Cold and warm estimates are separate; instructions and payload included, host/tool overhead and real model output excluded. No accuracy or cost claim.

## Product gates
1. Test the CLI and actual installation on Codex and other Agent Skills-compatible hosts.
2. Freeze an external batch corpus and compare flat JSON, grouped natural language, native host reuse and ATL, with real provider input/output/optional reasoning usage, latency, correctness and retry cost. Require non-inferiority of correctness before claiming a gain.
3. Add a typed semantic compiler only for domains with an independently verified source representation. Introduce checkpoint/state and agent handoff formats with provenance and uncertainty, separate from hidden reasoning.
4. Review licensing and distribution; no license is selected by this MVP. Do not promise compatibility or savings until verified.
