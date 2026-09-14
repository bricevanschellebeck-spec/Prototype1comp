"use client";

import { useEffect, useState } from "react";
import type { SceneState } from "./Scenes";
import type { GoldLesson, LivingReference, LivingReferenceSection, P65Activity, P65Goal } from "./types";
import styles from "./prototype65.module.css";

type Props = {
  lesson: GoldLesson;
  goal: P65Goal;
  activity?: P65Activity;
  scene: SceneState;
  reference: LivingReference;
  previewObjectId: string | null;
  newObjectId: string | null;
  eventSectionId: string | null;
  locked: boolean;
  onOpenFullReference: () => void;
  onHighlightObject: (objectId: string | null) => void;
};

const sectionObject: Record<string, string> = {
  "complete-circuit": "switch",
  current: "current-path",
  voltage: "battery",
  resistance: "resistor",
  relationships: "resistor",
  applications: "lamp",
};

function objectValue(objectId: string, scene: SceneState) {
  if (objectId === "battery") return `${scene.circuits.voltage} V`;
  if (objectId === "resistor") return `${scene.circuits.resistance} Ω`;
  if (objectId === "current-path") return `${scene.circuits.closed ? (scene.circuits.voltage / scene.circuits.resistance).toFixed(2) : "0.00"} A`;
  return undefined;
}

function activeTitle(activity: P65Activity | undefined) {
  if (!activity) return "Your lesson";
  const titles: Partial<Record<P65Activity["interaction"], string>> = {
    "close-circuit": "Complete the circuit",
    "observe-voltage": "Voltage",
    "predict-current": "Resistance & current",
    "resistance-lab": "Resistance",
    "compare-resistance": "Resistance & current",
    "repair-circuit": "Complete circuit",
    "target-current": "Use the relationship",
    "transfer-current": "Transfer the idea",
    "circuit-playground": "Your investigation",
  };
  return titles[activity.interaction] ?? activity.title;
}

function activeSummary(activity: P65Activity | undefined, scene: SceneState) {
  if (!activity) return "The reference keeps the ideas and evidence you built during this lesson.";
  if (activity.interaction === "close-circuit" || activity.interaction === "repair-circuit") return "Close the gap and watch what becomes possible in the loop.";
  if (activity.interaction === "observe-voltage") return `Change the battery while resistance stays fixed at ${scene.circuits.resistance} Ω.`;
  if (["predict-current", "resistance-lab", "compare-resistance"].includes(activity.interaction)) return `Compare resistance with current while voltage stays fixed at ${scene.circuits.voltage} V.`;
  return activity.goalPrompts?.understand ?? activity.prompt;
}

function latestEvidence(section: LivingReferenceSection | undefined) {
  return section?.learnerEvidence.at(-1);
}

