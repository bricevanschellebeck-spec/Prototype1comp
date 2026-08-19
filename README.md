# AI-Assembled Interactive Learning Environment

## Project status

Prototype 1 is now under active development. The first vertical slice is implemented:

- Five human-authored and registered Ohm's law learning blocks
- Typed catalog and structured lesson-blueprint contracts
- Deterministic blueprint validation
- A local safe composer for development and fallback behavior
- An optional server-side AI composer using strict structured output
- A Composer Lab that exposes inputs, blueprint decisions, validation, and rendering
- Interactive circuit simulation, prediction, graph, and challenge components

Do not begin broad product development until Prototype 1 passes its full acceptance gate.

This README is the project's source of truth. Future implementation decisions should preserve the central distinction below:

> The AI generates the structure of a lesson. The application renders that structure using trusted, human-designed learning components.

The project is not primarily a chatbot, an AI tutor that generates explanations, or a traditional adaptive-learning website with an AI hint feature.

## Run the current prototype

Codex can run the project with its bundled Node.js runtime, so no system-wide installation is required while developing through Codex.

To run it independently from a normal terminal, install Node.js 20.9 or newer and pnpm, then run:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

Useful verification commands:

```bash
pnpm lint
pnpm test
pnpm build
```

The application works without an API key by using the deterministic safe composer. To test real AI composition, copy `.env.example` to `.env.local` and set `OPENAI_API_KEY`. The key is read only by the server route and must never be committed.

The model is configured through `OPENAI_MODEL`. AI output is validated against both a strict JSON Schema and the trusted catalog. An invalid response receives one repair attempt before the application returns to the local safe composer.

## Core concept

The application contains a constrained library of human-created and human-verified learning blocks, including:

- Interactive diagrams
- Simulations
- Draggable objects
- Sliders
- Graphs
- Short explanation cards
- Videos from educators and trusted creators
- Trusted images and diagrams
- Prediction and multiple-choice questions
- Matching and classification activities
- Timelines
- Step-by-step demonstrations
- Challenges

The AI's main responsibility is composition and adaptation. It chooses appropriate blocks and assembles them into a coherent learning experience. It must not generate arbitrary HTML, invent frontend components, introduce unsupported resources, or freely generate curriculum content.

The long-term loop is:

```text
Topic + verified curriculum + approved resources + learner state
    -> plan learning objectives
    -> select learning blocks
    -> sequence them into a lesson blueprint
    -> render trusted components
    -> observe learner interaction
    -> update the learner model
    -> recompose the unfinished lesson
```

The architectural principle is:

- **Rules are guardrails.**
- **AI is the composer.**
- **Components are the vocabulary.**
- **Learner interactions are feedback.**
- **The renderer is execution.**

## Architectural responsibilities

The following are conceptual modules. They do not initially need to be separate models or agents.

### Curriculum planner

- Understands the requested subject.
- Identifies learning objectives and prerequisites.
- Determines which objectives are eligible to be learned next.
- Uses verified curriculum specifications.

Prototype 1 uses a human-authored topic specification so that the composition mechanism can be tested independently. AI-assisted curriculum planning is deferred until composition and adaptation work reliably.

### Lesson composer

- Selects learning blocks from the approved catalog.
- Sequences blocks into a coherent lesson.
- Considers learner state, available time, accessibility needs, prerequisites, difficulty, recent activities, and available resources.
- Produces a structured lesson blueprint, never HTML or arbitrary component code.

This is the primary AI role in Prototype 1.

### Resource selector

- Filters or ranks trusted human-created resources.
- Never inserts an unapproved external resource directly into a lesson.

Prototype 1 uses a manually prepared local resource catalog. Internet discovery is deferred.

### Learner model

- Tracks evidence of concept mastery.
- Tracks active misconceptions.
- Tracks recently effective forms of interaction.
- Tracks completed blocks and current scaffold needs.
- Does not permanently label learners as visual learners, bad at mathematics, slow, or similar categories.

Prototype 1 uses controlled learner-state fixtures. Prototype 2 updates a real learner model from interaction outcomes.

### Verification layer

- Confirms that every selected block exists.
- Enforces prerequisites and required objectives.
- Checks lesson length and structural requirements.
- Rejects invented components, resources, and unsupported content.
- Attempts one constrained repair and then uses a safe fallback.

Verification remains deterministic even if AI responsibilities expand later.

### Component renderer

- Maps registered block IDs to known React components and verified content.
- Renders the validated lesson blueprint.
- Does not interpret or execute AI-generated code.

## Prototype 1: Constrained lesson composition

### Question to prove

> Given one curriculum objective and a small catalog of trusted learning blocks, can AI produce different coherent mini-lessons that render automatically?

### Initial topic

