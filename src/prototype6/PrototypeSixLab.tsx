"use client";

import { useEffect, useRef, useState } from "react";
import { getP6Status, requestP6Compile, requestP6Design } from "./client";
import { DesignReview } from "./DesignReview";
import { LearningWorkspace } from "./LearningWorkspace";
import { P6Brand, P6Discovery, P6DiscoveryBrand } from "./P6Discovery";
import { SourceBook } from "./SourceBook";
import type { CompiledExperience, DepthMinutes, LearningGoal, P6DesignRequest, P6DesignResponse } from "./types";
import type { P6ModelStatus } from "./provider";
import styles from "./prototype6.module.css";

type Screen = "home" | "purpose" | "depth" | "source" | "transform" | "workspace";
const goals: Array<{ id: LearningGoal; label: string; mark: string }> = [{ id: "explore", label: "I’m curious", mark: "↗" }, { id: "understand", label: "I need to understand this", mark: "○" }, { id: "revise", label: "I’m revising", mark: "↻" }, { id: "test", label: "I have a test", mark: "✓" }];
const depths: Array<{ value: DepthMinutes; label: string; note: string }> = [{ value: 5, label: "Quick look", note: "5 minutes" }, { value: 15, label: "Learn it", note: "15 minutes" }, { value: 30, label: "Go deep", note: "30 minutes" }];

