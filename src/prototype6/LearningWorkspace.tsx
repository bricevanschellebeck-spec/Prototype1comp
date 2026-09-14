"use client";

import { useMemo, useRef, useState } from "react";
import { requestP6Composition } from "./client";
import { CircuitScene, type CircuitState } from "./CircuitScene";
import { DesignInspector } from "./DesignReview";
import { PrimitiveStage } from "./PrimitiveStage";
import { SourcePopup } from "./SourceBook";
import type { BlockOutcome, CompiledExperience, P6DesignResponse, P6PathResponse } from "./types";
import styles from "./prototype6.module.css";

export function LearningWorkspace({ experience, designResponse, onRestart }: { experience: CompiledExperience; designResponse: P6DesignResponse; onRestart: () => void }) {
  const [path, setPath] = useState(experience.initialSequenceStageIds);
  const [index, setIndex] = useState(0); const [evidence, setEvidence] = useState<BlockOutcome[]>([]); const [history, setHistory] = useState<string[]>([]);
  const [circuit, setCircuit] = useState<CircuitState>({ voltageId: "voltage-9", resistanceId: "resistance-4" });
  const [sourceOpen, setSourceOpen] = useState(false); const [whyOpen, setWhyOpen] = useState(false); const [busy, setBusy] = useState(false); const [adaptation, setAdaptation] = useState<P6PathResponse | null>(null); const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const currentId = path[index]; const current = experience.stages.find((stage) => stage.stageId === currentId);
  const completed = useMemo(() => new Set(evidence.map((item) => item.stageId)), [evidence]);
  async function finish(outcome: BlockOutcome) {
    if (!current || busy) return;
    const nextEvidence = [...evidence, outcome]; setEvidence(nextEvidence); setHistory((before) => before.includes(current.stageId) ? before : [...before, current.stageId]);
    const shouldAdapt = outcome.result !== "completed" || outcome.hintUsed || outcome.attempts > 1;
    if (shouldAdapt) {
      setBusy(true); setError(""); const aborter = new AbortController(); controller.current = aborter;
      try { const response = await requestP6Composition(experience, nextEvidence, aborter.signal); setAdaptation(response); setPath(response.stageIds); setIndex(0); }
      catch (caught) { setError(caught instanceof Error ? caught.message : "The unfinished path could not be recomposed."); setIndex((value) => Math.min(value + 1, path.length)); }
      finally { setBusy(false); controller.current = null; }
    } else setIndex((value) => value + 1);
  }
  const complete = index >= path.length || !current;
  return <main className={styles.workspace}>
    <header className={styles.workspaceHeader}><div><small>ASSEMBLED FOR THIS LEARNER</small><h1>{experience.lessonTitle}</h1></div><nav><button onClick={() => setSourceOpen(true)}>Open textbook</button><button onClick={() => setWhyOpen(true)}>Why this design?</button><button onClick={onRestart}>Start again</button></nav></header>
    <div className={styles.pathRail}>{complete ? <strong>Lesson complete</strong> : path.map((id, position) => { const stage = experience.stages.find((item) => item.stageId === id); return <div key={`${id}-${position}`} data-state={position < index ? "complete" : position === index ? "active" : "future"}><i>{position + 1}</i><span>{stage?.title}</span></div>; })}</div>
    <div className={styles.workspaceBody}>
      <aside className={styles.stagePanel}>{busy ? <div className={styles.recomposing}><i/><h2>The unfinished lesson is rearranging…</h2><p>Your completed work stays fixed. The AI can choose only the signed, unused stages.</p></div> : complete ? <div className={styles.completion}><small>PATH COMPLETE</small><h2>You changed the circuit, found the pattern and applied it.</h2><div><span>{history.length}<small>stages experienced</small></span><span>{evidence.filter((item) => item.result === "correct").length}<small>secure checks</small></span></div><button className={styles.primaryButton} onClick={() => setWhyOpen(true)}>Inspect the assembled lesson →</button></div> : <PrimitiveStage key={`${current.stageId}-${evidence.length}`} stage={current} circuitState={circuit} setCircuitState={setCircuit} onOutcome={(outcome) => void finish(outcome)}/>} {error ? <p role="alert" className={styles.workspaceError}>{error}</p> : null}</aside>
      <section className={styles.scenePanel}><header><span>PERSISTENT TRUSTED OBJECT</span><strong>{current?.title || "Your circuit model"}</strong></header><CircuitScene state={circuit} highlight={current?.primitive.kind === "diagram" || current?.primitive.kind === "observation" ? current.primitive.highlightConceptIds : []}/><div className={styles.sceneFooter}><span>{adaptation ? `${adaptation.source === "deterministic-fallback" ? "Safe fallback" : "AI"} recomposed the unfinished path` : "Initial path from the autonomous design"}</span><span>{completed.size} evidence records</span></div></section>
    </div>
    <SourcePopup open={sourceOpen} onClose={() => setSourceOpen(false)}/><DesignInspector open={whyOpen} onClose={() => setWhyOpen(false)} response={designResponse} pathSource={adaptation?.source}/>
  </main>;
}
