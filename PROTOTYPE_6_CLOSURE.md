# Prototype 6 Closure Report

Date: 2026-09-09
Live provider: Gemini
Model: `gemini-3.5-flash-lite`
Trusted source: `circuits-resistance-approved-v1`

## 1. Live Gemini goal-mode results

The same trusted source was generated three times for each learner purpose. These were real provider calls, not fixture blueprints.

| Goal | Accepted | Compiled | Distinct accepted structures | Within-goal modal consistency | Mean latency |
|---|---:|---:|---:|---:|---:|
| Explore · 5 min | 3 / 3 | 3 / 3 | 1 | 100% | 6.9 s |
| Understand · 15 min | 3 / 3 | 3 / 3 | 3 | 33% | 45.9 s |
| Revise · 15 min | 2 / 3 | 2 / 2 accepted | 2 | 50% | 9.0 s |
| Test · 15 min | 2 / 3 | 2 / 2 accepted | 2 | 50% | 12.2 s |

Overall:

- 12 live generations.
- 10 accepted blueprints.
- Every accepted blueprint compiled successfully.
- 2 explicit validation failures; no hidden lesson fallback was used.
- 7 generations required the one permitted correction attempt.
- Mean end-to-end design latency was 18.5 seconds.

The rejected Revise generation mixed incompatible primitive fields. The rejected Test generation used a non-directional relationship for a directional assessment. Both failures were caught before compilation.

## 2. Structural comparison

The representative structure for every goal differed from every other goal in at least two recorded dimensions. This remains an evaluation result, not a runtime safety rule.

| Comparison | Differing dimensions | Meaningfully different |
|---|---:|---|
| Explore vs Understand | 2 | Yes |
| Explore vs Revise | 2 | Yes |
| Explore vs Test | 3 | Yes |
| Understand vs Revise | 2 | Yes |
| Understand vs Test | 3 | Yes |
| Revise vs Test | 3 | Yes |

Representative contrasts:

- Explore: `prediction → parameter-experiment → target-challenge`; roles `evidence → explore → apply`.
- Understand: `parameter-experiment → prediction → worked-example → target-challenge`; roles `explore → evidence → explain → apply`.
- Revise: `prediction → parameter-experiment → worked-example → target-challenge`; roles `evidence → explore → explain → apply`.
- Test: `observation → multiple-choice → target-challenge → transfer-challenge`; roles `orient → evidence → apply → transfer`.

Explore and Test differ in primitive order, stage roles, and final application type. Understand and Revise differ in primitive order and stage roles.

The complete per-run signatures and latency data are in the timestamped JSON and Markdown reports under `reports/`.

## 3. Capability registry

Every registered primitive now declares normalized generic capabilities. Examples:

| Primitive | Capabilities |
|---|---|
| Prediction | `hypothesis`, `directional-reasoning` |
| Parameter experiment | `variable-manipulation`, `cause-effect-observation` |
| Comparison | `contrast`, `data-comparison` |
| Data plot | `quantitative-trend`, `data-comparison` |
| Diagram / observation | `spatial-representation`, `labelled-structure` |
| Target challenge | `deterministic-application` |
| Transfer challenge | `transfer-generalization` |

The normalized vocabulary also includes known unavailable capabilities such as `microscopic-charge-motion`, `ordered-process`, and `free-form-circuit-construction`. These names let the assembler declare a precise limitation without inventing a component.

## 4. Representation-gap behaviour

A selected objective is now validly accounted for through exactly one of:

1. one or more stages in the initial learning sequence; or
2. one validated representation-gap declaration.

Validation rejects:

- an objective with neither form of coverage;
- an unknown or unselected objective;
- duplicate gap declarations;
- a gap duplicated by existing stage coverage; and
- a gap claiming a capability already supplied by the registered primitive vocabulary.

Accepted gaps survive blueprint validation, compilation, manifest signing, and signature verification. The design inspector displays the objective, missing capability, reason code, registry availability, and validation status. No fake learner block is created for the missing capability.

## 5. Tests and verification

- Vitest: 83 tests passed across 12 files.
- New/expanded P6 engine coverage: 23 tests passed.
- ESLint: passed for P6 routes, source, and evaluator.
- TypeScript: passed with `--noEmit`.
- Next.js production build: passed; all P6 pages and API routes compiled.
- Browser verification: the autonomous lesson compiled and opened; the design inspector displayed the representation-gap section; its persistent close button and Escape close both worked.

The gap tests cover normal stage coverage, valid gap coverage, missing coverage, unknown objectives, already-available capabilities, genuine unavailable capabilities, duplicate coverage, signed compilation, and inspector output.

## 6. Remaining limitations

- Gemini still needed correction in 7 of 12 runs, so prompt/schema reliability is not perfect.
- Two generations remained invalid after correction. P6 fails explicitly and safely in this case.
- The accepted Understand designs varied considerably within the same goal. This is visible evaluation evidence, not hidden randomness.
- Capability-gap validity proves registry absence, not that the AI's pedagogical judgment is semantically correct; review remains the assurance layer.
- P6 does not generate new components, search the web, add subjects, or solve declared representation gaps.

## 7. Freeze decision

P6 can now be frozen before P7.

The architecture demonstrates autonomous, source-grounded lesson design; goal-dependent structural variation; strict fail-closed compilation; adaptive unfinished-path recomposition; and explicit acknowledgement of representation limits. The remaining provider reliability findings are documented constraints rather than missing P6 architecture.

Final claim:

> P6 autonomously designs a complete source-grounded interactive lesson from generic trusted capabilities, creates meaningfully different pedagogical structures for different learner purposes, and explicitly identifies objectives that its current representation vocabulary cannot adequately express.
