"use client";

import { useMemo, useState } from "react";
import { requestComposition } from "./client";
import { PrimitiveRenderer } from "./Primitives";
import { PersistentScene } from "./Scenes";
import { TextbookLesson } from "./TextbookLesson";
import type { ApiComposeRequest, BlockOutcome, ComposeResponse, DepthMinutes, InteractiveBlock, LearningGoal, LessonManifest } from "./types";
import styles from "./prototype4.module.css";

type Step = ComposeResponse["blueprint"]["remainingSteps"][number] & { outcome?: BlockOutcome };
type Props = {
  manifest: LessonManifest;
  goal: LearningGoal;
  depth: DepthMinutes;
  initialComposition: ComposeResponse;
  onRestart: () => void;
};

const reasonLabels: Record<string, string> = {
  "elicit-existing-model": "Collect evidence before explaining",
  "test-through-manipulation": "Turn the fixed source into an experiment",
  "offer-alternate-representation": "Show the same fact another way",
  "respond-to-misconception": "Insert support from learner evidence",
  "provide-guided-retry": "Retry with the important contrast visible",
  "connect-evidence-to-concept": "Name the rule after experience",
  "increase-challenge": "Move into a harder application",
  "confirm-transfer": "Test the relationship in a new situation",
};

export function LearningWorkspace({ manifest, goal, depth, initialComposition, onRestart }: Props) {
  const catalog = useMemo(() => new Map(manifest.blocks.map((block) => [block.id, block])), [manifest]);
  const [steps, setSteps] = useState<Step[]>(initialComposition.blueprint.remainingSteps);
  const [composition, setComposition] = useState(initialComposition);
  const [evidenceLog, setEvidenceLog] = useState<BlockOutcome[]>([]);
  const [runtime, setRuntime] = useState<Record<string, string | number>>({ ...manifest.initialRuntime });
  const [recomposed, setRecomposed] = useState(false);
  const [composing, setComposing] = useState(false);
  const [pathChanged, setPathChanged] = useState(false);
  const [showTextbook, setShowTextbook] = useState(false);
  const [showTrace, setShowTrace] = useState(false);

  const activeIndex = steps.findIndex((step) => !step.outcome);
  const activeStep = activeIndex >= 0 ? steps[activeIndex] : undefined;
  const activeBlock = activeStep ? catalog.get(activeStep.blockId) : undefined;
  const completed = steps.filter((step) => step.outcome).length;
  const complete = !composing && steps.length > 0 && activeIndex < 0;

  async function completeBlock(outcome: BlockOutcome) {
    if (!activeStep || activeStep.outcome || activeStep.blockId !== outcome.blockId || composing) return;
    const completedSteps = steps.map((step, index) => index === activeIndex ? { ...step, outcome } : step);
    const nextEvidence = [...evidenceLog, outcome];
    const shouldRecompose = activeBlock?.role === "evidence" && !recomposed;
    setEvidenceLog(nextEvidence);
    if (!shouldRecompose) {
      setSteps(completedSteps);
      return;
    }

    const completedPrefix = completedSteps.slice(0, activeIndex + 1);
    setSteps(completedPrefix);
    setComposing(true);
    setRecomposed(true);
    const request: ApiComposeRequest = { schemaVersion: "p4-api-1", lessonId: manifest.id, goal, depthMinutes: depth, evidenceLog: nextEvidence };
    try {
      const nextComposition = await requestComposition(request);
      setComposition(nextComposition);
      setSteps([...completedPrefix, ...nextComposition.blueprint.remainingSteps]);
      setPathChanged(true);
      window.setTimeout(() => setPathChanged(false), 2200);
    } finally {
      setComposing(false);
    }
  }

  const currentBlock = activeBlock as InteractiveBlock | undefined;
  return (
    <section className={styles.workspace} aria-label="Prototype 4 composed learning workspace">
      <header className={styles.workspaceHeader}>
        <div><span>Assembled from trusted {manifest.subject}</span><h1>{manifest.title}</h1></div>
        <nav><span>{goal} · {depth} min</span><button type="button" onClick={() => setShowTextbook(true)}>Textbook</button><button type="button" onClick={() => setShowTrace(true)}>Composition</button><button type="button" onClick={onRestart}>New lesson</button></nav>
      </header>
      <div className={styles.progressRail}>
        <div><b>{complete ? "✓" : String(Math.max(1, activeIndex + 1)).padStart(2, "0")}</b><span>{complete ? "Path complete" : activeBlock?.title}</span></div>
        <ol>{steps.map((step, index) => <li className={step.outcome ? styles.stepDone : index === activeIndex ? styles.stepActive : ""} key={`${step.blockId}-${index}`}><i /><span>{catalog.get(step.blockId)?.title}</span></li>)}</ol>
        <small>{completed}/{steps.length}</small>
      </div>
      <main className={`${styles.workspaceGrid} ${pathChanged ? styles.workspaceChanged : ""}`}>
        <aside className={styles.actionStage}>
          {currentBlock ? <PrimitiveRenderer block={currentBlock} runtime={runtime} onRuntime={(patch) => setRuntime((previous) => ({ ...previous, ...patch }))} onComplete={completeBlock} /> : null}
          {composing ? <div className={styles.composingNotice}><i /><span>Evidence received</span><strong>Recomposing what comes next…</strong></div> : null}
          {pathChanged ? <div className={styles.pathChangedNotice}>The unfinished environment changed.</div> : null}
        </aside>
        <section className={styles.liveSceneStage}>
          <header><span>Persistent trusted object</span><strong>{currentBlock?.shortPrompt ?? "The path is complete."}</strong></header>
          <PersistentScene sceneId={manifest.sceneId} runtime={runtime} active={!composing} />
          <footer><span>Scene never replaced</span><i /><span>Approved interactions attach here</span></footer>
        </section>
        <aside className={styles.evidenceStage}>
          <header><span>Live evidence</span><strong>{activeBlock?.primitiveId.replaceAll("-", " ") ?? "Complete"}</strong></header>
          <div className={styles.evidenceVisual}>
            <span>{manifest.subject === "physics" ? "SYSTEM VALUE" : "MEMBRANE STATE"}</span>
            <strong>{manifest.subject === "physics" ? `${(Number(runtime.voltage ?? 9) / Number(runtime.resistance ?? 4)).toFixed(2)} A` : String(runtime.cellState ?? "balanced")}</strong>
            <small>{activeStep ? reasonLabels[activeStep.reasonCode] : "Every representation came from the trusted catalog."}</small>
          </div>
          <div className={styles.sourcePins}><span>Preserved source</span>{composition.blueprint.preserveSourceBlockIds.map((id) => <b key={id}>{manifest.sourceBlocks.find((block) => block.id === id)?.title ?? id}</b>)}<span>Held until useful</span>{composition.blueprint.delaySourceBlockIds.map((id) => <b key={id}>{manifest.sourceBlocks.find((block) => block.id === id)?.title ?? id}</b>)}</div>
        </aside>
        {complete ? <div className={styles.workspaceComplete}><span>General engine · {manifest.subject}</span><h2>The fixed page became an environment you could test.</h2><p>Your evidence changed the unfinished path while every fact and interaction remained registered and trusted.</p><button type="button" onClick={() => setShowTextbook(true)}>Compare with the textbook →</button></div> : null}
      </main>
      {showTrace ? <aside className={styles.traceDrawer}><header><div><span>Constrained composition</span><strong>{composition.source === "ollama" ? "Local Ollama blueprint" : "Deterministic safe blueprint"}</strong></div><button type="button" onClick={() => setShowTrace(false)}>×</button></header><section><span>Provider</span><strong>{composition.model ?? composition.providerId}</strong><small>{composition.latencyMs} ms · {composition.source}</small></section><section><span>Legal candidates</span><small>{composition.candidateBlockIds.join(" · ")}</small></section><section><span>Selected path</span><ol>{steps.map((step) => <li key={step.blockId}><b>{catalog.get(step.blockId)?.title}</b><small>{reasonLabels[step.reasonCode]}</small></li>)}</ol></section><section><span>Validation</span><strong>{composition.validationErrors.length ? "AI rejected · fallback used" : "Blueprint accepted"}</strong><small>{composition.validationErrors.join(" · ") || "Strict schema and semantic rules passed."}</small></section></aside> : null}
      {showTextbook ? <div className={styles.modalBackdrop}><TextbookLesson manifest={manifest} composition={composition} modal onClose={() => setShowTextbook(false)} /></div> : null}
    </section>
  );
}
