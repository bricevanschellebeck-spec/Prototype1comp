"use client";

import { useMemo, useState } from "react";
import { requestComposition } from "./client";
import { getLessonManifest } from "./manifests";
import { PersistentScene } from "./Scenes";
import { LearningWorkspace } from "./LearningWorkspace";
import { TextbookLesson } from "./TextbookLesson";
import { CuriosityBrand, DiscoveryHome } from "./DiscoveryHome";
import type { ApiComposeRequest, ComposeResponse, DepthMinutes, LearningGoal, LessonId } from "./types";
import styles from "./prototype4.module.css";

type Stage = "home" | "entry" | "purpose" | "depth" | "textbook" | "composing" | "workspace";
const goals: Array<{ id: LearningGoal; label: string; symbol: string }> = [
  { id: "explore", label: "I'm curious", symbol: "↗" },
  { id: "understand", label: "I need to understand this", symbol: "○" },
  { id: "revise", label: "I'm revising", symbol: "↻" },
  { id: "test", label: "I have a test", symbol: "✓" },
];
const depths: Array<{ value: DepthMinutes; label: string }> = [
  { value: 5, label: "Quick look" },
  { value: 15, label: "Learn it" },
  { value: 30, label: "Go deep" },
];

export function PrototypeFourLab() {
  const [stage, setStage] = useState<Stage>("home");
  const [lessonId, setLessonId] = useState<LessonId | null>(null);
  const [goal, setGoal] = useState<LearningGoal>("understand");
  const [depth, setDepth] = useState<DepthMinutes>(15);
  const [composition, setComposition] = useState<ComposeResponse | null>(null);
  const [composing, setComposing] = useState(false);
  const [setupTransitioning, setSetupTransitioning] = useState(false);
  const manifest = useMemo(() => lessonId ? getLessonManifest(lessonId) : null, [lessonId]);

  function reset() {
    setStage("home"); setLessonId(null); setComposition(null); setComposing(false); setSetupTransitioning(false);
  }

  function choosePurpose(nextGoal: LearningGoal) {
    if (setupTransitioning) return;
    setGoal(nextGoal);
    setSetupTransitioning(true);
    window.setTimeout(() => {
      setStage("depth");
      setSetupTransitioning(false);
    }, 260);
  }

  function chooseDepth(nextDepth: DepthMinutes) {
    if (setupTransitioning) return;
    setSetupTransitioning(true);
    window.setTimeout(() => {
      setSetupTransitioning(false);
      beginTextbook(nextDepth);
    }, 320);
  }

  function beginTextbook(nextDepth: DepthMinutes) {
    if (!lessonId) return;
    setDepth(nextDepth);
    setComposition(null);
    setComposing(true);
    setStage("textbook");
    const request: ApiComposeRequest = { schemaVersion: "p4-api-1", lessonId, goal, depthMinutes: nextDepth, evidenceLog: [] };
    void requestComposition(request).then((next) => {
      setComposition(next);
      setStage((current) => current === "composing" ? "workspace" : current);
    }).finally(() => setComposing(false));
  }

  if (stage === "workspace" && manifest && composition) return <LearningWorkspace key={`${manifest.id}-${goal}-${depth}`} manifest={manifest} goal={goal} depth={depth} initialComposition={composition} onRestart={reset} />;

  if (stage === "home") {
    return <DiscoveryHome onContinue={() => { setLessonId(null); setStage("entry"); window.scrollTo({ top: 0 }); }} />;
  }

  if (stage === "purpose" || stage === "depth") {
    const setupStep = stage === "purpose" ? "intent" : "depth";
    return (
      <div className={`setup-page focused-setup setup-${setupStep} stage-enter${setupTransitioning ? " setup-transitioning" : ""}`}>
        <header className="site-header compact-header">
          <CuriosityBrand />
          <button className="text-button" type="button" onClick={() => {
            if (setupTransitioning) return;
            setStage(stage === "depth" ? "purpose" : "entry");
          }}>
            {stage === "depth" ? "← Previous choice" : "← Back to lesson choice"}
          </button>
        </header>

        <main className="focused-setup-shell">
          <div className="setup-step-dots" aria-label={`Setup step ${stage === "purpose" ? 1 : 2} of 2`}>
            <span className={stage === "purpose" ? "active" : "complete"} />
            <span className={stage === "depth" ? "active" : ""} />
          </div>

          {stage === "purpose" ? (
            <section className="setup-scene setup-intent-scene" key="intent">
              <h1>What brings you here?</h1>
              <div className="intent-choice-grid">
                {goals.map((option, index) => (
                  <button type="button" key={option.id} aria-pressed={goal === option.id} onClick={() => choosePurpose(option.id)}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <i aria-hidden="true">{option.symbol}</i>
                    <strong>{option.label}</strong>
                    <small aria-hidden="true">→</small>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <section className="setup-scene setup-depth-scene" key="depth">
              <h1>How deep should we go?</h1>
              <div className="depth-choice-grid">
                {depths.map((option, index) => (
                  <button type="button" key={option.value} onClick={() => chooseDepth(option.value)}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{option.label}</strong>
                    <i aria-hidden="true">→</i>
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="setup-atmosphere" aria-hidden="true"><span /><span /><span /></div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.labShell}>
      <header className={styles.siteHeader}><div className={styles.brand}><i>✦</i><strong>Curiosity Lab</strong><span>PROTOTYPE 4</span></div><nav><a href="/prototype-3">Prototype 3</a><button type="button" onClick={reset}>{stage === "entry" ? "Back to the eye" : "Start over"}</button><a href="/prototype-4/evaluation">Evaluator</a></nav></header>
      {stage === "entry" ? <main className={styles.entryStage}><header><span>One engine · two structures</span><h1>Choose a trusted lesson to recompose.</h1><p>The AI receives the same kind of contract. The objects and interactions are fundamentally different.</p></header><div className={styles.lessonChoices}>{(["circuits-resistance-v1", "cell-membrane-transport-v1"] as LessonId[]).map((id, index) => { const item = getLessonManifest(id); return <button type="button" key={id} onClick={() => { setLessonId(id); setStage("purpose"); }}><div className={styles.lessonPreview}><PersistentScene sceneId={item.sceneId} runtime={item.initialRuntime} active compact /></div><span>0{index + 1} · {item.subject}</span><h2>{item.title}</h2><small>{id === "circuits-resistance-v1" ? "numeric · continuous · graph" : "spatial · categorical · sequence"}</small><i>→</i></button>; })}</div><footer><span>trusted knowledge</span><i>→</i><span>registered primitives</span><i>→</i><strong>constrained composition</strong></footer></main> : null}
      {stage === "textbook" && manifest ? <main className={styles.textbookStage}><TextbookLesson manifest={manifest} composition={composition} composing={composing} onBuild={() => { if (composition) setStage("workspace"); else setStage("composing"); }} /></main> : null}
      {stage === "composing" ? <div className={styles.transformOverlay}><i /><span>Trusted blocks selected</span><h2>Assembling the interactive vocabulary…</h2><p>The source stays fixed. Only its approved representation changes.</p></div> : null}
    </div>
  );
}
