# Prototype 3: Constrained Local-AI Composition

Prototype 3 is isolated at `/prototype-3`. Prototype 1 remains at `/`, and
Prototype 2 remains at `/prototype-2`.

## What this prototype proves

The demonstration begins with a short, conventional, human-written circuits
lesson. The learner then selects **Build an interactive path**. A local Ollama
model receives only:

- the approved resistance/current objective and seven trusted facts;
- the learner's goal, depth, and latest interaction evidence;
- metadata for the currently legal registered blocks;
- a strict structured-output schema.

The model returns a lesson blueprint containing block IDs and reason codes. It
does not return HTML, React properties, explanations, images, or educational
media. Deterministic code validates the blueprint before React renders known
components.

The fixed textbook is also expressed as five visible trusted source pieces:

```text
circuit figure       -> live circuit
concept definitions  -> labels attached to circuit objects
relationship         -> responsive experiment and graph
Ohm's law            -> delayed formula application
prediction question  -> learner-evidence interaction
```

After composition, the interface briefly displays the real validated response:
model or fallback source, learner goal and depth, selected block order, reason
codes, and whether the formula representation was delayed. The same evidence
remains available through **View composer** in the assembled workspace.

```text
trusted textbook facts + learner state + legal block catalog
  -> Ollama selects and sequences block IDs
  -> deterministic schema and semantic validation
  -> registered React components render
  -> learner evidence
  -> Ollama recomposes only the unfinished path
```

The learning workspace is deliberately object-first. The circuit, resistance
controls, live current, graphs, and challenges are the main experience. The
right-side trace contains more text because it exposes the composition proof
for teachers and developers.

## Run with the installed Ollama model

Ollama is installed on this computer with `qwen3:4b-instruct`. Start Ollama if
it is not already running, then run the Next.js development server:

```powershell
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" serve
npm run dev
```

Open `http://localhost:3000/prototype-3`.

The defaults are:

```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:4b-instruct
```

They can be overridden in `.env.local`, but no API key is required. Do not
commit `.env.local`.

## Safe offline fallback

If Ollama is stopped, slow, or returns an invalid plan, the experience still
works using a small human-authored deterministic blueprint. The engine trace
clearly labels whether the current composition came from **Local Ollama AI** or
the **Verified fallback**. An invalid AI response never reaches the renderer.

## Important deployment limitation

The local Ollama integration works when Next.js runs on this computer. A Vercel
deployment cannot connect to `127.0.0.1` on this computer, so the deployed copy
will use the verified fallback unless a separately hosted model endpoint is
added later. Prototype 3 does not need that for the local teacher demonstration.

## Demonstration path

1. Open `/prototype-3` and choose the Electricity sector.
2. Pick a purpose and depth.
3. Briefly show the conventional source lesson.
4. Select **Build an interactive path**.
5. Point out that the circuit interactions are registered components and the
   trace reports the local model and selected block sequence.
6. Complete the prediction correctly to get the shorter graph/challenge path.
7. Restart and answer incorrectly (or use a hint) to show remediation and retry
   inserted into the unfinished path.

## Verification

```powershell
npm test
npx eslint src/prototype3 src/app/prototype-3 src/app/api/prototype-3
npm run build
```
