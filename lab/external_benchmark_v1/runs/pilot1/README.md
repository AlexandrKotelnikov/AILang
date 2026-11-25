# Pilot 1 — reported answers

Six user-submitted sequences in order B5, A5, C5, R5, D5, K5 were identical after normalization. K5 checked against pinned reference; same result for all arms: 99/100, GSM8K 24/25, other categories 25/25 each. M0516 official 160, reported 288; ambiguous scope of $4 each (bag versus pack). Official scoring unchanged. All IDs and order match. One shared response file rather than duplicating identical data. No evidence of a format or guidance accuracy advantage in this pilot. Independence, exact original output syntax, model settings not verified. User-reported UI reasoning times now available; no exact token counts or API telemetry. Do not infer statistical equivalence or internal computation savings. See ../README.md for design. Token fields remain null pending measurements.

## Timing follow-up (2026-11-25)

User explicitly labeled durations in seconds: B5 12, A5 11, C5 8, R5 13, D5 13, K5 10. These are UI-reported reasoning durations, not full response latency or hidden token counts.

| Format | No guidance | Guidance | Mean |
|---|---:|---:|---:|
| JSON | 12 | 13 | 12.5 |
| AILang framing | 13 | 11 | 12 |
| CSV | 8 | 10 | 9 |

C5 was fastest in this pilot (33.33% lower displayed time than B5). Guidance deltas +1, -2, +2 seconds; average +0.333 seconds. All arms 99/100. CSV is also shorter in characters than AILang framing. No established speedup from AILang or guidance, no causal inference from single runs. Next research: semantic compression with explicit ambiguity preservation and end-to-end accounting, versus CSV and natural language, with repeat trials and harder held-out tasks.
