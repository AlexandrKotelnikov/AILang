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

- v0.4.4: [Executable Repeat Operators](operators/README.md), 240 independently checked interval tasks, lossless bounded repeat syntax, strong RLE control and static character benchmark (token/inference results pending).

- v0.4.5: [Adaptive Operator Engine](operator_engine/README.md), bounded arithmetic runs, input-only routing, 320 checked tasks and seven-arm static benchmark (provider/token experiments pending).

Quick start:
```sh
node reasoning/run.mjs --self-test
node reasoning/run.mjs --model YOUR_MODEL
python -m unittest discover -s lab -p 'test_*.py'
python -m pip install tiktoken
python lab/lab.py --encoding o200k_base --out results/o200k
```

Reasoning Engine defaults to dry run; see its README for execution. No validated compression or accuracy claim yet. Static reference counts do not measure model performance, and prompts cannot guarantee control over hidden reasoning in closed models.