Prototype 1 covers one narrow electric-circuits objective:

> Understand and predict how changing resistance affects current when voltage remains constant.

This is intentionally smaller than a complete circuits course. It is large enough to support multiple meaningful representations while keeping the first experiment focused.

### Minimal block library

Prepare approximately nine configured learning blocks:

1. Ohm's law relationship diagram.
2. Short human-written concept card.
3. Resistance-slider circuit simulation.
4. Voltage/current graph activity.
5. Resistance prediction question.
6. Guided numerical example.
7. Common-misconception visual explanation.
8. Apply-the-equation practice question.
9. Final circuit challenge.

These can be implemented using approximately six reusable component types: diagram, simulation, question, graph, explanation, and challenge.

The distinction between a component and a block is important:

- A **component** is a reusable React interface type.
- A **block** is an approved instance of that component with verified content, resources, metadata, and behavior.
- The AI selects block IDs. It does not create or rewrite the block's educational content.

The composer should normally choose four to six blocks for one mini-lesson.

### Core data contracts

The exact syntax may change during implementation, but these responsibilities and boundaries should remain stable.

```ts
type LearningBlock = {
  id: string;
  componentType:
    | "diagram"
    | "simulation"
    | "question"
    | "graph"
    | "explanation"
    | "challenge";
  objectiveIds: string[];
  prerequisiteObjectiveIds: string[];
  difficulty: 1 | 2 | 3;
  purpose: "introduce" | "explore" | "check" | "remediate" | "apply";
  interactionType: string;
  modality: string[];
  estimatedMinutes: number;
  misconceptionsAddressed: string[];
  resourceIds: string[];
  accessibilityFeatures: string[];
};

type CompositionRequest = {
  topicId: string;
  requiredObjectiveIds: string[];
  learnerSnapshot: {
    priorKnowledge: "unknown" | "beginner" | "developing";
    knownMisconceptions: string[];
    recentlyEffectiveInteractions: string[];
  };
  constraints: {
    targetMinutes: number;
    maximumSteps: number;
    unavailableBlockIds: string[];
    accessibilityNeeds: string[];
  };
};

type BlueprintStep = {
  stepId: string;
  blockId: string;
  purpose: "introduce" | "explore" | "check" | "remediate" | "apply";
  reasonCode: string;
  expectedEvidence: string;
};

type LessonBlueprint = {
  blueprintVersion: "1";
  topicId: string;
  objectiveIds: string[];
  steps: BlueprintStep[];
  completionCheckBlockId: string;
};
```

The server, rather than the browser, supplies the verified topic specification and relevant catalog to the AI.

### Example blueprint

```json
{
  "blueprintVersion": "1",
  "topicId": "ohms-law-resistance",
  "objectiveIds": ["predict-current-from-resistance"],
  "steps": [
    {
      "stepId": "step-1",
      "blockId": "ohms-law-relationship-diagram",
      "purpose": "introduce",
      "reasonCode": "establish-conceptual-model",
      "expectedEvidence": "learner-identifies-variable-relationship"
    },
    {
      "stepId": "step-2",
      "blockId": "resistance-slider-simulation",
      "purpose": "explore",
      "reasonCode": "test-relationship-through-manipulation",
      "expectedEvidence": "learner-observes-current-decrease"
    },
    {
      "stepId": "step-3",
      "blockId": "resistance-prediction-question",
      "purpose": "check",
      "reasonCode": "check-concept-before-symbolic-work",
      "expectedEvidence": "correct-directional-prediction"
    }
  ],
  "completionCheckBlockId": "resistance-final-challenge"
}
```

Prefer enumerated reason codes to unrestricted prose. Optional natural-language reasoning may appear in development logs, but it must not control rendering or validation.

### Blueprint validation

A blueprint can reach the renderer only when all of the following are true:

- Every block ID exists in the supplied catalog.
- Every block supports a required objective.
- Prerequisites are satisfied in a valid order.
- Estimated duration is within the allowed tolerance.
- Step count does not exceed the request.
- The lesson contains an appropriate introduction or exploration activity.
- The lesson contains a valid completion check.
- Unavailable or inaccessible blocks are not selected.
- No component properties, resources, or curriculum facts were invented.
- The response matches the versioned blueprint schema.

Failure handling:

1. Return precise validation errors to the composer for one repair attempt.
2. Validate the repaired blueprint.
3. If it remains invalid or the model is unavailable, use a human-authored fallback blueprint.
4. Log the rejected output and reason during development.

The fallback is a reliability mechanism. It must not replace the AI-composition demonstration.

### Composer Lab

Prototype 1 should include an internal development view with three areas:

