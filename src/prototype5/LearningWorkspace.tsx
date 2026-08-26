"use client";

import { useMemo, useState } from "react";
import { requestP5Composition } from "./client";
import { DataScene } from "./DataScene";
import { P5Primitive } from "./P5Primitives";
import { SourceBook } from "./SourceBook";
import type { BlockOutcome, CompiledLessonManifest, DepthMinutes, LearningGoal, P5ComposeResponse } from "./types";
import styles from "./prototype5.module.css";

type Step = P5ComposeResponse["blueprint"]["remainingSteps"][number] & { outcome?: BlockOutcome };
const reasons: Record<string, string> = { "elicit-existing-model": "Collect evidence before explaining", "test-through-manipulation": "Turn trusted data into an experiment", "offer-alternate-representation": "Show the same evidence another way", "respond-to-misconception": "Insert support from learner evidence", "provide-guided-retry": "Retry with the contrast visible", "connect-evidence-to-concept": "Name the rule after observation", "increase-challenge": "Raise the application demand", "confirm-transfer": "Apply the relationship to held-out evidence" };

export function LearningWorkspace({ manifest, goal, depth, initialComposition, onRestart }: { manifest: CompiledLessonManifest; goal: LearningGoal; depth: DepthMinutes; initialComposition: P5ComposeResponse; onRestart: () => void }) {
  const catalog = useMemo(() => new Map(manifest.blocks.map((block) => [block.id, block])), [manifest]); const source = useMemo(() => manifest.sourceDocumentId, [manifest]);
  const [steps, setSteps] = useState<Step[]>(initialComposition.blueprint.remainingSteps); const [composition, setComposition] = useState(initialComposition); const [evidence, setEvidence] = useState<BlockOutcome[]>([]); const [recomposed, setRecomposed] = useState(false); const [composing, setComposing] = useState(false); const [changed, setChanged] = useState(false); const [showSource, setShowSource] = useState(false); const [showTrace, setShowTrace] = useState(false);
  const sourceDoc = useMemo(() => requireSource(source), [source]); const [selectedRowId, setSelectedRowId] = useState(sourceDoc.tables[0]?.rows[0]?.id ?? ""); const [revealedRows, setRevealedRows] = useState<string[]>([]);
  const activeIndex = steps.findIndex((step) => !step.outcome); const activeStep = activeIndex >= 0 ? steps[activeIndex] : undefined; const activeBlock = activeStep ? catalog.get(activeStep.blockId) : undefined; const complete = activeIndex < 0 && !composing;
  async function completeBlock(outcome: BlockOutcome) {
    if (!activeBlock || activeBlock.id !== outcome.blockId || composing) return;
    const completed = steps.map((step, index) => index === activeIndex ? { ...step, outcome } : step); const nextEvidence = [...evidence, outcome]; const adapt = activeBlock.role === "evidence" && !recomposed;
    setEvidence(nextEvidence); if (!adapt) { setSteps(completed); return; }
    const prefix = completed.slice(0, activeIndex + 1); setSteps(prefix); setComposing(true); setRecomposed(true);
    try { const next = await requestP5Composition(manifest, goal, depth, nextEvidence); setComposition(next); setSteps([...prefix, ...next.blueprint.remainingSteps]); setChanged(true); window.setTimeout(() => setChanged(false), 2200); }
    catch { setSteps(completed); }
    finally { setComposing(false); }
  }
  return <section className={styles.workspace}>
    <header className={styles.workspaceHeader}><div><span>COMPILED FROM {manifest.sourceDocumentId}</span><h1>{manifest.title}</h1></div><nav><span>{goal} · {depth} min</span><button onClick={() => setShowSource(true)}>Trusted source</button><button onClick={() => setShowTrace(true)}>Composition</button><button onClick={onRestart}>Restart P5</button></nav></header>
    <div className={styles.pathRail}><div><b>{complete ? "✓" : String(activeIndex + 1).padStart(2, "0")}</b><strong>{complete ? "Path complete" : activeBlock?.title}</strong></div><ol>{steps.map((step, index) => <li className={step.outcome ? styles.done : index === activeIndex ? styles.now : ""} key={`${step.blockId}-${index}`}><i/><span>{catalog.get(step.blockId)?.title}</span></li>)}</ol></div>
    <main className={`${styles.workspaceGrid} ${changed ? styles.workspaceChanged : ""}`}>
      <aside className={styles.actionStage}>{activeBlock ? <P5Primitive key={activeBlock.id} block={activeBlock} manifest={manifest} selectedRowId={selectedRowId} revealedRows={revealedRows} onRow={setSelectedRowId} onReveal={(id) => setRevealedRows((current) => current.includes(id) ? current : [...current, id])} onComplete={completeBlock}/> : null}{composing ? <div className={styles.recompose}><i/><span>Learner evidence received</span><strong>Recompiling the unfinished environment…</strong></div> : null}{changed ? <div className={styles.changedNotice}>The remaining path changed.</div> : null}</aside>
      <DataScene manifest={manifest} selectedRowId={selectedRowId} revealedRows={revealedRows}/>
      <aside className={styles.evidencePane}><span>LIVE COMPILER TRACE</span><h2>{activeStep ? reasons[activeStep.reasonCode] : "Every block retained source provenance."}</h2><div><b>SOURCE FACTS</b>{activeBlock?.supportingFactIds.map((id) => <p key={id}>{manifest.facts.find((fact) => fact.id === id)?.statement}</p>)}</div><div><b>CITATIONS</b>{activeBlock?.sourceCitations.map((citation, index) => <code key={index}>{citation.kind === "text" ? citation.sectionId : `${citation.tableId} · ${citation.rowIds.join(", ")}`}</code>)}</div><div><b>COMPOSER</b><p>{composition.source === "ollama" ? `${composition.model} selected this legal block.` : `Safe fallback: ${composition.fallbackReason}`}</p></div></aside>
      {complete ? <div className={styles.completePanel}><span>SOURCE-GROUNDED PATH COMPLETE</span><h2>The lesson was extracted, reviewed, represented, compiled, and adapted.</h2><p>Every visible value and claim can be traced back to the bundled trusted source.</p><button onClick={() => setShowTrace(true)}>Inspect the complete chain →</button></div> : null}
    </main>
    {showSource ? <div className={styles.modal}><button className={styles.closeModal} onClick={() => setShowSource(false)}>Close source ×</button><SourceBook source={sourceDoc}/></div> : null}
    {showTrace ? <aside className={styles.traceDrawer}><header><div><span>END-TO-END PROVENANCE</span><h2>Why this path?</h2></div><button onClick={() => setShowTrace(false)}>×</button></header><section><b>Provider</b><p>{composition.model ?? "deterministic"} · {composition.latencyMs} ms</p></section><section><b>Legal generated blocks</b><p>{composition.legalCandidateIds.join(" · ")}</p></section><section><b>Selected path</b>{steps.map((step) => <article key={step.blockId}><strong>{catalog.get(step.blockId)?.title}</strong><small>{reasons[step.reasonCode]}</small></article>)}</section><section><b>Validation</b><p>{composition.validationErrors.length ? composition.validationErrors.join(" · ") : "Schema, provenance, candidate, and path rules passed."}</p></section></aside> : null}
  </section>;
}

import { getSourceDocument } from "./sources";
function requireSource(id: string) { const source = getSourceDocument(id); if (!source) throw new Error(`Missing source ${id}.`); return source; }
