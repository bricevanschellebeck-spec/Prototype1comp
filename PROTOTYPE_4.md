# Prototype 4 — General Learning Recomposition

Prototype 4 is isolated at `/prototype-4`. It proves that one constrained
composition engine can operate across two manually trusted lessons:

- resistance and current;
- transport across a cell membrane.

The browser submits registered learner evidence. The server derives learner
state, legal candidates, and a compact composer prompt. Ollama may only select
approved IDs; strict deterministic validation rejects anything else and returns
a safe fallback using the identical blueprint schema.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000/prototype-4`.

Optional local configuration:

```text
P4_COMPOSER_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:4b-instruct
P4_COMPOSER_TIMEOUT_MS=45000
```

Set `P4_COMPOSER_PROVIDER=deterministic` when the local Ollama service is not
available. A Vercel deployment cannot reach Ollama on your own computer, so it
will safely fall back unless a future remotely reachable provider is added.

## Evaluate the local model

Use the separate browser report at `/prototype-4/evaluation`, or keep the app
running and execute:

```bash
npm run p4:evaluate -- --repeats 2
```

The evaluator runs the same six scenario families for each subject and reports
raw JSON validity, semantic validity, acceptable path selection, fallback use,
and latency.
