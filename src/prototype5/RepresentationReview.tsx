"use client";

import { useState } from "react";
import type { ApprovedLearningSpec, RepresentationPlanDraft, RepresentationProposal } from "./types";
import styles from "./prototype5.module.css";

function proposalLabel(proposal: RepresentationProposal) { return proposal.primitiveId.replaceAll("-", " "); }

export function RepresentationReview({ spec, plan, modelId, onCompile }: { spec: ApprovedLearningSpec; plan: RepresentationPlanDraft; modelId: string; onCompile: (ids: string[]) => Promise<void> }) {
  const proposals = plan.objectivePlans.flatMap((objective) => objective.proposals.map((proposal) => ({ objective, proposal })));
  const [decisions, setDecisions] = useState<Record<string, boolean>>({}); const [activeId, setActiveId] = useState(proposals[0]?.proposal.tempId); const [error, setError] = useState(""); const [working, setWorking] = useState(false);
  const active = proposals.find(({ proposal }) => proposal.tempId === activeId); const resolved = Object.keys(decisions).length;
  async function compile() { if (resolved !== proposals.length) { setError(`Resolve all ${proposals.length} proposals first.`); return; } setWorking(true); setError(""); try { await onCompile(Object.entries(decisions).filter(([, approved]) => approved).map(([id]) => id)); } catch (caught) { setError(caught instanceof Error ? caught.message : "Compilation failed."); } finally { setWorking(false); } }
  return <section className={styles.reviewLab}>
    <header className={styles.labHeader}><div><span>REPRESENTATION PLANNER · {modelId}</span><h1>Approve the interactive vocabulary.</h1></div><div className={styles.reviewProgress}><strong>{resolved} / {proposals.length}</strong><span>factory proposals resolved</span></div></header>
    <div className={styles.plannerColumns}>
      <aside className={styles.objectivePane}><span>APPROVED OBJECTIVES</span>{spec.objectives.map((objective) => <article key={objective.id}><b>{objective.id}</b><p>{objective.statement}</p></article>)}{plan.objectivePlans.filter((item) => item.representationGap).map((item) => <article className={styles.gapNote} key={item.objectiveId}><b>REPRESENTATION GAP</b><p>{item.gapReason}</p></article>)}</aside>
      <main className={styles.proposalPane}>{proposals.map(({ objective, proposal }, index) => <article className={`${styles.proposalCard} ${activeId === proposal.tempId ? styles.proposalActive : ""}`} key={proposal.tempId} onClick={() => setActiveId(proposal.tempId)}><span>{String(index + 1).padStart(2, "0")} · {proposal.role}</span><h2>{proposalLabel(proposal)}</h2><p>For {objective.objectiveId}</p><div><button className={decisions[proposal.tempId] === true ? styles.approvedChoice : ""} type="button" onClick={() => setDecisions((current) => ({ ...current, [proposal.tempId]: true }))}>Approve</button><button className={decisions[proposal.tempId] === false ? styles.rejectedChoice : ""} type="button" onClick={() => setDecisions((current) => ({ ...current, [proposal.tempId]: false }))}>Reject</button></div></article>)}</main>
      <aside className={styles.factoryPane}><span>DETERMINISTIC FACTORY</span>{active ? <><h2>{proposalLabel(active.proposal)}</h2><p>The model selected an approved primitive and IDs. It did not design the interface.</p><dl><dt>Role</dt><dd>{active.proposal.role}</dd><dt>Facts</dt><dd>{active.proposal.supportingFactIds.join(", ")}</dd><dt>Relationships</dt><dd>{active.proposal.relationshipIds.join(", ") || "none"}</dd><dt>Configuration</dt><dd><code>{JSON.stringify(active.proposal.factoryConfig)}</code></dd></dl><div className={styles.factoryFlow}>AI proposal <i>→</i> validator <i>→</i> trusted factory</div></> : <p>No proposal selected.</p>}</aside>
    </div>
    <footer className={styles.reviewFooter}><div>{error ? <span>{error}</span> : <small>No generated HTML, CSS, coordinates, or invented data.</small>}</div><button disabled={working} type="button" onClick={compile}>{working ? "Validating and compiling…" : "Compile approved blocks →"}</button></footer>
  </section>;
}
