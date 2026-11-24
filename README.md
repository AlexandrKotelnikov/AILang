# ATL v0.1 starter kit

- ATL-spec.md: language specification and examples.
- system-prompt.txt: experimental instruction for existing models.
- cases.json: four smoke-test cases with ordinary, compact English and ATL versions, reference traces and expected answers.
- bench.py: static token-count comparison, including ATL instruction overhead.

Run Python 3.9+:

```
python -m pip install tiktoken
python bench.py --encoding o200k_base
python bench.py --encoding cl100k_base
```

For an alternative tokenizer:

```
python -m pip install transformers
python bench.py --hf /path/to/local/tokenizer
```

The script measures reference text only. It does not call a model, train one, measure accuracy, or inspect hidden reasoning. Real evaluation requires running comparable tasks through a model, counting its actual generated tokens and checking its answers independently. For reproducibility, pin tokenizer/model revisions and library versions. Chat template and API-specific overhead are not included in these counts. The idealized once-only overhead assumes the instruction is represented once in the measured context, not that repeated requests avoid billed input tokens.