export function PrototypeSixLab() {
  const [screen, setScreen] = useState<Screen>("home"); const [goal, setGoal] = useState<LearningGoal>("understand"); const [depth, setDepth] = useState<DepthMinutes>(15);
  const [design, setDesign] = useState<P6DesignResponse | null>(null); const [experience, setExperience] = useState<CompiledExperience | null>(null); const [status, setStatus] = useState<P6ModelStatus | null>(null);
  const [busy, setBusy] = useState(false); const [elapsed, setElapsed] = useState(0); const [error, setError] = useState(""); const [reviewOpen, setReviewOpen] = useState(false); const [setupTransitioning, setSetupTransitioning] = useState(false); const aborter = useRef<AbortController | null>(null);
  useEffect(() => { const controller = new AbortController(); void getP6Status().then(setStatus).catch(() => setStatus({ connected: false, installed: false, loaded: false, provider: "gemini", model: "not configured", message: "The configured AI provider could not be reached." })); return () => controller.abort(); }, []);
  useEffect(() => { if (!busy) return; const started = Date.now(); const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000); return () => window.clearInterval(timer); }, [busy]);
  useEffect(() => () => aborter.current?.abort(), []);
  function reset() { aborter.current?.abort(); setScreen("home"); setDesign(null); setExperience(null); setError(""); setReviewOpen(false); setBusy(false); setSetupTransitioning(false); }
  function choosePurpose(nextGoal: LearningGoal) {
    if (setupTransitioning) return;
    setGoal(nextGoal); setSetupTransitioning(true);
    window.setTimeout(() => { setScreen("depth"); setSetupTransitioning(false); }, 260);
  }
  function chooseDepth(nextDepth: DepthMinutes) {
    if (setupTransitioning) return;
    setSetupTransitioning(true);
    window.setTimeout(() => { setSetupTransitioning(false); void begin(nextDepth); }, 320);
  }
  function designRequest(nextDepth: DepthMinutes): P6DesignRequest { return { schemaVersion: "p6-design-request-1", sourcePackageId: "circuits-resistance-approved-v1", goal, depthMinutes: nextDepth, learnerLevel: "intro-secondary" }; }
  async function begin(nextDepth: DepthMinutes, retry = false) {
    setDepth(nextDepth); setScreen("source"); setBusy(true); setElapsed(0); setError(""); setDesign(null);
    const operation = new AbortController(); aborter.current = operation; const request = designRequest(nextDepth); const key = `p6:circuits-resistance-approved-v1:knowledge-v1:${goal}:${nextDepth}:intro-secondary:${status?.model || "qwen3:4b-instruct"}:prompt-v2`;
    try {
      if (!retry) { const cached = sessionStorage.getItem(key); if (cached) { const parsed = JSON.parse(cached) as P6DesignResponse; if (parsed.status === "accepted" && parsed.blueprint && parsed.designReceipt) { try { await requestP6Compile(parsed.blueprint, parsed.designReceipt); setDesign(parsed); return; } catch { sessionStorage.removeItem(key); } } } }
      const response = await requestP6Design(request, operation.signal); setDesign(response);
      if (response.status === "accepted") sessionStorage.setItem(key, JSON.stringify(response)); else setError([response.failureReason, ...response.validationErrors.slice(0, 5)].filter(Boolean).join(" "));
    } catch (caught) { if (!operation.signal.aborted) setError(caught instanceof Error ? caught.message : "The autonomous design failed."); }
    finally { if (aborter.current === operation) { aborter.current = null; setBusy(false); } }
  }
  async function compile(approvedStageIds?: string[]) {
    if (!design?.blueprint || !design.designReceipt) return;
    setError(""); setBusy(true);
    try { const response = await requestP6Compile(design.blueprint, design.designReceipt, approvedStageIds); setExperience(response.experience); setReviewOpen(false); setScreen("transform"); window.setTimeout(() => setScreen("workspace"), 1350); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "The approved design could not be compiled."); }
    finally { setBusy(false); }
  }
  if (screen === "home") return <P6Discovery onContinue={() => setScreen("purpose")}/>;
  if (screen === "workspace" && experience && design) return <LearningWorkspace experience={experience} designResponse={design} onRestart={reset}/>;
  if (screen === "purpose" || screen === "depth") {
    const setupStep = screen === "purpose" ? "intent" : "depth";
    return <div className={`setup-page focused-setup setup-${setupStep} stage-enter${setupTransitioning ? " setup-transitioning" : ""}`} key={screen}>
      <header className="site-header compact-header">
        <P6DiscoveryBrand />
        <button className="text-button" type="button" onClick={() => { if (!setupTransitioning) setScreen(screen === "purpose" ? "home" : "purpose"); }}>{screen === "purpose" ? "← Back to the eye" : "← Previous choice"}</button>
      </header>
      <main className="focused-setup-shell">
        <div className="setup-step-dots" aria-label={`Setup step ${screen === "purpose" ? 1 : 2} of 2`}><span className={screen === "purpose" ? "active" : "complete"}/><span className={screen === "depth" ? "active" : ""}/></div>
        {screen === "purpose" ? <section className="setup-scene setup-intent-scene" key="intent">
          <h1>What brings you here?</h1>
          <div className="intent-choice-grid">{goals.map((item, index) => <button type="button" key={item.id} aria-pressed={goal === item.id} onClick={() => choosePurpose(item.id)}><span>{String(index + 1).padStart(2, "0")}</span><i aria-hidden="true">{item.mark}</i><strong>{item.label}</strong><small aria-hidden="true">→</small></button>)}</div>
        </section> : <section className="setup-scene setup-depth-scene" key="depth">
          <h1>How deep should we go?</h1>
          <div className="depth-choice-grid">{depths.map((item, index) => <button type="button" key={item.value} onClick={() => chooseDepth(item.value)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.label}</strong><i aria-hidden="true">→</i></button>)}</div>
        </section>}
        <div className="setup-atmosphere" aria-hidden="true"><span/><span/><span/></div>
      </main>
    </div>;
  }
  if (screen === "source") return <><SourceBook designerLabel={status?.provider === "gemini" ? "Gemini" : "Qwen"} designing={busy} elapsed={elapsed} ready={design?.status === "accepted"} error={error} onBuild={() => void compile()} onReview={() => setReviewOpen(true)} onRetry={() => void begin(depth, true)} onBack={() => setScreen("depth")}/>{design?.blueprint ? <DesignReview blueprint={design.blueprint} open={reviewOpen} onClose={() => setReviewOpen(false)} onCompile={(ids) => void compile(ids)} error={error}/> : null}</>;
  return <main className={styles.transformScreen}><P6Brand/><div className={styles.transformBook}><i/><i/><i/><i/><i/></div><div className={styles.transformCircuit}><span/><span/><span/></div><small>TRUSTED KNOWLEDGE → REGISTERED PRIMITIVES</small><h1>The page is becoming an experience.</h1><p>AI chose the structure. Deterministic code is compiling every interaction.</p></main>;
}
