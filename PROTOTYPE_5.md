# Prototype 5 — Source-Grounded Lesson Compiler

Prototype 5 is isolated at `/prototype-5`. It demonstrates a new stage before the adaptive composer:

```text
trusted structured source
→ independent 4B and 14B analysis
→ deterministic comparison
→ item-by-item human approval
→ representation planning
→ deterministic block factories
→ constrained learning composer
→ adaptive workspace
```

## What each AI does

- `qwen3:4b-instruct` independently extracts a fast, source-cited curriculum draft. It also remains the final learning-path composer.
- `qwen3:14b` independently extracts a second draft for quality comparison. After human approval, it proposes approved primitive/factory configurations.
- Neither analyzer is authoritative. Agreement is only a comparison label; a human must approve every item.
- Neither model generates HTML, CSS, coordinates, media, numerical values, learner mastery, or arbitrary component names.

The server validates exact text quotes and table IDs before any model output reaches review. A failed analyzer is shown as an explicit failure. The reviewer may continue with one validated model. A failed 14B representation planner offers a visible 4B retry and never switches silently.

## Local models

```powershell
ollama pull qwen3:4b-instruct
ollama pull qwen3:14b
ollama list
```

The current machine runs both models on CPU. Analysis is intentionally a background review step and may take several minutes.

## Run locally

This repository uses pnpm. From PowerShell:

```powershell
cd "C:\Users\user\Desktop\Program\Projects\ISTE+ASCD"
pnpm.cmd install
pnpm.cmd run dev
```

Then open `http://localhost:3000/prototype-5`.

If `pnpm.cmd` is not on your PATH, the bundled runtime used by Codex or Corepack can run it. Do not run `npm install` in this pnpm-managed project.

## Environment

Copy `.env.example` to `.env.local` if you want to override defaults. P5 defaults to:

```text
OLLAMA_BASE_URL=http://127.0.0.1:11434
P5_ANALYZER_FAST_MODEL=qwen3:4b-instruct
P5_ANALYZER_QUALITY_MODEL=qwen3:14b
P5_PLANNER_MODEL=qwen3:14b
P5_COMPOSER_MODEL=qwen3:4b-instruct
P5_FAST_TIMEOUT_MS=180000
P5_QUALITY_TIMEOUT_MS=420000
```

## API boundary

- `POST /api/prototype-5/analyze` accepts only a registered source ID and `fast`/`quality` profile.
- `POST /api/prototype-5/plan` revalidates the complete human-approved specification.
- `POST /api/prototype-5/compile` compiles only approved proposals through trusted factories.
- `POST /api/prototype-5/compose` selects only generated registered block IDs.

Clients cannot provide arbitrary Ollama model names.

## Evaluation

The browser evaluator is at `/prototype-5/evaluation`.

With the local server running:

```powershell
pnpm.cmd run p5:evaluate -- --profile quick
pnpm.cmd run p5:evaluate -- --profile full
```

Quick runs two sources through both analyzers. Full runs all five sources; because the models are CPU-only, it is a deliberate long-running evaluation.

## Scope boundary

P5 accepts only bundled structured sources. It does not support uploads, arbitrary documents, URLs, PDF/OCR, web search, generated media, accounts, databases, or silent AI approval.
