# Prototype 6.5 — Learning Experience Language

Prototype 6.5 asks one question: **would this still be an excellent way to learn if the AI architecture were ignored?** It is an isolated learner-experience refinement at `/prototype-6-5`; Prototype 6 remains frozen.

## Experience architecture

```text
subject → purpose → depth
                    ↓
          persistent learning scene
                    ↓
       meaningful action or observation
                    ↓
      concept-specific evidence is recorded
                    ↓
       smallest useful adaptation is chosen
                    ↓
  unfinished activity path and scene may change
                    ↓
     personal reference grows from discoveries
```

The main canvas never behaves like a stack of slides. A circuit or historical archive remains mounted while controls, measurements, comparisons, sources, relationships, formulas, and challenges attach to it. Activities complete through meaningful actions; there is no generic `Next` loop.

## Learning-design vocabulary

Every activity describes four independent decisions:

1. **Family** — discover/explore, predict/test, manipulate/build, compare/connect, recall/identify, apply/solve, evidence/reason, or create/demonstrate.
2. **Purpose** — `casual` evidence embedded in learning, or a `focus` demonstration of precise or transferable understanding.
3. **Freedom** — strict `guided-learning`, goal-based `guided-challenge`, or optional open `playground`.
4. **Representation** — a live system, comparison, learner-created data, timeline, cause network, or source evidence.

Each activity also declares the scene transition it needs, the concepts and evidence channel it observes, legal adaptation options, goal/depth eligibility, and contributions it can add to the learner's reference. `P65LearningExperienceBlueprint` records the subset of this language a future P6 AI designer may target. It contains declarative IDs only; it does not allow generated React, CSS, SVG, or arbitrary code.

## Purpose and depth

Purpose now changes the executable activity selection, ordering, information policy, adaptation, completion conditions, and reference—not labels alone. Activities declare a generic stage role (`foundation`, `diagnostic`, `explore`, `representation`, `application`, `transfer`, or `extension`) plus technical level and prerequisites. A purpose profile orders and filters those roles; the depth profile supplies the technical ceiling and activity budget.

The current circuit demonstration makes the structural difference inspectable from the workspace mode switcher:

| Profile | Initial path |
|---|---|
| Curious · Quick look | Wake circuit → two-state resistance discovery |
| Understand · Learn it | Closed path → voltage comparison → prediction → three-state evidence → application |
| Revise · Learn it | Diagnostic prediction → application; evidence lab appears only after a detected gap |
| Test · Go deep | Diagnostic prediction → focused application → transfer; explanatory formula is held until evidence or requested support |

The same role-based selector is used for both registered subjects; there are not four separate circuit lessons.

Purpose biases are:

- **Curious** favors discovery, casual checks, and optional exploration.
- **Understand** combines guided discovery, causal explanation, casual evidence, focus application, and optional exploration.
- **Revise** begins with diagnostic evidence, collapses secure repetition, and adds support only where needed.
- **Test** keeps diagnostic/focus work and removes most introductory exposition.

Depth composes with purpose:

- **Quick look** keeps the core relationship and one or two meaningful actions.
- **Learn it** includes a normal guided experience and a focus application.
- **Go deep** includes additional representation, transfer, and optional playground work.

Depth also changes activity completion: the curious quick experiment needs two contrasting observations, the normal experiment needs three, and a deep non-curious investigation needs all four approved circuit states. It expands experience and evidence rather than merely lengthening paragraphs.

## Evidence and adaptation

Evidence is concept-specific and qualitative. It records the activity, concepts, channel (`natural`, `diagnostic`, or `self-report`), outcome, attempts, guidance reached, and a human-readable observation. The derived understanding states are `uncertain`, `misconception-evidence`, `supported`, and `strong-evidence`; no mastery percentage or permanent learner label exists.

Adaptation follows this order of preference:

```text
representation → activity → scene complexity → guidance → sequence → depth → wording
```

The prototype implements the smallest-useful-change principle:

- A wrong circuit prediction keeps the original circuit and adds a same-voltage comparison before manipulation.
- An unsupported historical cause keeps the timeline and inserts primary-source evidence into the unfinished path.
- Strong revision evidence may collapse an unnecessary basic experiment.
- Repeated challenge misses reveal the six-step guidance ladder incrementally rather than exposing the answer immediately.
- Completed activities and their evidence never get recomposed.

## Persistent scenes

### Circuit continuum

The battery, switch, resistor, current path, lamp, and measurement graph share one scene. Closing the path starts visible charge movement. Changing resistance updates current. Learner measurements create the graph. The formal equation appears only after sufficient context. A focus mission asks the learner to reach 1.50 A with a fixed 9 V battery.

### History continuum

The timeline, event markers, cause network, source fragments, and learner-built cause chain share one archive scene. The learner reveals chronology, tests a causal connection, selects direct source evidence, and constructs a defensible explanation. This proves the vocabulary does not force simulation onto history.

## Living reference

`My lesson` begins empty. A small living-reference companion remains visible in the learning scene: object hover, focus, click, and tap produce temporary contextual previews, while meaningful outcomes add durable concept sections, trusted explanations, relationships, representations, and learner-produced evidence. A preview is explicitly not treated as learned knowledge.

