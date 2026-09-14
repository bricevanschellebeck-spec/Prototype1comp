# Prototype 6 — Live Gemini Goal-Mode Evaluation

Generated: 2026-09-09T13:41:01.612Z
Provider: gemini · gemini-3.5-flash-lite
Trusted source: circuits-resistance-approved-v1
Runs: 12 (3 per goal)

## Outcome

- Accepted blueprints: 10/12
- Invalid or fallback generations: 2
- Compilation failures: 0
- Correction attempts used: 7
- Mean latency: 18.5 s

## Within-goal consistency

| Goal | Accepted | Distinct structures | Modal consistency | Mean latency | p95 latency |
|---|---:|---:|---:|---:|---:|
| explore | 3/3 | 1 | 100% | 6.9 s | 9.1 s |
| understand | 3/3 | 3 | 33% | 45.9 s | 100.2 s |
| revise | 2/3 | 2 | 50% | 9.0 s | 15.6 s |
| test | 2/3 | 2 | 50% | 12.2 s | 12.5 s |

## Between-goal structural comparison

| Comparison | Primitive order | Stage roles | Support alternatives | Final application | Delayed facts | Omitted facts | Meaningfully different |
|---|---|---|---|---|---|---|---|
| explore vs understand | different | different | same | same | same | same | yes |
| explore vs revise | different | different | same | same | same | same | yes |
| explore vs test | different | different | same | different | same | same | yes |
| understand vs revise | different | different | same | same | same | same | yes |
| understand vs test | different | different | same | different | same | same | yes |
| revise vs test | different | different | same | different | same | same | yes |

## Structural signatures

### explore

- Primitive order: prediction → parameter-experiment → target-challenge
- Stage roles: evidence → explore → apply
- Support alternatives: support:explanation:objective-predict
- Final application: target-challenge
- Delayed facts: none
- Omitted facts: none

### understand

- Primitive order: parameter-experiment → prediction → worked-example → target-challenge
- Stage roles: explore → evidence → explain → apply
- Support alternatives: support:explanation:objective-predict
- Final application: target-challenge
- Delayed facts: none
- Omitted facts: none

### revise

- Primitive order: prediction → parameter-experiment → worked-example → target-challenge
- Stage roles: evidence → explore → explain → apply
- Support alternatives: support:explanation:objective-predict
- Final application: target-challenge
- Delayed facts: none
- Omitted facts: none

### test

- Primitive order: observation → multiple-choice → target-challenge → transfer-challenge
- Stage roles: orient → evidence → apply → transfer
- Support alternatives: support:explanation:objective-predict
- Final application: transfer-challenge
- Delayed facts: none
- Omitted facts: none

## Interpretation boundary

Structural difference is an evaluation signal, not a runtime validity rule. P6 does not force artificial variation between goals.