1. **Inputs:** topic, learner fixture, time limit, accessibility constraints, and block availability.
2. **Composition:** returned blueprint, reason codes, validation status, and any repairs.
3. **Rendered lesson:** the real lesson assembled from registered components.

This view should make the central mechanism visible. A developer or judge should be able to change the learner fixture or remove a block, select **Compose**, and watch the blueprint and rendered lesson change without modifying React code.

### Required scenarios

Evaluate at least these composition scenarios:

1. New learner with eight minutes available.
2. Developing learner who knows the equation but lacks intuition.
3. Learner limited to a five-minute lesson.
4. Lesson where the slider simulation is unavailable.
5. Learner with a known resistance/current misconception.
6. Accessibility constraint that excludes an interaction without an appropriate alternative.

The AI is not required to produce a predetermined sequence. Its sequence must be valid, coherent, sensitive to the supplied context, and educationally defensible.

### Prototype 1 acceptance gate

Prototype 1 passes when:

- Different constraints and learner fixtures cause appropriate changes in block selection or sequence.
- Every valid blueprint renders without frontend code changes.
- No rendered blueprint contains an unregistered block or resource.
- At least 90% of 30 representative composition runs pass on the first attempt.
- Validation, repair, and fallback prevent every invalid blueprint from reaching the renderer.
- Removing a preferred block causes the composer to choose a valid alternative.
- A science teacher rates at least 80% of reviewed blueprints as coherent and educationally reasonable.
- The complete lesson uses human-created educational content rather than generated media.
- A short demonstration clearly proves that AI composed the interface structure.

Do not expand into accounts, databases, broad analytics, or a complete circuits course until this gate passes.

## Prototype 2: Adaptive recomposition

### Question to prove

> Can learner interaction change the AI-composed remainder of a lesson while deterministic rules preserve curriculum validity and safety?

### Normalized block outcome

```ts
type BlockOutcome = {
  blockId: string;
  objectiveIds: string[];
  completed: boolean;
  correctness?: number;
  attempts?: number;
  hintUsed?: boolean;
  responseCategory?: string;
  timeSpentSeconds: number;
  interactionSummary: string[];
};
```

Each React component translates raw UI interactions into this shared format. The learner model and composer should not require component-specific event details.

### Initial learner state

```ts
type LearnerState = {
  objectiveMastery: Record<string, number>;
  activeMisconceptions: string[];
  completedBlockIds: string[];
  recentInteractionTypes: string[];
  recentSuccessfulInteractionTypes: string[];
  scaffoldLevel: "high" | "medium" | "low";
};
```

The initial updater should be deterministic and explainable. It converts block outcomes into learner-state evidence. It does not choose the next learning block.

### Recomposition contract

Recomposition occurs after meaningful checkpoints rather than after every click. The composer receives completed outcomes, the updated learner state, remaining objectives, legal candidate blocks, and current constraints.

It returns a patch for only the unfinished lesson:

```ts
type BlueprintPatch = {
  preserveCompletedThroughStepId: string;
  replacementSteps: BlueprintStep[];
  reasonCodes: string[];
};
```

The verification layer must ensure that:

- Completed history is immutable.
- Required objectives remain covered.
- Prerequisites remain satisfied.
- The completion check remains present.
- The same failed assessment is not immediately repeated without support.
- Only registered blocks are inserted.
- The revised lesson remains within its time and accessibility constraints.

Deterministic code filters illegal choices. The AI chooses the particular legal activity or representation.

### Expected adaptive behavior

```text
Prediction correct
    -> graph interpretation
    -> harder circuit challenge

Prediction incorrect
    -> misconception visual
    -> simpler resistance experiment
    -> equivalent retry
```

These are illustrative outcomes, not a hardcoded branch table.

### Prototype 2 acceptance gate

Prototype 2 passes when:

- Correct, incorrect, and uncertain outcomes produce educationally appropriate differences in the remaining lesson.
- The AI, rather than a hardcoded routing table, chooses the specific legal blocks.
- Completed steps are never changed.
- Recomposition cannot bypass prerequisites or remove required assessment.
- An AI failure leaves the learner on a valid fallback path.
- The system can explain which evidence and constraints influenced recomposition.
- The learner can request another representation without receiving a permanent learning-style label.

## Initial implementation boundaries

Use a deliberately small full-stack web architecture:

- React and TypeScript for components and rendering.
- A server-side endpoint for the composer so model credentials never reach the browser.
- Versioned JSON or TypeScript files for the topic specification, block catalog, resources, and fallback blueprints.
- Runtime schema validation for all model responses.
- Structured model output rather than parsing conversational prose.
- Automated unit tests for schemas, validation, catalog filtering, and rendering.
- Browser tests for complete composition and recomposition scenarios.

Prototype 1 does not require:

- A database
- Learner accounts
- Teacher administration
- A large analytics system
- Internet resource search
- Multiple subjects
- Multiple AI agents
- AI-generated images or educational videos
- Open-ended chat
- A complete production design system

Temporary learner state can remain in memory or local browser storage during Prototype 2. Persistence should be introduced only when it supports real testing.

## Development sequence

### Phase 0: specification and content

Estimated effort: 2–3 focused days.

- Finalize the narrow Ohm's law objective.
- Define the topic, block, blueprint, patch, and validation schemas.
- Prepare the nine trusted blocks on paper.
- Define reason codes and composition rules.
- Create six evaluation scenarios.
- Obtain a science teacher's review.

### Phase 1: AI composition proof

Estimated effort: 7–10 development days.

- Establish the component registry and small block catalog.
- Render one human-authored blueprint to verify the renderer contract.
- Add the constrained AI composer.
- Add validation, repair, and fallback behavior.
- Build the Composer Lab.
- Run the Prototype 1 evaluation suite.
- Record a short proof demonstrating different assembled lessons.

### Phase 2: adaptive recomposition

Estimated effort: 10–14 development days.

- Add normalized interaction outcomes.
- Add the deterministic learner-state updater.
- Add checkpoint-based blueprint patching.
- Protect completed steps and required objectives.
- Exercise correct, incorrect, uncertain, and model-failure trajectories.
- Run the Prototype 2 evaluation suite.

### Phase 3: deeper circuits environment

Begin only after both technical gates pass.

- Expand into complete circuits, voltage/current relationships, series and parallel circuits, and troubleshooting.
- Add component types only when curriculum needs justify them.
- Improve composition using teacher and learner feedback.
- Introduce persistent anonymous learner profiles when testing requires them.
- Create the polished learner-facing experience while retaining the Composer Lab for inspection and debugging.

The final number of learning blocks should follow curriculum needs. It is not fixed before the central mechanism is validated.

### Phase 4: competition preparation

- Review the current ISTE+ASCD AI Innovator Challenge requirements with the teacher sponsor.
- Test with students and educators.
- Evaluate accessibility, privacy, reliability, lesson coherence, and preliminary learning outcomes.
- Compare AI-assembled lessons with a fixed lesson where feasible.
- Document early versions, failures, feedback, and improvements.
- Prepare the public prototype, pitch video, team story, source credits, and responsible-AI explanation.

## Testing strategy

### Schema and safety tests

- Unknown block ID is rejected.
- Invented resource ID is rejected.
- Missing completion check is rejected.
- Prerequisite violation is rejected.
- Excessive lesson duration is rejected.
- Unavailable block is rejected.
- Invalid structured output triggers repair.
- Second failure triggers the authored fallback.

### Composition tests

- Beginner and developing learner fixtures receive meaningfully different but valid compositions.
- Shorter duration produces a shorter coherent lesson.
- Removing a preferred modality causes substitution rather than failure.
- Required accessibility alternatives are honored.
- The same input remains educationally coherent across repeated calls; novelty alone is not a success metric.

### Renderer tests

- Every registered block can render from catalog data.
- Every valid blueprint can render without a code change.
- Unknown component types fail safely.
- Keyboard use and non-color-only communication are supported.
- Lesson progress remains consistent after a replan.

### Adaptation tests

- Correct prediction unlocks an appropriate harder activity.
- Misconception evidence produces support before retry.
- Completed history remains unchanged.
- Required objectives remain represented after multiple replans.
- Model timeout does not break the lesson.
- The explanation of a composition decision matches the actual inputs and selected metadata.

## Explicitly deferred ideas

The following are part of the longer-term vision but outside Prototype 1:

- A discovery system that gradually surfaces high-quality educational and curiosity content.
- Social-media or doomscrolling intervention features.
- Automatic internet search for learning resources.
- Arbitrary-topic curriculum generation.
- A large multi-agent architecture.
- A complete textbook replacement.
- Permanent learner categorization.

The possible future relationship is:

```text
Curiosity and discovery system
    -> learner chooses to explore further
    -> interactive learning composer builds a deeper experience
```

This future direction must not distract from proving constrained lesson composition first.

## Definition of the first successful demonstration

A successful demonstration should take less than two minutes:

1. Select the supported Ohm's law topic.
2. Choose a learner fixture and time constraint.
3. Select **Compose**.
4. Show the structured blueprint and successful validation.
5. Show the trusted React components rendered as a lesson.
6. Change the learner fixture or remove an available block.
7. Compose again and show a different valid interface without changing code.
8. In Prototype 2, answer a prediction incorrectly and show the AI safely restructure the unfinished lesson.

If the system can do this reliably, it has proven the project's central thesis:

> AI can adapt the learning environment itself, not merely the words inside a fixed interface.
