# Prototype 6.5 — Cross-Purpose UX Evaluation

This document accumulates learner-route findings before any large cross-route redesign. Immediate changes are limited to verified bugs, small universal usability fixes, and narrow route-specific refinements.

## Evaluation status

| Route | Status |
|---|---|
| I’m curious | Evaluated — first closure applied |
| I want to understand this | Evaluated — focused connection layer applied |
| I’m revising | Awaiting evaluation |
| I have a test | Awaiting evaluation |

## Cumulative comparison matrix

| Dimension | Curious | Understand | Revise | Test |
|---|---|---|---|---|
| Initial knowledge | Beginner; little or no circuit knowledge | May also know nothing | — | — |
| Main intention | Explore the core idea | Build genuine understanding | — | — |
| Initial information | Very light | Enough context for meaningful action | — | — |
| Information density | Light; meaning appears after interaction | Progressive, eventually conceptually complete | — | — |
| Guidance | Low-pressure, object-attached visual cues | Object-attached purpose, causal links, and experiment reasoning | — | — |
| Explanation timing | Mostly after discovery | Before when required, then after observation | — | — |
| Explanation depth | Concise | Causal and progressively complete | — | — |
| Technical depth | Relationship first; no formula required initially | Builds from intuitive meaning toward measurements, relationships, graph, and application | — | — |
| Technical terminology | Minimal | Progressive and eventually complete | — | — |
| Activity types | Wake circuit, manipulate resistance/voltage, predict after observing | Same strong interactions plus explicit causal and controlled-comparison layers | — | — |
| Experiment reasoning | Mostly observe | Make fixed, changed, and measured quantities explicit | — | — |
| Casual activities | High importance | High importance | — | — |
| Focus activities | Limited or moderate | More important later in the journey | — | — |
| Assessment pressure | Very low; prediction is framed as a testable idea | Low to moderate | — | — |
| Diagnostic timing | After hands-on observation; answer evidence withheld until commitment | After foundations and meaningful comparison | — | — |
| Reference visibility | Sparse; only discoveries the learner has made | More complete record built progressively | — | — |
| Adaptation style | Small cue or optional branch; avoid forced remediation | Preserve the scene while adding the missing connection or reason | — | — |
| Terminology | Everyday language first; names appear when meaningful | Learner language first; units and formal terms arrive in context | — | — |
| Scene complexity | One persistent circuit; objects introduced progressively | Same scene with stronger active/known attention hierarchy | — | — |
| Help behaviour | Highlight or alternate view before adding explanation | Explain the relevant causal connection without expanding every object | — | — |
| Success condition | Notice the causal pattern and leave with an optional next step | Connect actions, system changes, observations, and reasons; eventually cover required concepts | — | — |
| Main learner question | “What happens?” | “What happens, why, and how do the parts connect?” | — | — |
| Major confusion | Visible objects lacked meaning; switch action was weakly connected; stale 9 Ω state contradicted the voltage task | Route resembled Curious too closely; comparison structure and units lacked context | — | — |
| Strongest interaction | Resistance manipulation and learner-produced comparison | Voltage comparison with resistance held fixed | — | — |
| Weakest interaction | Prediction when its answer was already visible | Early foundation and causal connection around the first action | — | — |
| Micro reveal frequency | Sparse and optional; object click/focus remains available | Contextual facts appear when the object becomes meaningful | — | — |
| Concept reveal depth | One concise discovered relationship | Definition + representation + experiment + evidence + relationship | — | — |
| Reference density | Core ideas and major discoveries only | Progressively complete concept record | — | — |
| Reference update moment | After a meaningful discovery | After concept, comparison, experiment, formula, or application is established | — | — |
| Learner evidence preserved | Key observations | Measurements, comparisons, generated representations, and applications | — | — |
| Reference during assessment | Available unless it would reveal an answer | Available unless it would reveal an answer | — | Temporarily locked during an unanswered diagnostic |
| Optional detail | Short, learner-requested | Depth-aware and connected to the active concept | — | — |
| Reference risk | Must remain lightweight | Must connect ideas without becoming the main learning surface | — | — |

## Classified findings

### A. Real bugs

- The voltage activity could say resistance was fixed at 4 Ω while the scene still displayed a previous 9 Ω state.
- Resolution: activity bindings now provide one authoritative state used by the scene, controls, calculations, and evidence wording.

### B. Universal UX issues

- An action should be spatially connected to the object it controls. The open switch now receives a focused visual marker when “Close the gap” is active.
- Internal evidence language should not leak into the learner experience. Curious now says “What you discovered”; other routes retain purpose-appropriate wording pending their own evaluation.
- Curious and Understand now both confirm that circuit terminology must be introduced progressively, controls need distinct active/tested states, labels must connect to physical objects, and the current animation needs concise representational context.

### C. Curious-specific issues

- Current receives a short contextual introduction only after the circuit closes.
- The charge animation is described as a visual model of changes in current, not literal individual-electron speed.
- Misconception support remains light; Curious is not turned into a remediation route.

