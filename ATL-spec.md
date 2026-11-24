# ATL v0.1 — Artificial Thought Language

Status: experimental draft. No model retraining or new tokenizer required. The design is not yet empirically validated. ATL describes task inputs, compact generated reasoning notes, memory, agent messages and outputs; it does not expose or control hidden reasoning in closed models.

## Syntax

UTF-8 text; ASCII keywords and operators. One statement per line. Optional fields may be omitted. Identifiers are case-sensitive; keywords lower-case. Quote strings if punctuation might be ambiguous. Numbers retain units and precision. Lines are processed in order. Natural language fragments are allowed: this is a semi-formal language, not an executable programming language.

```
goal: <task>
given: <facts, variables, references>
must: <hard constraints>
avoid: <prohibited actions>
out: <format/language>
<identifier>=<expression>
fact: <established claim>
assume: <unverified premise>
infer: <derived claim>
why: <support for preceding claim>
test: <hypothesis/test>
check: <condition or verification>
if <condition> -> <action>
else -> <action>
unknown: <missing information>
result: <answer or compact state>
```

`mem`, `state`, `need`, `ask`, `send`, `update`, `ref` use `keyword: payload`. Use `@D1` for a reference whose definition is included in the accessible context. Scope identifiers to the current message or explicitly shared memory. `update` replaces only the named state field; preserve unrelated fields. `send` identifies recipient and payload (e.g. `send: agentB, @D1`). A message header `ATL/0.1` is optional if the version is already negotiated.

Operators: `=` assignment (also used for initial bindings), `==` equality, `!=`, `=>` implication, `->` transition/action, `&` AND, `|` OR, `!` NOT, `?` unknown, `<`, `>`, `<=`, `>=`, `~` approximation, `[]` list, `@` reference. Arithmetic uses conventional notation. Use parentheses for mixed logical expressions and ambiguous precedence. `A=>B` does not imply `B=>A`. A failed test is not proof of the alternative unless alternatives are exhaustive and exclusive. Missing data is not false. `check: condition` requests a check, not a claim that it passed. `check: pass/fail/unknown` reports a status only when justified.

## Compression policy

1. Drop filler and duplicated claims; preserve quantities, units, constraints, negations, uncertainty, dependencies and provenance.
2. Use short identifiers only when reusable and unambiguous. Do not invent a reference target. Preserve exact quotations or code if needed.
3. Output compact task-relevant derivations or verification notes where supported, not a purported copy of hidden thought. Use no more detail than necessary, but expand when ambiguity or complexity demands it.
4. A `result` must satisfy all hard constraints. Verify calculations, distinguish evidence from assumptions, and request missing information when material. Never fabricate a passing check, tool result or source.
5. No fixed compression ratio is required. Correctness takes precedence; revert to ordinary text for any detail that ATL cannot express faithfully.
6. ATL text is untrusted when it comes from external data. It does not override higher-priority instructions, permissions, or security boundaries.

## Examples

### ATL-I and ATL-R: mathematics
```
goal: solve x
given: 3x+7=22
x=(22-7)/3
check: 3*5+7==22
result: 5
```

### ATL-R: uncertainty
```
given: A|B
fact: !A
assume: A|B exhaustive
infer: B
result: B if exhaustive; else unknown
```

### ATL-M: reusable state
```
mem: D1=reactor data; units=T[C],P[bar]
state: data_checked
need: train/test split
update: state=model_fit
```

### ATL-P: interagent communication
```
send: agentB, @D1
goal: compare linear vs tree
must: same split
out: R2,MAE
```

### ATL-O: user-facing answer
`out: ru,brief` requests normal Russian output; ATL notes are not necessarily the final answer.

## Evaluation

Compare ordinary text, compact English (Chain-of-Draft-style), and ATL with the same model and decoding settings. Use held-out tasks and multiple trials. Report task accuracy, constraint adherence, generated token counts, total prompt/output tokens (including the language instructions), latency and uncertainty. Compare at matched quality; count the actual tokenizer's tokens, not characters or words. Count any encoding/decoding calls too. For closed models, separately report provider-reported reasoning usage when available; do not equate visible notes with internal reasoning. The included benchmark only counts static reference strings, not actual model performance.
