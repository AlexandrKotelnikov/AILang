# Batch protocol (v0.2)

Only independent tasks in the same authorized permission/trust scope. Input is a nonempty JSON array with exactly three string fields per record: unique nonempty id, context and task. Adjacent exact context matches may be grouped; ordering and every character must survive roundtrip.

```sh
node scripts/optimize.mjs --mode batch --input /local/tasks.json --ranks /local/o200k_base.tiktoken --skill-loaded
```

Candidates: flat JSON (control), grouped JSON, tuples, and lines when delimiters are safe. All candidates share the same answer contract and trust-boundary instruction. Selection uses the full instruction + newline + payload, with the complete SKILL.md plus newline as a modeled activation prefix for compact candidates in cold mode; --skill-loaded charges that prefix to every candidate. Ties retain the control or earlier candidate. This is not a provider billing model. It excludes tool output, reference reads, host framing, actual output and caching. If the source is already in the current context, no spent tokens are recovered.

Keep the original as fallback. Submit selectedInstruction + newline + selectedPayload to an authorized downstream agent only if the measured saving justifies the actual workflow overhead. Return ordered JSON id/answer records. The legacy batch.mjs CLI remains for reproducing MVP 0.1 results; use optimize.mjs for current routing.
