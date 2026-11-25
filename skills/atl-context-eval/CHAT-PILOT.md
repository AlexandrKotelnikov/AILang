# Chat pilot — ATL Context Skill 0.1.0

Frozen 24-task, three-arm manual pilot. It evaluates task correctness and visible response behavior, not hidden reasoning. The ATL arm loads the actual skill text and a precompiled grouped payload; it deliberately bypasses host installation and adaptive routing. It is not an end-to-end skill benchmark.

## Run

Open three independent clean chats (prefer temporary chats outside the AILang project, with no answer key or other arm in context). Select the same model and reasoning effort. Copy the contents of exactly one prompt into each chat, without extra messages or instructions:

- [flat](chat-pilot-flat.txt): repeated flat JSON.
- [natural](chat-pilot-natural.txt): strong shared-context natural language.
- [atl](chat-pilot-atl.txt): skill text plus grouped JSON.

Do not give the solver access to chat-pilot.mjs; it contains gold answers. Avoid links in the actual solving message. No tools are allowed in this pilot. Record model label, effort, arm, trial number, date, time from submission to complete answer (wall clock), tool usage if any, and raw response. Save only the response JSON as a local file. Run in randomized arm order, preferably 5 independent repetitions per arm. Do not revise prompts after seeing results. Score every output including failures, not just successful replies.

```sh
node skills/atl-context-eval/chat-pilot.mjs --self-test
node skills/atl-context-eval/chat-pilot.mjs --score answer.json
node skills/atl-context-eval/chat-pilot.mjs --ranks /local/o200k_base.tiktoken
```

Malformed JSON is a format failure: record protocol failure and zero correct for the strict trial. Do not silently repair it. Report semantic accuracy and exact protocol validity separately. Use the score's strict equality of answer values; do not treat its correct count as protocol validity. The CLI does not execute model inference. Static token counts are exact for the verified rank-based encoding, not the actual ChatGPT model or provider usage. Compare the generated prompts with the committed text before measuring if files are changed. Wall-clock latency is noisy and does not isolate reasoning time.

Primary contrast: ATL vs natural. Flat is a secondary baseline. Report accuracy, invalid output rate, median wall-clock time, static prompt/response tokens (if the verified tokenizer is available), plus paired differences across task IDs and trial-level variation. No provider or hidden reasoning usage is available in ordinary ChatGPT. Do not claim non-inferiority from this small pilot. For a later powered experiment, freeze held-out tasks, specify an accuracy margin in advance, use provider usage including reasoning/retries where supported, and report correct answers per million total billed tokens. A separate installed-skill and adaptive-router arm is required to establish product-level performance.

The benchmark is synthetic and public; use new private held-out fixtures before making generalization claims. There is no evidence here that ATL controls internal chain of thought.
