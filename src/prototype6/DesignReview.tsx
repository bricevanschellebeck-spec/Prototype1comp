"use client";

import { useState } from "react";
import { circuitKnowledge } from "./knowledge";
import { inspectRepresentationGaps } from "./capabilities";
import { P6Dialog } from "./P6Dialog";
import type { LearningExperienceBlueprint, P6DesignResponse } from "./types";
import styles from "./prototype6.module.css";

export function DesignReview({ blueprint, open, onClose, onCompile, error }: { blueprint: LearningExperienceBlueprint; open: boolean; onClose: () => void; onCompile: (approved: string[]) => void; error: string }) {
  const [approved, setApproved] = useState(() => new Set(blueprint.stages.map((stage) => stage.stageId)));
  const toggle = (id: string) => setApproved((before) => { const next = new Set(before); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  return <P6Dialog open={open} onClose={onClose} title="Review AI decisions" wide><div className={styles.reviewIntro}><div><small>OPTIONAL HIGH-ASSURANCE MODE</small><h2>The AI designed these stages.</h2></div><p>Rejecting a required stage can make compilation stop. The same validator is applied again before anything can run.</p></div>
    <div className={styles.reviewGrid}>{blueprint.stages.map((stage, index) => <article key={stage.stageId} data-approved={approved.has(stage.stageId)}><header><span>{String(index + 1).padStart(2, "0")} · {stage.availability}</span><button aria-pressed={approved.has(stage.stageId)} onClick={() => toggle(stage.stageId)}>{approved.has(stage.stageId) ? "Approved" : "Rejected"}</button></header><h3>{stage.copy.title.text}</h3><p>{stage.copy.instruction.text}</p><dl><div><dt>Primitive</dt><dd>{stage.primitive.kind}</dd></div><div><dt>Role</dt><dd>{stage.role}</dd></div><div><dt>Why</dt><dd>{stage.representationReason}</dd></div><div><dt>Grounded in</dt><dd>{stage.sourceFactIds.join(", ")}</dd></div></dl></article>)}</div>
    {error ? <p className={styles.reviewError} role="alert">{error}</p> : null}<footer className={styles.reviewFooter}><span>{approved.size} of {blueprint.stages.length} stages approved</span><button className={styles.primaryButton} onClick={() => onCompile([...approved])}>Compile approved design →</button></footer>
  </P6Dialog>;
}

export function DesignInspector({ open, onClose, response, pathSource }: { open: boolean; onClose: () => void; response: P6DesignResponse; pathSource?: string }) {
  const blueprint = response.blueprint;
  const gaps = blueprint ? inspectRepresentationGaps(blueprint) : [];
  return <P6Dialog open={open} onClose={onClose} title="Why was this lesson built this way?" wide>{blueprint ? <div className={styles.inspector}>
    <header><div><small>DESIGN PROFILE</small><h2>{blueprint.designProfile.goal} · {blueprint.designProfile.depthMinutes} minutes</h2></div><div><small>PROVIDER · {response.provider}</small><h2>{response.model}</h2><p>{(response.latencyMs / 1000).toFixed(1)} s · {response.correctionAttempted ? "corrected once" : "accepted first pass"}</p></div></header>
    <section><h3>Initial sequence</h3><ol>{blueprint.initialSequenceStageIds.map((id) => { const stage = blueprint.stages.find((item) => item.stageId === id); return <li key={id}><strong>{stage?.copy.title.text}</strong><span>{stage?.primitive.kind} · {stage?.representationReason}</span></li>; })}</ol></section>
    <div className={styles.inspectorColumns}><section><h3>Support alternatives</h3>{blueprint.stages.filter((stage) => stage.availability === "support-only").map((stage) => <p key={stage.stageId}><strong>{stage.copy.title.text}</strong><br/>{stage.addressesMisconceptionIds.join(", ")}</p>) || "None"}</section><section><h3>Delayed / omitted facts</h3><p><strong>Delayed:</strong> {blueprint.designSummary.delayedFactIds.join(", ") || "None"}</p><p><strong>Omitted:</strong> {blueprint.designSummary.omittedFactIds.join(", ") || "None"}</p></section><section><h3>Validator</h3><p><strong>Passed twice</strong><br/>Before signing and before compilation.</p><p>Current adaptive path: {pathSource || "initial AI design"}</p></section></div>
    <section className={styles.gapSection}><h3>Representation gaps</h3>{gaps.length ? <div className={styles.gapList}>{gaps.map((gap) => <article key={`${gap.objectiveId}:${gap.missingCapability}`} data-valid={gap.validationStatus === "accepted"}><header><span>{gap.validationStatus === "accepted" ? "VALIDATED LIMITATION" : "INCONSISTENT CLAIM"}</span><strong>{gap.missingCapability}</strong></header><p>{gap.objective}</p><dl><div><dt>Objective</dt><dd>{gap.objectiveId}</dd></div><div><dt>Capability in registry</dt><dd>{gap.capabilityAvailable ? "Yes — reject this gap" : "No"}</dd></div><div><dt>Reason</dt><dd>{gap.reasonCode}</dd></div><div><dt>Validation</dt><dd>{gap.validationStatus}</dd></div></dl></article>)}</div> : <p className={styles.noGaps}><strong>No representation gaps declared.</strong> The assembler found registered capabilities for every selected objective.</p>}</section>
    <section><h3>Trusted grounding</h3><div className={styles.factList}>{circuitKnowledge.facts.map((fact) => <details key={fact.id}><summary>{fact.id}</summary><p>{fact.statement}</p><small>Exact source: “{fact.quote}”</small></details>)}</div></section>
  </div> : <p>No accepted blueprint is available.</p>}</P6Dialog>;
}
