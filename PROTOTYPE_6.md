# Prototype 6 — Autonomous Learning Experience Assembler

Prototype 6 tests whether AI can design a complete interactive learning experience after a human-approved knowledge boundary. Its demonstration lesson is **How resistance changes current**.

## Core distinction

Prototype 5 compiled human-approved representation proposals. Prototype 6 gives the model approved facts, relationships, objectives, variables, numerical domains, derivations, and a primitive vocabulary—then asks it to design the stages, their configurations, grounded wording, dependencies, alternatives, and sequence.

The model never supplies executable code or calculated answers. React renders registered primitives, and deterministic code calculates every result from the approved domains.

```text
approved circuit knowledge
→ Gemini or Qwen designs a structured experience
→ strict schema and semantic validation
→ signed blueprint
→ deterministic primitive compilation
→ signed executable manifest
→ learner interaction and evidence
→ the selected AI recomposes only unused stages
```

## Run locally

```powershell
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000/prototype-6`.

Create `.env.local` in the project root and add your Gemini key:

```text
P6_AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_from_google_ai_studio
GEMINI_MODEL=gemini-3.5-flash-lite
P6_DESIGN_TIMEOUT_MS=480000
P6_COMPILATION_SECRET=a-private-random-value
```

`.env.local` is ignored by Git. Do not put the real key in `.env.example`, source code, a screenshot, or a chat message. Restart the development server after changing it.

To use the slower local provider instead, set `P6_AI_PROVIDER=ollama`, run `ollama serve`, and install `qwen3:4b-instruct`. If the selected provider is unavailable or the design remains invalid after one correction, P6 reports an explicit failure. It does not silently switch models or disguise a hard-coded lesson as AI output.

## Evaluation

With the development server running:

```powershell
npm.cmd run p6:evaluate -- --profile quick
npm.cmd run p6:evaluate -- --profile full
```

Quick evaluation runs Explore, Understand, Revise, and Test once. Full evaluation runs each three times. The evaluator reports validation, correction, compilation, latency, and structural variation.

The command-line evaluator requires a connected Gemini provider for its live goal-mode report. It records primitive order, stage roles, support alternatives, final application type, delayed facts, and omitted facts for every accepted blueprint. Reports are written to `reports/` as JSON and Markdown. Goal-to-goal difference is an evaluation signal only; it is deliberately not a runtime validation rule.

The browser evaluator is available at `http://localhost:3000/prototype-6/evaluation`.

## Safety boundary

- Only registered source, concept, fact, relationship, objective, misconception, variable, value, derivation, scene, and primitive IDs are accepted.
- All instructional copy must cite approved facts or relationships and remain within short length limits.
- Unknown numbers, units, markup, URLs, code, cyclic dependencies, invalid controls, missing evidence, missing application, and unsupported stages are rejected.
- Blueprint and compiled-manifest signatures detect changes between stages of the pipeline.
- Review mode exposes grounding and design reasons but never chain-of-thought.
- Previously completed stages are preserved during adaptation.

## Representation gaps

Every registered primitive declares generic capabilities such as `variable-manipulation`, `quantitative-trend`, `contrast`, or `directional-reasoning`. A selected objective is accounted for by either an initial learning stage or one validated `representationGap`, never both.

A gap is accepted only when:

- it references a selected, trusted objective;
- its normalized missing capability is known to P6;
- no currently registered primitive supplies that capability; and
- the same objective is not already covered by the initial lesson.

Accepted gaps survive compilation and signing and appear in **Why was this lesson built this way?** with their objective, missing capability, reason code, registry availability, and validation status. They remain inspectable limitations; P6 does not generate a substitute component or fake learner interaction.

P6 is isolated under `src/prototype6`, `src/app/prototype-6`, and `src/app/api/prototype-6`. It does not import or modify earlier prototype lesson manifests.
