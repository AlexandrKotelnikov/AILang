# Contributing

The project is experimental; licensing is not yet selected. Before proposing redistributable code or data, contact the maintainer to clarify licensing.

For a bug report, include the skill version, host, model and settings if known, expected and actual result, minimal nonconfidential fixture and command. Report static tokenizer counts separately from provider usage. For research contributions, freeze task cases and format controls before inference, use equivalent output contracts, preserve raw responses, report failures, avoid treating repeated cases as independent. Prefer strong compact baselines over verbose-only comparisons.

Run `node --test skills/atl-context/tests/route.test.mjs`. With the official local rank file, run the CLI examples in [INSTALL](docs/INSTALL.md). Do not include secrets, customer data or proprietary prompts.
