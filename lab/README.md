# ATL v0.2 Tokenizer Lab

A static first experiment. The 1,000 synthetic cases are parameterized variants of ten task templates, not 1,000 independent reasoning types. Each has equivalent-intent Russian, English, compact English and structured ATL prompts, reference derivations and an answer. Within-template parameter split: 600 dev, 400 test. This is not a test of unseen task families. Interval cases use a block split to ensure both yes/no outcomes in each partition. Reference strings may differ in explanation detail; semantic equivalence and generated answer quality require separate assessment.

## Run
Python 3.10+; from repository root:
```sh
python -m unittest discover -s lab -p 'test_*.py'
python -m pip install tiktoken
python lab/lab.py --encoding o200k_base --out results/o200k
python lab/lab.py --encoding cl100k_base --out results/cl100k
```

For Qwen, DeepSeek or Llama install transformers and use a compatible local tokenizer directory or a remote model ID with an exact revision:
```sh
python -m pip install transformers
python lab/lab.py --hf /path/to/tokenizer --out results/local
```

Record and pin package versions for repeat runs; reports record installed versions and corpus hashes. Some tokenizers require additional dependencies or access authorization. No custom remote code is executed. Use `node lab/generate.mjs` (Node 18+) to regenerate the corpus.

## Optimization
Coordinate descent searches three aliases for each of seven fields and two separators. It counts complete rendered texts with a real tokenizer (not isolated words). Optimize only on dev, then freeze aliases before reporting test. Objective defaults to sum of prompts, reference traces and instruction tokens per case; use --overhead shared to explore an idealized dictionary represented once. Compare raw and overhead-inclusive totals. The shared-context total does not model actual API billing or chat framing. A candidate that saves tokens is not necessarily understood by the model.

## Limitations
No actual inference, accuracy, latency, or hidden reasoning measurements are included. No empirical compression claim until a real-tokenizer report is produced. Compact English is not a reproduction of Chain of Draft. Next: compare real model output across conditions, score answers, measure generated tokens and latency, test unfamiliar task families. Do not tune on held-out results. Report negative savings too.
