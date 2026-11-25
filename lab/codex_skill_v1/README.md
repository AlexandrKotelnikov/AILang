# Codex experiment 1 — ATL Context v0.2.0

**Status: protocol ready; no Codex runs yet.** This is a product/host pilot, separate from the Stage 7 reasoning benchmark.

## A. Setup (macOS / Linux)

Use a fresh checkout. Run in Terminal, not in the Codex chat. Git, Node.js 18+, Python 3 and an authenticated Codex CLI are needed. If Codex is missing, install it using the official guide at https://learn.chatgpt.com/docs/non-interactive-mode or https://developers.openai.com/codex/ and sign in. Do not use an elevated sandbox or paste credentials.

```bash
git clone https://github.com/AlexandrKotelnikov/AILang.git
cd AILang
git rev-parse HEAD
node --version
codex --version
codex exec --help
mkdir -p .agents/skills
test ! -e .agents/skills/atl-context && cp -R skills/atl-context .agents/skills/
mkdir -p "$HOME/.cache/atl-context"
curl --fail --location https://openaipublic.blob.core.windows.net/encodings/o200k_base.tiktoken -o "$HOME/.cache/atl-context/o200k_base.tiktoken"
node --test skills/atl-context/tests/route.test.mjs
```

For an existing installation, follow [INSTALL](../../docs/INSTALL.md) instead of overwriting. Record commit, versions, chosen model, reasoning effort, account type, enabled MCP servers/skills, sandbox and date. Keep settings the same in every arm. Do not change other installed skills between runs.

## B. Host smoke test

Start a fresh `codex` session in the repository. Paste this exact prompt (the dollar prefix is literal):

```text
$atl-context
Use the installed ATL Context v0.2.0 skill. Read lab/codex_skill_v1/fixture.json and use the local rank file at ~/.cache/atl-context/o200k_base.tiktoken (expand ~). Run the installed skill's optimize.mjs in batch mode with --skill-loaded. Do not alter any repository file, download anything, or solve the tasks. Return the CLI's actual JSON output, including golden, rank_sha, roundtrip, counts, mode, baselineInputTokens, selectedInputTokens and savingsPercent. If execution fails, show the exact error; do not estimate counts.
```

Inspect the visible tool call: it must use .agents/skills/atl-context/scripts/optimize.mjs, and the result must have golden=3, roundtrip=true, selectedInputTokens <= baselineInputTokens. A successful response alone is not proof that the script ran. A failure is a result, not a reason to silently replace the arm.

Negative checks (fresh sessions): run the same prompt on `negative.json` and check that cold routing retains the control (run without --skill-loaded); try an ordinary short unrelated question without explicit invocation and inspect whether the skill was needlessly loaded. Separately, a nonexistent rank path must fail nonzero, with no invented counts. Do not require a particular warm mode on small inputs: measured cost decides.

## C. Representation experiment (three arms, identical tasks)

A = flat JSON control, B = strong grouped natural-language control, C = format selected by ATL Context using real ranks. All three carry the same 24 independent synthetic questions and exact source text. The preparation script builds prompts from the frozen fixture, checks rank checksum and golden vectors, records static input counts for the actual prompt strings and both cold and warm routing. The B control is not chosen after seeing model results.

```bash
RUN=$(mktemp -d)
export RUN
node lab/codex_skill_v1/prepare.mjs "$HOME/.cache/atl-context/o200k_base.tiktoken" "$RUN"
cat "$RUN/static.json"
```

Use a fresh empty Git workspace for inference, outside the source tree so the solver cannot read the reference answers or load project skills. The user's global skills/settings can still affect results; record them. Use the same workspace and settings for all arms. No tools should be used to answer, and no access to the source repository or gold. The preparation runs locally once, not as part of the solver turn. This isolates encoding effects; it is NOT a direct measurement of installed-skill end-to-end savings. For an agent-mediated workflow measure the preparer agent's usage and wall time separately and add to C's totals, including retries.

```bash
mkdir "$RUN/solver"
git -C "$RUN/solver" init -q
# Replace with the exact available Codex model identifier (same for all runs).
MODEL=YOUR_MODEL
export MODEL
# In bash/zsh; run one arm at a time, fresh codex exec each time.
(
  cd "$RUN/solver"
  for spec in 1:A 1:B 1:C 2:C 2:A 2:B 3:B 3:C 3:A; do
    cycle=${spec%:*}; arm=${spec#*:}; tag="${cycle}-${arm}"
    { time codex exec --model "$MODEL" --json - < "$RUN/$arm.txt" > "$RUN/$tag.jsonl"; } 2> "$RUN/$tag.stderr"
    status=$?
    printf '%s\n' "$status" > "$RUN/$tag.exit"
  done
)
python3 lab/codex_skill_v1/score.py "$RUN"
```

Each process can consume your Codex quota. Start with the smoke test and one A/B/C cycle before doing all nine; to run only cycle 1, shorten the loop list. Do not resume a previous thread. If CLI flags differ, consult `codex exec --help` and record the exact command. Inspect any tool invocation, failed event, nonzero exit or unexpected output. Keep failed runs in the report, not as omitted data. No automatic retries. Do not send credentials or raw logs containing private paths or unrelated personal data when sharing results.

## D. Analysis

Primary: exact answer per unique ID (duplicates, missing IDs and wrong values count as errors). Secondary: ordered JSON format, actual CLI turn usage when present (input, cached input, output and reasoning output separately), static text tokens, wall time and tool usage. Reasoning output is a subset of output when so reported; do not add it twice. Cached tokens are not necessarily billed the same; usage is not dollar cost. No usage field = null, not zero.

Compare C against A **and** B. Claim savings only against the specific measured control; if B wins, report it. Three runs on the same 24 cases are repeats, not 72 independent tasks. The cases are public synthetic retrieval tasks, so this is a host pilot, not an independent accuracy or reasoning benchmark. End-to-end claims need preparer costs and actual host usage as well.

Send: smoke JSON/error, static.json, score.json, model/settings and wall times. Review/redact logs before sharing. Record the Git commit to make the run reproducible.

Official references: https://learn.chatgpt.com/docs/non-interactive-mode and https://developers.openai.com/blog/eval-skills.
