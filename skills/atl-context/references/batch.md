# Batch protocol

Only use for independent tasks sharing the same authorized context. Never combine tenants, permission scopes or trust domains. Identical text does not imply identical permissions.

Input: JSON array of objects with exactly three string fields: id (unique, nonempty), context, task. The tool preserves all characters and original task order, grouping adjacent exact context matches only. Output contains the selected instruction and payload; pass them as separate text fields/messages to an authorized downstream agent, not as shell commands. The agent should return an ordered array of id/answer pairs. Keep the original input as the fallback.

Run from this skill directory:

```sh
node scripts/batch.mjs --ranks /local/o200k_base.tiktoken --input /local/tasks.json --skill-loaded
```

Node.js 18+; use the official rank file from https://openaipublic.blob.core.windows.net/encodings/o200k_base.tiktoken. SHA-256 and three golden vectors are checked. No network or automatic model calls.

Without --skill-loaded, compare plain input with no skill overhead against grouped input including the full SKILL.md. With --skill-loaded, charge the file to both alternatives (a sunk activation cost). The tool counts exact serialized input and instruction strings separately; it excludes reference loading, tool messages, discovery/framing, output, caching, and hidden reasoning. In a real host the source may already be in context and tool use may erase the static gain. Do not claim actual savings until provider usage is measured end to end. Compare only using the relevant tokenizer; otherwise do not report counts as exact for the target model. If the downstream agent cannot accept the protocol or an execution error occurs, keep the original.
