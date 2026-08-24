# Prototype 2: Real Adaptation from Trusted Blocks

Prototype 2 keeps the complete Prototype 1 experience at `/` and adds an
isolated demonstration at `/prototype-2`. The new route copies the same
curiosity-first homepage and two-step setup, then uses a deterministic learning
engine instead of a preassembled lesson.

## Question being proved

Can the application use evidence from one circuit activity to select a
meaningfully different next learning block?

The implementation loop is:

```text
learner interaction
  -> normalized BlockOutcome
  -> deterministic LearnerState update
  -> legal catalog candidates
  -> scored NextBlockDecision
  -> registered React component
```

The blocks contain trusted, human-written content. Neither the engine nor the
renderer generates HTML, diagrams, explanations, or media.

## First adaptation checkpoint

The learner predicts what happens to current when resistance doubles at fixed
voltage, then tests the prediction.

```text
Correct on first attempt without a hint
  -> current/resistance graph
  -> target-current challenge
  -> final circuit-design challenge

Incorrect first attempt, multiple attempts, or hint used
  -> misconception visual
  -> guided resistance experiment
  -> equivalent retry
  -> current/resistance graph
  -> target-current challenge
  -> final circuit-design challenge
```

The completed path is append-only. The renderer reports evidence but contains
no routing rules. The compact engine trace shows the latest evidence, learner
state, candidates, scores, and selected block.

## Boundaries

- Nine circuit-learning blocks
- One resistance/current misconception
- Correctness, attempts, and hint usage only
- Browser memory only; refresh or Reset learner starts again
- No AI API, database, accounts, resource search, other subjects, or generated media

Prototype 3 will replace deterministic scoring with constrained AI selection
while retaining the catalog, outcome, learner-state, decision, and renderer
boundaries established here.

## Verification

Run:

```bash
npm test
npm run lint
npm run build
```

For the presentation, complete `/prototype-2` once with a correct first
prediction, reset the learner, and complete it again after using a hint or
making an incorrect first prediction. The block rail and engine trace should
visibly diverge.
