# AILang B3 / D3 — paired benchmark, 1,000 questions

Date: 2026-11-25. Seed: 20261125. B3 is a natural-English baseline; D3 is a compact symbolic rendering of the same cases and queries. The unit of comparison is one paired prompt; each contains 1,000 questions (34 inventory cases, 33 graph cases, 33 decision cases, 10 queries each). Both require identical ordered JSON output. The cases include zero values, stock below reserve, zero-duration tasks, tied critical paths, strict thresholds and conflicting rule priorities. Decision rows are shuffled within cases. Questions are grouped by case and therefore are not 1,000 statistically independent samples.

## Run protocol

1. Open two fresh temporary chats outside the AILang project. Do not attach the answer key, generator, this README or prior chats. Select the same model and reasoning setting. Disable extra tools if possible; both prompts instruct the model not to use them. Copy the complete contents of B3_prompt.txt into one chat and D3_prompt.txt into the other. Do not add other instructions. Alternate/randomize which arm is first across repetitions.
2. Record model, reasoning setting, run ID, prompt arm, start time, visible reasoning time (if provided by UI), time to first answer token (if measurable), time to end of answer, output truncation, and whether tools were actually used. Save the complete raw JSON response as B3_answer.json or D3_answer.json. Do not repair malformed outputs for strict-format scoring.
3. Run `python score.py B3_answer.json D3_answer.json`. The scorer checks ordered IDs, exact types, completeness, duplicates and accuracy. Invalid JSON is a format failure with accuracy unscored, not a fabricated zero. For clean responses missing items count as incorrect. Report strict-format success separately from accuracy.
4. Repeat at least 10 paired runs under the same conditions before drawing conclusions. Use new temporary chats every run; use new seeds for generalization tests. Keep API telemetry separate from UI timing. For an API run record input, output and reasoning tokens where available, plus cached input and latency. Character counts are not token counts. Optional tokenizer measurements in metrics.json are proxies, not guaranteed exact GPT-6.2 accounting.

## Files
- B3_prompt.txt, D3_prompt.txt: ready-to-run prompts; do not send both to one model context.
- reference.json: answer key, verified using independent computation methods: unit-by-unit dispatch vs formula, enumeration of all DAG paths vs dynamic programming, ordered predicate table vs conditional evaluator.
- cases.json: common structured inputs; generate.py: deterministic generator and cross-check.
- score.py: strict evaluation, standard library only.
- metrics.json: exact character counts, SHA-256 checksums, optional tokenizer counts.
- run_log.csv: empty measurement template.

The 1,000-object output can exceed the output budget of some models or interfaces. A truncated run must be recorded as such; do not silently continue it in another turn and treat it as an equivalent single run. If output budget is a blocker, predefine a separate matched batched protocol or a more compact common output schema for both arms. A single pilot is insufficient to establish reasoning speed, token savings, or noninferiority. Public answer keys should not be provided to the test model; do not use search or repository access during evaluation.
