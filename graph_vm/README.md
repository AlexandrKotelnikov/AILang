# ATL v0.4.8 — Graph VM
Two DAG layouts, four unknown nodes, each with two left-source choices and four operations (add, subtract, multiply, max), fixed right source, arithmetic modulo 97. Each program is four octal digits; 4096 candidates. Eight calibration rows and 16–40 forecast rows. Exhaustive search and a separate scalar evaluator agree; this is a constrained graph identification problem, not general program synthesis.
 
100 unique generated tasks: 20 development and 80 pilot (same generator, separate seeds), 2897 forecast rows overall, 49 ambiguous cases rejected, 600 valid formats and 3300 mutations checked. No independent LLM generations. Static test uses a verified o200k_base dictionary of 199998 ranks, checksum 446a9538cb6c348e3516120d7c08b09f57c36495e2acfffe59a5bf8b0cfb1a2d and three golden sequences. System, input and reference output separately encoded, no API framing or internal reasoning. Full parity with official tiktoken pending.

| Mode | System | Input | Output | Total |
|---|---:|---:|---:|---:|
| csv-direct | 12240 | 28768 | 9344 | 50352 |
| fixed-direct | 12880 | 15104 | 7048 | 35032 |
| atl-direct | 13280 | 15104 | 7208 | 35592 |
| csv-program | 10640 | 28768 | 160 | 39568 |
| fixed-program | 11280 | 15104 | 160 | 26544 |
| atl-program | 11680 | 15104 | 320 | 27104 |

W2 is ordinary fixed-width decimal encoding (not a novel ATL technique), two digits per value, preserving leading zero. ATL adds a P: prefix and W2 name; it costs more. Compare direct modes with direct, program with program. Direct produces program plus all forecasts; program-only delegates expansion to VM. All 480 pilot fixtures checked via the scorer, static lab executed in JS runtime; standalone Node entrypoints and API harness not separately executed. No provider usage or accuracy claim. Direct exhaustive search solves all accepted tasks by construction.

## Reproduce
Download the official rank file described in adaptive/README.md.
```sh
node graph_vm/static.mjs /path/to/o200k_base.tiktoken
node graph_vm/inference.mjs --model YOUR_MODEL
# Only with an authorized endpoint (full chat completions URL) and model:
ATL_API_URL=https://YOUR_ENDPOINT ATL_API_KEY=YOUR_KEY node graph_vm/inference.mjs --execute --model YOUR_MODEL --limit 5 --out pilot.json
```
Full run 480 sequential calls, no reference answers sent. Exact format scoring, failures counted incorrect, raw provider usage retained (including reasoning fields if provided), aggregate efficiency omitted if any usage missing. --limit selects first N task IDs, not a representative subsample. Model identity, parameters, cost and repeat seeds should be fixed before the final comparison. A noninferiority criterion and larger out-of-family tasks remain to be predeclared. Never interpret the deterministic scores as model accuracy.