The session model is structured rather than a Markdown transcript. Each conceptually ordered section records its knowledge status (`introduced`, `explored`, `practised`, or `demonstrated`), canonical knowledge, learner evidence, representations, relationships, and trusted fact/relationship IDs. Inclusion is deliberately separate from the learner-evidence model and never implies mastery.

When no object is being inspected, the companion returns to the current learning concept or latest important learning event. Its compact `My lesson` history reopens accumulated entries in place; major concepts can expand along the edge without hiding the persistent scene. Curious keeps this layer small, Understand uses it more actively, and Test temporarily suppresses answer-like reference content during an unanswered diagnostic. The former fixed textbook appears only after the active journey as an optional prototype comparison. Nothing persists across sessions yet, but the model can later sit behind a persistent subject reference without changing its basic separation of trusted knowledge and learner evidence.

## Progressive information reveal

Objects now expose three distinct levels instead of arriving with a complete glossary attached:

1. **Identity** — a compact name and live value is visible after the object has been introduced.
2. **Context** — one short explanation appears beside the object only when the current activity makes it meaningful.
3. **Living reference** — once a meaningful knowledge unit is established, it enters its conceptual home in `My lesson`, together with relevant learner-produced evidence.

Optional object detail remains available inside the micro-reveal layer. Major ideas use a larger concept reveal: the scene stays visible while definition, representation, learner observation, relationship, and evidence are connected. The voltage comparison demonstrates this by keeping both measurements visible until the learner deliberately preserves the discovery.

Every activity declares which objects are active, which objects it introduces, the target of its contextual explanation, and whether that explanation should appear immediately, after an action, or only after struggle. The scene derives `active`, `known`, and `future` knowledge states from that metadata and completed activities. Future labels remain absent; known labels become quiet context; the current object receives visual attention.

Purpose and depth regulate density. Quick, revision, and test journeys keep optional detail terse. Learn-it journeys reveal the mechanism when requested. Go-deep journeys make an additional advanced layer available without placing it permanently on the canvas. Test and revision modes withhold answer-like contextual help until evidence indicates that support is needed. Support expands only the relevant object.

The circuit therefore begins with the battery, switch, lamp, and path. Current becomes visible when the learner closes the path; the resistor is formally introduced only when resistance matters; the graph grows from measurements; and Ohm's law remains delayed until application. The history scene applies the same language to timeline markers, causes, sources, and the final causal chain.

## Contextual assistance and side paths

The bottom context bar is not a chatbot. It can reduce scene complexity, highlight the relevant object, add an alternate representation, give one concise reason, or open a trusted side branch. A side branch saves the return point and closes with its button or Escape. It never invents unsupported knowledge.

## Quality rules

The executable rules in `src/prototype65/evidence.ts` require object-led explanation, discovery before formalism when appropriate, persistent visual continuity, visible instructions, learner-produced evidence, minimal adaptation, representation change after failure, non-numerical understanding, and subject-appropriate environments. They explicitly reject walls of text, pointless repetition, fake interactivity, hover-hidden instructions, permanent learner labels, and physics-style simulation forced onto other subjects.

## Demonstration

Run the local app and open `http://localhost:3000/prototype-6-5`.

### Circuit recovery path

1. Choose **Resistance and current** → **I want to understand** → **Learn it**.
2. Close the switch.
3. Deliberately predict **increases**.
4. Observe the same-voltage comparison attach to the persistent circuit.
5. Collect three resistor measurements; the learner-generated graph appears.
6. In the 1.50 A mission, choose 3 Ω once, observe level-one guidance, then choose 6 Ω.
7. Open **My lesson** to see the reference created by that journey.

### History recovery path

1. Choose **The road to the Moon** → **I want to understand** → **Go deep**.
2. Reveal the four events.
3. Choose the telescope explanation.
4. Observe source comparison inserted into the unfinished path while the timeline remains.
5. Try Source A, then recover with Source B.
6. Build `Competition → commitment → Apollo 11` and explore one optional thread.

## Current boundary

P6.5 uses manually designed gold lessons and deterministic evidence/adaptation rules. It does not perform web research, generate components, infer long-term traits, or ask an AI to create these new patterns. Before P7, the P6 autonomous designer should adopt this vocabulary and be evaluated against these two reference experiences. More work is still needed on mobile layouts, richer keyboard operation inside graphical objects, learner-authored side questions, and validation of the design language across additional non-simulation subjects.

The cumulative four-purpose learner evaluation is tracked in [PROTOTYPE_6_5_EVALUATION.md](./PROTOTYPE_6_5_EVALUATION.md). Large cross-route changes remain deferred until all four purpose evaluations are recorded.

## Activity-language experiment

Each activity now carries an evidence contract: concept, learner action, observed evidence, reasonable inference, forbidden over-inference, and smallest adaptation response. This prevents one successful action from being interpreted as complete mastery.

The circuit tests a deliberately small reusable vocabulary:

- **Compare:** inconsistent prediction evidence inserts two same-voltage circuit states into the existing scene.
- **Evidence / reason:** the resistance experiment ends by interpreting the learner's own measurements, not merely by clicking enough values.
- **Target challenge:** the learner configures the live circuit toward 1.50 A instead of answering an isolated formula question.
- **Repair / debug:** Revision and Test can present the persistent circuit in a fault state and ask the learner to repair only the broken path.

These patterns are not all forced into one route. Comparison is evidence-triggered, repair is purpose-specific, and the default Understand route remains compact.
