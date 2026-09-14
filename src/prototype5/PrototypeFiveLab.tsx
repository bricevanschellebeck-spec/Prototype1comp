"use client";

import { useEffect, useRef, useState } from "react";
import { requestAnalysis, requestCompile, requestP5Composition, requestP5ModelStatus, requestPlan } from "./client";
import { validateAnalysisDraft } from "./contracts";
import { groupsFromSingleDraft } from "./comparison";
import { AnalysisReview } from "./AnalysisReview";
import { LearningWorkspace } from "./LearningWorkspace";
import { P5Brand, P5DiscoveryHome } from "./P5DiscoveryHome";
import { RepresentationReview } from "./RepresentationReview";
import { SourceBook } from "./SourceBook";
import { reactionRateSource } from "./sources";
import type { AnalysisResult, ApprovedLearningSpec, CompiledLessonManifest, DepthMinutes, LearningGoal, P5ComposeResponse, RepresentationPlanDraft } from "./types";
import styles from "./prototype5.module.css";
import type { P5ModelStatus } from "./localModel";

type Stage = "home" | "source" | "analysis" | "review" | "planning" | "representation-review" | "purpose" | "depth" | "composing" | "workspace";
const goals: Array<{ id: LearningGoal; label: string; symbol: string }> = [{ id: "explore", label: "I'm curious", symbol: "↗" }, { id: "understand", label: "I need to understand this", symbol: "○" }, { id: "revise", label: "I'm revising", symbol: "↻" }, { id: "test", label: "I have a test", symbol: "✓" }];
const depths: Array<{ value: DepthMinutes; label: string }> = [{ value: 5, label: "Quick look" }, { value: 15, label: "Learn it" }, { value: 30, label: "Go deep" }];

function cachedAnalysis(): AnalysisResult | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem("p5-analysis-4b") || "null");
    if (saved?.source === JSON.stringify(reactionRateSource) && saved?.result?.modelId === "qwen3:4b-instruct" && validateAnalysisDraft(reactionRateSource, saved.result.draft).valid) return saved.result;
  } catch { /* Storage is optional. */ }
  return null;
}

