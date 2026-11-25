# ATL v0.4.7 — Computational Graph

## Hypothesis and scope

Recover three fixed but unknown operator IDs from five observations of two graph outputs; forecast 8–16 new input rows. Inputs are four integers in 0..96. Operators 0:add, 1:subtract, 2:multiply, 3:max; each result is reduced modulo 97. The supplied graph is acyclic, with three unknown operator nodes and a known final linear-combination node. Three labeled layouts (two distinct dependency shapes) are included. Graph structure, candidate operators and calibration are supplied, not discovered. The generator rejects non-unique calibrations.

The certificate is a three-digit operator vector, with optional explicit forecast rows. The external interpreter can reconstruct every intermediate node and forecast output using the original task. Example program `203` means multiply, add, max in node order (illustrative). It is only meaningful with the supplied graph and inputs. The self-describing variant `G:203` adds a type prefix, but costs more. Packed digits are not a novel compression method.

## Executed static tests

240 deterministic synthetic instances (60 development, 180 pilot; separate seeds), 2,902 forecast rows; unique calibration and all intermediate results agreed with an independently expressed scalar reference. 1,680 valid certificates, 240 answer-only checks, 10,798 distinct-per-format mutations rejected. Mutation counts are checks, not independent tasks or LLM accuracy. All tasks are synthetic and from the same generator. Two layouts differ by input wiring rather than graph topology.

Token counts use the repository's independent JavaScript BPE and full official o200k_base mergeable-rank dictionary, validated by SHA-256 446a9538cb6c348e3516120d7c08b09f57c36495e2acfffe59a5bf8b0cfb1a2d, 199,998 ranks and three golden sequences. Python tiktoken full parity is still pending. Fixed strings, separately encoded system/input/output; no API framing, tool messages, actual inference, hidden reasoning or billing.

| Mode | System | Input | Output | Total |
|---|---:|---:|---:|---:|
| dense | 10440 | 48700 | 18460 | 77600 |
| named | 11700 | 48700 | 11300 | 71700 |
| csv | 10260 | 48700 | 9680 | 68640 |
| atl | 10440 | 48700 | 9320 | 68460 |
| packed | 9540 | 48700 | 8960 | 67200 |
| program | 4500 | 48700 | 180 | 53380 |
| atl-program | 5220 | 48700 | 540 | 54460 |
| answer | 7560 | 48700 | 8600 | 64860 |

- dense: IDs plus all four node values per forecast row.
- named/csv/atl/packed: same reconstructible certificate plus explicit c,d outputs; packed is a strong ordinary notation control.
- program/atl-program: IDs only; external execution produces outputs. Compare these against each other for identical response contracts.
- answer: c,d outputs only, no operator evidence; different contract.

ATL with G: is not superior to the packed control: 1.88% more total tokens. Program-only vs dense saves 31.21% total and 99.02% output, by delegating expansion to software. Bare program is cheaper than G:-prefixed program. Do not attribute those savings to a special language or reduced internal reasoning.

## Reproduce

```sh
node graph/static.mjs /path/to/o200k_base.tiktoken
```

The rank vocabulary can be obtained from the official URL or the mirror identified in recursive/README.md; checksum is mandatory. The same graphLab function and tokenizer were executed in a JS runtime; standalone Node entrypoint was not separately executed. Machine-readable results: [results.json](results.json).

## Next

Build a reusable bounded graph VM and inference harness, with independently scored common final answers, actual provider token usage (including reasoning tokens where exposed), interpreter cost and direct non-LLM solver baseline. Include larger irregular graphs with unknown wiring and held-out operation families; current three-op problem is solvable by exhaustively checking only 64 candidates. Report program-only separately from direct-answer contracts and account for repeated context and decoding overhead. No real independent model calls yet.
