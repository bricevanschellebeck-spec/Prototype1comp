"use client";

import { useEffect, useRef } from "react";
import type { EvidenceEvent, GoldLesson, LivingReference, P65Goal } from "./types";
import styles from "./prototype65.module.css";

export function ReferenceDrawer({ lesson, goal, reference, evidence, open, onClose }: { lesson: GoldLesson; goal: P65Goal; reference: LivingReference; evidence: EvidenceEvent[]; open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", escape); return () => window.removeEventListener("keydown", escape);
  }, [open, onClose]);
  if (!open) return null;
  return <div className={styles.drawerBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside className={styles.referenceDrawer} role="dialog" aria-modal="true" aria-label="My lesson reference">
    <header><div><small>BUILT AS YOU LEARN</small><h2>My lesson · {reference.sections.length}</h2></div><button ref={closeRef} onClick={onClose} aria-label="Close My lesson">×</button></header>
    <div className={styles.referenceIntro}><span>{lesson.subject}</span><strong>{lesson.title}</strong><p>{goal === "curious" ? "Only the ideas you choose to uncover are collected here." : goal === "understand" ? "This grows into a complete record as each idea becomes meaningful." : goal === "revise" ? "This keeps the concepts you refreshed or needed to repair." : "Explanations appear here only after your readiness evidence."}</p></div>
    {reference.sections.length ? <nav className={styles.referenceMap} aria-label="Reference contents">{reference.sections.map((section) => <a key={section.id} href={`#reference-${section.id}`}><span>{String(section.order).padStart(2,"0")}</span>{section.title}<small>{section.status}</small></a>)}</nav> : null}
    <div className={styles.referenceEntries}>{reference.sections.length ? reference.sections.map((section) => <article key={section.id} id={`reference-${section.id}`} className={styles.referenceSection}>
      <header><small>{String(section.order).padStart(2,"0")} · {section.status}</small><h3>{section.title}</h3></header>
      <div className={styles.canonicalKnowledge}><small>TRUSTED KNOWLEDGE</small>{section.canonicalKnowledge.map((item) => <div key={item.id}><strong>{item.title}</strong><p>{item.body}</p></div>)}</div>
      {section.relationships.length ? <div className={styles.referenceRelationships}><small>CONNECTIONS</small>{section.relationships.map((relationship) => <p key={relationship}>{relationship}</p>)}</div> : null}
      {section.learnerEvidence.length ? <div className={styles.referenceEvidence}><small>YOUR EVIDENCE</small>{section.learnerEvidence.map((item) => <div key={item.id}><p>{item.detail}</p>{item.measurements.length ? <dl>{item.measurements.map((measurement) => <div key={`${measurement.input}-${measurement.output}`}><dt>{measurement.input}</dt><dd>→ {measurement.output}</dd></div>)}</dl> : null}</div>)}</div> : null}
      {section.representations.length ? <div className={styles.referenceRepresentations}><small>REPRESENTATIONS</small>{section.representations.map((item) => <span key={`${item.kind}-${item.label}`}>{item.kind} · {item.label}</span>)}</div> : null}
      <footer>{`${section.supportingFactIds.length} trusted fact${section.supportingFactIds.length === 1 ? "" : "s"} · inclusion does not mean mastery`}</footer>
    </article>) : <div className={styles.emptyReference}><i>＋</i><strong>Your first discovery will appear here.</strong><span>The lesson begins with the scene, not a content dump.</span></div>}</div>
    {evidence.length ? <footer><strong>{evidence.length} pieces of learner evidence</strong><span>{evidence.filter((item) => item.result === "strong").length} demonstrated independently</span></footer> : null}
  </aside></div>;
}

export function BeforeTextbook({ lesson, open, onClose }: { lesson: GoldLesson; open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (!open) return; closeRef.current?.focus(); const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [open, onClose]);
  if (!open) return null;
  return <div className={styles.drawerBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={styles.beforeBook} role="dialog" aria-modal="true" aria-label="Fixed textbook comparison"><header><span>OPTIONAL PROTOTYPE COMPARISON</span><button ref={closeRef} onClick={onClose} aria-label="Close fixed textbook comparison">×</button></header><article><small>{lesson.subject.toUpperCase()} · FIXED TEXTBOOK DEMO</small><h1>{lesson.title}</h1><p>{lesson.id === "circuits" ? "A closed circuit contains a battery, resistor and lamp. When voltage remains fixed, increasing resistance decreases current." : "Cold War competition, political decisions, scientific investment and a sequence of major events contributed to the 1969 Moon landing."}</p><hr/><h2>{lesson.id === "circuits" ? "I = V ÷ R" : "1957 → 1961 → 1969"}</h2><p>This optional comparison is not your starting lesson. Your own reference begins empty and grows from what you experience.</p></article></section></div>;
}