export function PrototypeFiveLab() {
  const [stage, setStage] = useState<Stage>("home");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(cachedAnalysis);
  const [spec, setSpec] = useState<ApprovedLearningSpec | null>(null);
  const [plan, setPlan] = useState<RepresentationPlanDraft | null>(null);
  const [manifest, setManifest] = useState<CompiledLessonManifest | null>(null);
  const [goal, setGoal] = useState<LearningGoal>("understand");
  const [depth, setDepth] = useState<DepthMinutes>(15);
  const [composition, setComposition] = useState<P5ComposeResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [modelStatus, setModelStatus] = useState<P5ModelStatus | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    const statusController = new AbortController();
    void requestP5ModelStatus(statusController.signal)
      .then(setModelStatus)
      .catch(() => setModelStatus({ connected: false, installed: false, loaded: false, model: "qwen3:4b-instruct", provider: "ollama", message: "The local AI connection could not be checked." }));
    return () => statusController.abort();
  }, []);
  useEffect(() => {
    if (!busy) return;
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [busy]);

  function cancel() {
    controller.current?.abort(); controller.current = null;
    setBusy(false); setError("Stopped. You can retry when you’re ready.");
  }
  function reset() {
    cancel(); setStage("home"); setAnalysis(null); setSpec(null);
    setPlan(null); setManifest(null); setComposition(null); setError("");
  }
  async function run(task: (signal: AbortSignal) => Promise<void>) {
    if (controller.current) return;
    const operation = new AbortController(); controller.current = operation;
    setBusy(true); setElapsed(0); setError("");
    try { await task(operation.signal); }
    catch (caught) { if (!operation.signal.aborted) setError(caught instanceof Error ? caught.message : "The request failed. Please retry."); }
    finally { if (controller.current === operation) { controller.current = null; setBusy(false); } }
  }
  async function analyze() {
    await run(async (signal) => {
      const result = await requestAnalysis(reactionRateSource.id, "fast", signal);
      if (signal.aborted) return;
      setAnalysis(result);
      if (result.status === "accepted") {
        try { sessionStorage.setItem("p5-analysis-4b", JSON.stringify({ source: JSON.stringify(reactionRateSource), result })); } catch { /* Continue without caching. */ }
      }
      if (result.status === "failed") setError([result.failureReason, ...result.validationErrors].filter(Boolean).join(" "));
    });
  }
  async function planFrom(approved: ApprovedLearningSpec) {
    setSpec(approved); setStage("planning");
    await run(async (signal) => {
      const result = await requestPlan(approved, "fast", signal);
      if (signal.aborted) return;
      if (result.status === "accepted" && result.draft) { setPlan(result.draft); setStage("representation-review"); }
      else setError([result.failureReason, ...result.validationErrors].filter(Boolean).join(" "));
    });
  }
  async function compile(ids: string[]) {
    if (!spec || !plan) return;
    const result = await requestCompile(spec, plan, ids);
    setManifest(result.manifest); setStage("purpose");
  }
  async function beginComposition(value: DepthMinutes) {
    if (!manifest || busy) return;
    setDepth(value); setStage("composing");
    await run(async (signal) => {
      const result = await requestP5Composition(manifest, goal, value, [], signal);
      if (signal.aborted) return;
      setComposition(result); setStage("workspace");
    });
  }

  if (stage === "home") return <P5DiscoveryHome onContinue={() => setStage("source")}/>;
  if (stage === "workspace" && manifest && composition) return <LearningWorkspace manifest={manifest} goal={goal} depth={depth} initialComposition={composition} onRestart={reset}/>;
  if (stage === "review" && analysis?.draft) return <AnalysisReview source={reactionRateSource} groups={groupsFromSingleDraft(analysis.draft, "fast")} onApproved={(approved) => void planFrom(approved)}/>;
  if (stage === "representation-review" && spec && plan) return <RepresentationReview spec={spec} plan={plan} modelId="qwen3:4b-instruct" onCompile={compile} onReplan={() => void planFrom(spec)}/>;
  if (stage === "purpose" || stage === "depth") return <div key={stage} className={`setup-page focused-setup setup-${stage === "purpose" ? "intent" : "depth"} stage-enter`}>
    <header className="site-header compact-header"><P5Brand/><button className="text-button" onClick={() => setStage(stage === "depth" ? "purpose" : "representation-review")}>← Previous choice</button></header>
    <main className="focused-setup-shell"><div className="setup-step-dots"><span className={stage === "purpose" ? "active" : "complete"}/><span className={stage === "depth" ? "active" : ""}/></div>
      {stage === "purpose" ? <section className="setup-scene setup-intent-scene"><h1>What brings you here?</h1><div className="intent-choice-grid">{goals.map((item, index) => <button key={item.id} onClick={() => { setGoal(item.id); setStage("depth"); }}><span>{String(index + 1).padStart(2, "0")}</span><i>{item.symbol}</i><strong>{item.label}</strong><small>→</small></button>)}</div></section>
        : <section className="setup-scene setup-depth-scene"><h1>How deep should we go?</h1><div className="depth-choice-grid">{depths.map((item, index) => <button key={item.value} onClick={() => void beginComposition(item.value)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.label}</strong><i>→</i></button>)}</div></section>}
      <div className="setup-atmosphere"><span/><span/><span/></div>
    </main>
  </div>;

  return <div className={styles.labShell}>
    <header className={styles.siteHeader}><P5Brand/><nav><button onClick={reset}>Back to eye</button><a href="/prototype-5/evaluation">Evaluator</a></nav></header>
    {stage === "source" ? <SourceBook source={reactionRateSource} onStart={() => setStage("analysis")}/> : null}
    {stage === "analysis" ? <main className={`${styles.analysisStage} ${styles.stageSurface}`}>
      <header><span>SOURCE LABORATORY · LOCAL 4B</span><h1>One source. Your judgment.</h1><p>The small model identifies source-backed ideas. You decide which ones enter the lesson.</p></header>
      <div className={styles.singleModelRun}><article><span>4B</span><h2>{analysis?.status === "accepted" ? "Ready for your review" : "Extract the learning ingredients"}</h2>
        <div className={styles.modelConnection} data-connected={modelStatus?.connected && modelStatus.installed ? "true" : "false"}><i/><strong>{modelStatus?.message ?? "Checking the local AI connection…"}</strong><small>{modelStatus?.loaded ? "Model is already in memory." : "The first run may take longer while the model loads."}</small></div>
        <div className={styles.sourceToLesson}><span>Trusted source</span><i>→</i><span>Cited ideas</span><i>→</i><span>Your approval</span></div>
        {busy ? <div className={styles.runningModel}><i/><strong>Reading the source… {elapsed}s</strong><small>One local task at a time. This can still take a few minutes.</small><button onClick={cancel}>Stop this run</button></div>
          : <button onClick={() => void analyze()}>{analysis ? "Retry source analysis" : "Analyze with Qwen 4B →"}</button>}
        {analysis?.status === "accepted" ? <p>Validated in {(analysis.latencyMs / 1000).toFixed(1)} seconds. Every extracted item still needs your approval.</p> : null}
      </article></div>
      <footer><div role="status">{error || "The larger model is disabled. No second model run is required."}</div><button disabled={busy || analysis?.status !== "accepted"} onClick={() => setStage("review")}>Review the extracted ideas →</button></footer>
    </main> : null}
    {stage === "planning" || stage === "composing" ? <main className={`${styles.planningStage} ${styles.stageSurface}`}>
      <span>{stage === "planning" ? "REPRESENTATION PLANNER · 4B" : "LEARNING COMPOSER · 4B"}</span>
      <h1>{error ? "Let’s try that again." : stage === "planning" ? "Giving your approved ideas a form…" : "Arranging your interactive path…"}</h1>
      {busy ? <><div className={styles.compilerAnimation}><i/><i/><i/></div><p role="status">{elapsed}s · {stage === "planning" ? "Choosing from trusted interaction types." : "Choosing from your approved blocks."}</p><button onClick={cancel}>Stop this run</button></> : null}
      {error ? <><p role="alert">{error}</p><button onClick={() => stage === "planning" && spec ? void planFrom(spec) : void beginComposition(depth)}>Retry with Qwen 4B →</button></> : null}
    </main> : null}
  </div>;
}
