# ATL — Artificial Thought Language

Experimental language for compact prompts, generated reasoning notes, memory and agent communication. Goal: improve correct tasks per million tokens, not merely shorten text.

- v0.1: [language specification](ATL-spec.md), [system prompt](system-prompt.txt), original static benchmark.
- v0.2: [Tokenizer Lab](lab/README.md), 1,000 synthetic cases, development-only alias search.
- v0.3: [Reasoning Engine](reasoning/README.md), five real-inference modes, [logic macros](reasoning/macros.md), deterministic scoring and token/latency accounting.
- v0.3.1: [Compression Research](compression/README.md), Native/Micro/Adaptive modes, eight multi-step development tasks, single-chat pilot and independent API harness.
- v0.3.2: [ATL-Nano](nano/README.md), zero-dictionary notation, ASCII/Unicode comparison, new multi-step development pilot and API harness.
- v0.3.3: [Long Reasoning](long/README.md), 12 recurrence/branch/inventory/dependency cases, bounded replay DSL, exact state replay and static pilot.
- v0.4: [Evolution Engine](evolution/README.md), automatic reversible codebook discovery, cost-aware mutations, held-out and unseen-family static evaluation.
- v0.4.1: [Adaptive Evolution](adaptive/README.md), verified o200k_base rank-based tokenizer, actual static token counts, input-only adaptive routing and 72 harder tasks with dual reference solvers.

- v0.4.2: [Semantic Compiler](semantic/README.md), lossless typed-family wire representation, strong compact-English control, 72 verified roundtrips, four-arm independent inference harness.

- v0.4.3: [Verifiable Reasoning Certificates](certificate/README.md), two new task families, 200 solver-checked instances, compact executable witnesses and static token measurements against a strong compact control.

- v0.4.4: [Executable Repeat Operators](operators/README.md), 240 independently checked interval tasks, lossless bounded repeat syntax, strong RLE control and static character and verified-rank token benchmarks (inference pending).

- v0.4.5: [Adaptive Operator Engine](operator_engine/README.md), bounded arithmetic runs, input-only routing, 320 checked tasks and seven-arm static character and token benchmarks (inference pending).

- v0.4.6: [Recursive Engine](recursive/README.md), bounded recurrence identification, 240 checked tasks and checksum-verified token counts with equivalent recurrence and final-only controls.

- v0.4.7: [Computational Graph](graph/README.md), 240 checked graph-identification tasks, eight-arm static o200k_base benchmark and executable graph certificates; ordinary packed control outperforms prefixed ATL (inference pending).

- v0.4.8: [Graph VM](graph_vm/README.md), unknown source and operation selection, 100 checked tasks, fixed-width wire vs CSV and ATL with exact static rank-based token counts; independent API harness prepared, inference pending.

- v0.4.9: [Symbolic Execution Engine](symbolic/README.md), 120 checked affine graphs, CSE/DCE, six-arm static token comparison and opt-in inference harness (inference pending).

- v0.5.0: [Adaptive Reasoning Compiler pilot](piecewise/README.md), live nonlinear piecewise chains, 112 checked tasks, query-free controls and development-only output-cost routing (static benchmark; inference pending).

- v0.5.1: [Logical Reasoning Engine](logic/README.md), 120 checked Boolean entailment tasks, executable witness/core certificates, eight static o200k_base modes; standard CNF wins per-task total (inference pending).

- v0.5.2: [Semantic Fidelity Engine](fidelity/README.md), 120 controlled-language tasks, 5,120 mutations, gold-model equivalence audit and checksum-verified static token comparison (inference pending).

- v0.5.3: [Semantic Projection Audit](projection/README.md), replicated 5,120 mutations; complete pair-projection verification for 2-CNF against gold, explicit 3-CNF counterexample (inference pending).

- v0.5.4: [Generalized Semantic Verification](generalized/README.md), 120 new tasks, 5,156 mutations, bounded-width projection equivalence and six checksum-verified static token modes (inference pending).

Quick start:
```sh
node reasoning/run.mjs --self-test
node reasoning/run.mjs --model YOUR_MODEL
python -m unittest discover -s lab -p 'test_*.py'
python -m pip install tiktoken
python lab/lab.py --encoding o200k_base --out results/o200k
```

Reasoning Engine defaults to dry run; see its README for execution. No validated compression or accuracy claim yet. Static reference counts do not measure model performance, and prompts cannot guarantee control over hidden reasoning in closed models.
