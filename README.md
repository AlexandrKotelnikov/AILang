# ATL — Artificial Thought Language

An experimental language for compact prompts, generated reasoning notes, memory and agent communication. Goal: improve correct tasks per million tokens, not merely shorten text.

## Status
- v0.1: experimental [language specification](ATL-spec.md), [system prompt](system-prompt.txt), four smoke tests and original static benchmark.
- v0.2: [Tokenizer Lab](lab/README.md), 1,000 synthetic cases across ten task templates, development-only alias search, held-out token accounting.
- v0.3: planned actual model evaluation, including generated reasoning-token usage where observable, answer quality and latency.

## Quick start
```sh
python -m unittest discover -s lab -p 'test_*.py'
python -m pip install tiktoken
python lab/lab.py --encoding o200k_base --out results/o200k
```

The tokenizer lab compares reference text, not model performance. No validated compression or accuracy claim yet. A closed model's hidden reasoning is not observable through a prompt. See [methodology](lab/README.md) for exact scope, overhead assumptions and other tokenizer support.