export function LivingReferenceCompanion({ lesson, goal, activity, scene, reference, previewObjectId, newObjectId, eventSectionId, locked, onOpenFullReference, onHighlightObject }: Props) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const selectedSection = reference.sections.find((section) => section.id === selectedSectionId);
  const eventSection = reference.sections.find((section) => section.id === eventSectionId);
  const previewDetail = lesson.objectDetails.find((detail) => detail.id === previewObjectId);
  const shownSection = selectedSection ?? eventSection;
  const evidence = latestEvidence(shownSection);
  const isMajor = Boolean(shownSection && ["current", "voltage", "resistance", "relationships"].includes(shownSection.id));

  useEffect(() => {
    if (!eventSectionId || goal !== "understand" || !["current", "voltage", "resistance", "relationships"].includes(eventSectionId)) return;
    const timer = window.setTimeout(() => setExpanded(true), 0);
    return () => window.clearTimeout(timer);
  }, [eventSectionId, goal]);
  const measurements = evidence?.measurements ?? [];

  function selectSection(section: LivingReferenceSection) {
    setSelectedSectionId(section.id);
    setHistoryOpen(false);
    setExpanded(["current", "voltage", "resistance", "relationships"].includes(section.id));
    onHighlightObject(sectionObject[section.id] ?? null);
  }

  return <aside className={styles.livingCompanion} data-expanded={expanded} data-goal={goal} aria-live="polite">
    <header>
      <button className={styles.companionHome} onClick={() => { setSelectedSectionId(null); setHistoryOpen(false); setExpanded(false); onHighlightObject(null); }}>
        <small>LIVE REFERENCE</small><strong>Mini textbook</strong>
      </button>
      <button className={styles.companionLessonButton} disabled={locked} aria-expanded={historyOpen} onClick={() => setHistoryOpen((value) => !value)}>My lesson <b>{reference.sections.length}</b></button>
    </header>

    {historyOpen && !locked ? <nav className={styles.companionHistory} aria-label="Learned reference entries">
      <small>KNOWLEDGE COLLECTED</small>
      {reference.sections.length ? reference.sections.map((section) => <button key={section.id} onClick={() => selectSection(section)}><span>{section.title}</span><em>{section.referenceState}</em></button>) : <p>Your first discovery will appear here.</p>}
      {reference.sections.length ? <button className={styles.openFullReference} onClick={onOpenFullReference}>Open full record →</button> : null}
    </nav> : null}

    <section className={styles.companionContent} data-preview={Boolean(previewDetail)}>
      {locked ? <>
        <small>REFERENCE PAUSED</small>
        <h3>Commit your answer first.</h3>
        <p>Helpful entries return after this check, so they cannot reveal the answer.</p>
      </> : previewDetail ? <>
        <small>CONTEXT PREVIEW{newObjectId === previewObjectId ? " · NEW" : ""}</small>
        <div className={styles.companionTitle}><h3>{previewDetail.label}</h3>{objectValue(previewDetail.id, scene) ? <strong>{objectValue(previewDetail.id, scene)}</strong> : null}</div>
        <p>{previewDetail.definition}</p>
        {expanded && previewDetail.mechanism ? <div className={styles.companionDeep}><small>WHY?</small><p>{previewDetail.mechanism}</p>{previewDetail.unit ? <p>{previewDetail.unit}</p> : null}</div> : null}
        <div className={styles.companionActions}><button onClick={() => setExpanded((value) => !value)}>{expanded ? "Less" : "Why?"}</button><span>Preview only · not marked as learned</span></div>
      </> : shownSection ? <>
        <small>{selectedSection ? "MY LESSON" : "JUST LEARNED"} · {shownSection.referenceState}</small>
        <h3>{shownSection.title}</h3>
        <p>{shownSection.canonicalKnowledge.at(-1)?.body}</p>
        {measurements.length ? <dl className={styles.companionMeasurements}>{measurements.slice(-4).map((measurement) => <div key={`${measurement.input}-${measurement.output}`}><dt>{measurement.input}</dt><dd>→ {measurement.output}</dd></div>)}</dl> : null}
        {shownSection.relationships.length ? <strong className={styles.companionRelationship}>{shownSection.relationships.at(-1)}</strong> : null}
        {expanded ? <div className={styles.companionDeep}><small>CONNECTED TO YOUR EXPERIENCE</small>{shownSection.canonicalKnowledge.map((item) => <p key={item.id}>{item.body}</p>)}{evidence ? <p><b>Your evidence:</b> {evidence.detail}</p> : null}</div> : null}
        <div className={styles.companionActions}>{isMajor ? <button onClick={() => setExpanded((value) => !value)}>{expanded ? "Collapse" : "Explore this concept"}</button> : <span>Saved in My lesson</span>}</div>
      </> : <>
        <small>CURRENT LEARNING ENTRY</small>
        <h3>{activeTitle(activity)}</h3>
        <p>{activeSummary(activity, scene)}</p>
        <div className={styles.companionActions}>{expanded ? <button onClick={() => setExpanded(false)}>Collapse</button> : null}<span>The reference follows what you do.</span></div>
      </>}
    </section>
  </aside>;
}
