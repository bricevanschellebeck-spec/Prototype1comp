# Prototype 5 — Source-Grounded Lesson Compiler

P5 lives at `/prototype-5`. Prototypes 1–4 retain their existing code.

## Current journey

Trusted chemistry source → Qwen 4B analysis → human approval → Qwen 4B representation planning → human approval → deterministic compilation → Qwen 4B path composition → interactive workspace.

The comparison experiment with a larger model is paused. The learner flow runs one analyzer, not two. Comparison utilities remain available for future evaluations, but no P5 request loads a larger model.

The representation planner no longer invents table IDs, column IDs, factory configuration, or whole block objects. Deterministic code first derives a legal, source-bound candidate set from the approved specification. Qwen selects candidate IDs and an order; the server then expands those choices into exact factory configurations and validates the completed plan. The learning composer follows the same pattern: Qwen selects from exact legal compiled block IDs, while the server assigns the trusted reason text and rejects unknown, duplicate, or structurally invalid paths.

## Local AI and computer load

All P5 calls use **qwen3:4b-instruct**. Legacy `P5_ANALYZER_QUALITY_MODEL`, `P5_PLANNER_MODEL`, and other model overrides are ignored in this mode, including old environment files that still name a larger model.

The source laboratory now performs a live `/api/prototype-5/status` check and displays whether Ollama is reachable, the 4B model is installed, and the model is already warm. This is a real provider check rather than a decorative status label.

Phase changes, textbook page turns, compiler activity, newly revealed evidence, dialogs, and learner-path changes use one shared motion language. `prefers-reduced-motion` disables these transitions without changing the workflow.

The shared provider in `src/prototype5/localModel.ts`:
- permits one generation at a time per server process;
- limits generation to two CPU threads;
- requests no reasoning output;
- releases the model after one idle minute;
- exposes an interface for a future cloud provider.

This reduces concurrent work and idle memory use; it does not guarantee fast inference. A 4B model can still be demanding on a CPU-only computer. Analysis/planning allow up to three minutes by default, including one correction attempt. Composition allows 60 seconds and returns a validated deterministic fallback if necessary.

Analysis and planning have stop/retry controls. Browser cancellation is forwarded to the server model request. A validated analysis is cached in the tab session, keyed by the exact bundled source, so refreshing does not require another analysis. Human approvals are still required.

No installed Ollama models are deleted. The larger model is removed from P5's active configuration only.

## Run

This repository uses pnpm. In PowerShell:

```powershell
cd "C:\Users\user\Desktop\Program\Projects\ISTE+ASCD"
pnpm.cmd install
pnpm.cmd run dev
```

Open `http://localhost:3000/prototype-5`.

If dependencies are already installed, `npm.cmd run dev` also runs the existing dev script. Avoid mixing npm install with the pnpm lockfile.

Required local model: `ollama pull qwen3:4b-instruct`.

## Configuration

```text
OLLAMA_BASE_URL=http://127.0.0.1:11434
P5_FAST_TIMEOUT_MS=180000
P5_COMPILATION_SECRET=
```

The optional signing secret is server-only. Locally, a random per-process key is used; restarting the server requires compiling the approved representations again. A deployment with multiple instances needs the same secret on every instance. Keep it in environment variables, never in source control.

A hosted server cannot reach Ollama on your personal computer. Analysis and planning show explicit failures if it is unavailable; they never invent an approved curriculum. Cloud API integration remains pending.

## Trust and learning behavior

- Exact quote/table citations and strict schemas are checked before review.
- Source-derived claims and pedagogical proposals remain separate.
- Compilation requires an explicit list of approved proposals, an evidence activity, an observation/support activity, and an application.
- Representation candidates are built from approved source IDs before AI is called. AI chooses among them; it cannot manufacture factory inputs.
- The server signs its compiled manifest. Composition rejects an unsigned or modified manifest.
- Both AI and deterministic paths use the same blueprint validation.
- Learner evidence rejects unknown blocks, duplicate outcomes, unknown misconceptions, and incompatible result types.
- Predictions refer to the configured approved relationship. The answer is not printed before submission.
- Experiments and graph points omit reserved challenge rows. The source reference still contains the complete original table.
- A wrong answer is recorded as evidence. The workspace gives feedback and can recompose after evidence/support checkpoints; final results distinguish an incorrect application.
- The source and composition dialogs preserve lesson state, support Escape, and use native modal focus management.
- The persistent scene and plot derive labels/columns from trusted data. No continuous reaction law or interpolation is invented.

Classification is temporarily excluded from the available factory catalog: its current configuration lacks a trusted answer mapping. Sequencing is accepted only for an approved connected sequence and checks the selected order.

## Evaluation and verification

```powershell
npm.cmd test
npx.cmd eslint src/prototype5 src/app/prototype-5 src/app/api/prototype-5
npx.cmd tsc --noEmit
npm.cmd run build
pnpm.cmd run p5:evaluate -- --profile quick
```

Quick evaluation runs 4B once on each of two sources. Full evaluation uses five sources and the 4B planner. These are deliberately manual model benchmarks, not prerequisites for using the site.

Reported schema/citation rates describe validated responses, potentially after correction. They are not fact-precision or learning-effectiveness measurements. Human semantic review remains necessary.

## Deferred

Cloud API credentials/providers, dual-model benchmarking, document uploads, PDF/OCR, internet discovery, generated media, accounts, and unrestricted topics.
