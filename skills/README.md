# ATL Context — product preview 0.2.0

Install the full [atl-context](atl-context) folder using the [installation guide](../docs/INSTALL.md). The current CLI is `scripts/optimize.mjs` (batch and permutation modes). See [examples](atl-context/examples) and [tests](atl-context/tests).

Research evidence: [Stage 7](../lab/synthetic_benchmark_v3/results/summary.json). It evaluates packed prompts, not installed skill overhead. Historical v0.1.0 evidence and exact fixture are preserved in [MVP-0.1.md](MVP-0.1.md) and [atl-context-eval](atl-context-eval). The historical checker reads the frozen skill text rather than the new instructions.

No host integration or end-to-end API savings have been verified for this release. Conditional permutation logic remains in the research track.