### C2. Understand-specific issues

- Understand should make more connections around the same useful interactions rather than merely adding more information.
- Creative titles remain, with a clear goal-specific purpose subtitle beneath them.
- After closing the circuit, a compact scene-attached chain connects switch closure → complete path → current flow → lamp response.
- The voltage stage introduces voltage intuitively before comparison, then exposes fixed resistance, changed voltage, and measured current.
- Tested battery states preserve their measured current and distinguish the currently active state.
- After both voltage values are tested, the learner’s measurements reveal “Higher voltage → greater current”; the rule is not shown beforehand.
- “Casual” and “Focus” remain valid internal activity metadata, while the learner surface now uses the clearer “Learn” and “Challenge” labels.

### D. Pedagogical issues

- Prior evidence that directly gives away a prediction must be temporarily withheld.
- Curious prediction now follows commitment → circuit test → evidence reveal.
- This is registered as a reusable activity information policy rather than a one-off CSS concealment.
- Understand follows context when needed → action → observation → causal explanation → concept connection.
- A controlled comparison should expose what is fixed, changed, and measured without becoming a theory panel.

### E. Optional suggestions deferred

- Direct dragging or clicking of the physical switch itself.
- A richer “Keep exploring / Learn why mathematically” branch at the end.
- More definitions for every visible object.

### F. Intentional behaviour

- Objects may be visible before their formal meaning is introduced.
- Quick Curious remains shorter than the complete technical route.
- Formula and technical vocabulary are not prerequisites for a successful Curious experience.
- Understand still uses progressive reveal; it does not preload six component definitions or turn into a textbook.
- The circuit remains persistent and creative activity titles remain part of the product voice.

### G. Living reference refinement

- The lesson is now the primary place where knowledge is experienced; the completed fixed textbook is no longer offered before or during the active journey.
- Level 1 micro reveals remain attached to one object at a time and are available by click or keyboard—not hover alone.
- Level 2 concept reveal keeps the circuit visible and connects voltage to the learner's own 9 V and 12 V measurements before the activity is completed.
- Level 3 `My lesson` starts empty and grows only after meaningful activity outcomes.
- Reference entries are stored in conceptually ordered sections rather than appended as a chronological activity feed.
- Trusted canonical knowledge and learner-generated evidence are rendered separately and retain distinct source metadata.
- Reference inclusion uses `introduced`, `explored`, `practised`, and `demonstrated` states; none is presented as mastery.
- Curious and Understand use the same system with different density. Revision and Test behaviour remains open for their dedicated evaluations, except for the universal safety rule that unanswered diagnostics cannot expose answer-like reference content.

## Cross-route decision rule

Every later finding must be classified as universal, purpose-specific, a bug, pedagogical, optional, or intentional before implementation. A beginner’s missing definition in Curious does not automatically justify revealing that definition in Revision or Test.

## Reusable validation requirements

1. Instruction state, rendered state, calculation state, and evidence state must come from the same registered activity runtime.
2. If visible prior evidence directly reveals an assessment answer, it must be hidden, collapsed, obscured, or delayed until commitment.
3. Essential action guidance must remain visible; optional explanation may be requested.
4. Information appears when it becomes meaningful, not merely when an object exists.

## Activity / exercise language experiment

This pass deliberately tests four patterns rather than creating a large exercise library. Each stays attached to the persistent circuit and has an explicit evidence contract stating what may—and may not—be inferred.

| Pattern | Activity | Casual / focus | Intended purpose | Learner action | Evidence collected | Natural? | Interrupts? | Better than a conventional question? | Problems | Decision |
|---|---|---|---|---|---|---|---|---|---|---|
| Compare / Connect | `c-compare` | Casual support | Understand, Revise, Test after a misconception | Inspect two 9 V states and isolate the changed resistor | Whether the learner controls for voltage and identifies resistance as the cause | To test | To test | To test | Must not appear as compulsory repetition after secure evidence | Evaluate |
| Evidence / Reason | `c-lab` | Casual learning | Curious, Understand; targeted support elsewhere | Produce measurements, then complete the relationship they show | Tested values plus interpretation of the learner's own pattern | To test | To test | To test | Graph and relationship prompt must remain visually connected | Evaluate |
| Apply / Solve | `c-target` | Focus challenge | Understand, Revise, Test | Configure resistance to reach 1.50 A at fixed voltage | Choice sequence, attempts, and guidance needed | To test | To test | To test | Guidance must not reveal the resistor too early | Evaluate |
| Repair / Debug | `c-repair` | Focus challenge | Revise and Test | Trace a dark circuit and repair only the open path | Whether the learner changes the fault instead of a working component | To test | To test | To test | Must follow prior exposure to complete-path knowledge | Evaluate |

The comparison is not part of the normal Understand path: it is inserted after inconsistent prediction evidence. Repair is excluded from Curious/Understand routes. The resistance lab embeds reasoning after manipulation, avoiding a separate quiz screen and keeping the total route compact.
