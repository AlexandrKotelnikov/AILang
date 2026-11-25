# Install and update ATL Context

## Requirements
Git, Node.js 18+ and an Agent Skills-compatible host for agent invocation. The CLI runs independently. The skill does not contact a model, access credentials, or automatically download anything.

1. Clone the repository (choose a fresh path).
2. Copy the entire `skills/atl-context` directory into your project's `.agents/skills/` (Codex) or `.claude/skills/` (Claude Code). For user-wide scope use the corresponding home directory.
3. Obtain the official `o200k_base` rank file if you want measured routing:

```sh
mkdir -p "$HOME/.cache/atl-context"
curl --fail --location https://openaipublic.blob.core.windows.net/encodings/o200k_base.tiktoken -o "$HOME/.cache/atl-context/o200k_base.tiktoken"
```

The CLI verifies SHA-256 `446a9538cb6c348e3516120d7c08b09f57c36495e2acfffe59a5bf8b0cfb1a2d`, the vocabulary size and three golden token sequences. No automatic network calls. Use only for models with a compatible tokenizer; counts are not billing.

4. Start a new agent session. Invoke `$atl-context` in Codex where supported. Other hosts may use different invocation syntax. Host integration is pending verification.

## Test

From repository root:
```sh
node --test skills/atl-context/tests/route.test.mjs
node skills/atl-context/scripts/optimize.mjs --mode batch --input skills/atl-context/examples/batch.json --ranks "$HOME/.cache/atl-context/o200k_base.tiktoken" --skill-loaded
node skills/atl-context/scripts/optimize.mjs --mode permutation --input skills/atl-context/examples/permutation.json --ranks "$HOME/.cache/atl-context/o200k_base.tiktoken" --skill-loaded
```

Unit tests use synthetic cost functions to exercise routing, not measure tokens. The CLI requires the verified rank file. Inspect `selectedInstruction` and `selectedPayload`; submit them together only to an authorized downstream agent. No current-context tokens are recovered.

## Update or remove

Review the changes before updating. Pull the source checkout, back up your existing installed folder, then replace that folder with the full new `skills/atl-context` folder. Do not overlay old files. Restart your agent session. To remove, delete only the installed ATL Context folder. Do not delete the project's other skills.

## Troubleshooting

- Missing or invalid rank file: keep the original input; never estimate exact savings from character counts.
- Small/unrelated request: keep normal language.
- No savings: the selected representation is the control; keep the original if already submitted.
- Host does not discover the skill: check folder and frontmatter; the CLI can still be used directly.

## Codex experiment

Follow the [host and representation pilot](../lab/codex_skill_v1/README.md) to record real Codex results.
