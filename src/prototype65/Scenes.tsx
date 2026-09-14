"use client";

import { type ComponentType } from "react";
import { objectKnowledgeState, shouldRevealContext } from "./information";
import { learnerEvidenceVisible } from "./runtime";
import type { AdaptationDecision, GoldLesson, P65Activity, P65Depth, P65Goal, P65SubjectId } from "./types";
import styles from "./prototype65.module.css";

export type CircuitCanvasState = {
  closed: boolean;
  voltage: number;
  resistance: number;
  measurements: number[];
  voltageObservations: number[];
  comparisonVisible: boolean;
  assessmentEvidenceRevealed: boolean;
  guidanceLevel: number;
};

export type HistoryCanvasState = {
  revealedEvents: number;
  causeConnected: boolean;
  sourceSelected: boolean;
  chainBuilt: boolean;
  sourceSupportVisible: boolean;
  guidanceLevel: number;
};

export type SceneState = { circuits: CircuitCanvasState; history: HistoryCanvasState };

type SceneProps = {
  lesson: GoldLesson;
  goal: P65Goal;
  depth: P65Depth;
  state: SceneState;
  activeActivity?: P65Activity;
  adaptation: AdaptationDecision | null;
  completedActivityIds: string[];
  inspectedObjectId: string | null;
  onInspectObject: (objectId: string | null) => void;
};

function ObjectInformation({ lesson, activity, completedActivityIds, actionObserved = false, objectId, value, className, highlighted, inspectedObjectId, onInspectObject }: {
  lesson: GoldLesson;
  activity?: P65Activity;
  completedActivityIds: string[];
  actionObserved?: boolean;
  objectId: string;
  value?: string;
  className: string;
  highlighted?: boolean;
  inspectedObjectId: string | null;
  onInspectObject: (objectId: string | null) => void;
}) {
  const detail = lesson.objectDetails.find((candidate) => candidate.id === objectId);
  const knowledge = objectKnowledgeState(objectId, lesson, activity, completedActivityIds, actionObserved);
  if (!detail || knowledge === "future") return null;
  const inspecting = inspectedObjectId === objectId;
  return <div className={`${styles.objectLabel} ${className}`} data-object={objectId} data-knowledge={knowledge} data-highlight={highlighted || knowledge === "active" || inspecting} onMouseEnter={() => onInspectObject(objectId)} onMouseLeave={() => onInspectObject(null)}>
    <div className={styles.objectIdentity}><small>{detail.label}</small>{value ? <strong>{value}</strong> : null}</div>
    <button className={styles.explainObject} onFocus={() => onInspectObject(objectId)} onBlur={() => onInspectObject(null)} onClick={() => onInspectObject(objectId)} aria-label={`Show ${detail.label} in the mini textbook`}>{knowledge === "active" ? "Read" : "?"}</button>
  </div>;
}

function ContextualExplanation({ activity, visible }: { activity?: P65Activity; visible: boolean }) {
  if (!visible || !activity?.information.contextualExplanation || !activity.information.contextualTargetObjectId) return null;
  return <div className={styles.contextualExplanation} data-target={activity.information.contextualTargetObjectId}>
    <small>NOTICE THIS</small><p>{activity.information.contextualExplanation}</p>
  </div>;
}

function CircuitContinuum({ lesson, goal, state, activeActivity, adaptation, completedActivityIds, inspectedObjectId, onInspectObject }: SceneProps) {
  const circuit = state.circuits;
  const current = circuit.closed ? circuit.voltage / circuit.resistance : 0;
  const evidenceVisible = learnerEvidenceVisible(activeActivity, circuit.assessmentEvidenceRevealed);
  const showGraph = circuit.measurements.length >= 2 && evidenceVisible;
  const showFormula = activeActivity?.interaction !== "repair-circuit" && (completedActivityIds.includes("c-target") || activeActivity?.id === "c-transfer" || (activeActivity?.id === "c-target" && (goal === "understand" || goal === "curious" || circuit.guidanceLevel > 0)));
  const actionObserved = activeActivity?.interaction === "close-circuit" ? circuit.closed
    : activeActivity?.interaction === "observe-voltage" ? circuit.voltageObservations.length > 0
    : activeActivity?.interaction === "predict-current" ? circuit.comparisonVisible || circuit.guidanceLevel > 0
    : activeActivity?.interaction === "resistance-lab" ? circuit.measurements.length > 0
    : activeActivity?.interaction === "compare-resistance" ? circuit.comparisonVisible || circuit.guidanceLevel > 0
    : activeActivity?.interaction === "repair-circuit" ? circuit.closed || circuit.guidanceLevel > 0
    : activeActivity?.interaction === "circuit-playground" ? true
    : circuit.guidanceLevel > 0;
  const resistorState = objectKnowledgeState("resistor", lesson, activeActivity, completedActivityIds, actionObserved);
  const showContext = shouldRevealContext(activeActivity, { goal, actionObserved, guidanceLevel: circuit.guidanceLevel });
  const showVoltageConcept = goal === "understand" && activeActivity?.interaction === "observe-voltage" && circuit.voltageObservations.length >= 2;
  const showUnderstandChain = goal === "understand" && completedActivityIds.includes("c-close") && activeActivity?.interaction === "observe-voltage" && !showVoltageConcept;
  const speed = Math.max(1.2, Math.min(4.6, 5 - current));
  return <div className={styles.circuitContinuum} data-complexity={circuit.guidanceLevel > 1 ? "reduced" : "full"}>
    <div className={styles.sceneCaption}><small>LIVE SYSTEM</small><strong>{circuit.closed ? "A complete circuit" : "The path is open"}</strong></div>
    <svg className={styles.circuitSvg} viewBox="0 0 860 430" role="img" aria-label={`Circuit with ${circuit.voltage} volts, ${circuit.resistance} ohms and ${current.toFixed(2)} amperes`}>
      <path className={styles.wire} d="M135 82H310"/>
      {resistorState === "future" ? <path className={styles.wire} d="M310 82H500"/> : <path className={styles.resistor} d="m310 82 26-30 34 60 34-60 34 60 34-60 28 30"/>}
      <path className={styles.wire} d="M500 82H714V330H135V82"/>
      {!circuit.closed ? <path className={styles.openGap} d="M610 330h54m34 0h16M664 330l34-40"/> : null}
      {!circuit.closed && (activeActivity?.interaction === "close-circuit" || activeActivity?.interaction === "repair-circuit") ? <g className={styles.switchFocus} aria-hidden="true"><circle cx="681" cy="330" r="58"/><path d="M600 261h78l29 28"/></g> : null}
      <line className={styles.batteryLong} x1="88" y1="161" x2="179" y2="161"/>
      <line className={styles.batteryShort} x1="103" y1="210" x2="163" y2="210"/>
      <circle className={styles.lampGlow} cx="576" cy="330" r={38 + Math.min(24, current * 7)}/>
      <circle className={styles.lamp} cx="576" cy="330" r="40"/>
      <path className={styles.filament} d="m554 330 22-22 22 22-22 22z"/>
      {circuit.closed ? <path className={styles.chargeFlow} style={{ animationDuration: `${speed}s` }} d="M135 82H310L336 52l34 60 34-60 34 60 34-60 28 30H714V330H135V82"/> : null}
    </svg>
    <ObjectInformation lesson={lesson} activity={activeActivity} completedActivityIds={completedActivityIds} actionObserved={actionObserved} objectId="battery" value={`${circuit.voltage} V`} className={styles.batteryLabel} highlighted={activeActivity?.information.activeObjectIds.includes("battery") || circuit.guidanceLevel >= 1} inspectedObjectId={inspectedObjectId} onInspectObject={onInspectObject}/>
    <ObjectInformation lesson={lesson} activity={activeActivity} completedActivityIds={completedActivityIds} actionObserved={actionObserved} objectId="switch" className={styles.switchLabel} highlighted={activeActivity?.information.activeObjectIds.includes("switch")} inspectedObjectId={inspectedObjectId} onInspectObject={onInspectObject}/>
    <ObjectInformation lesson={lesson} activity={activeActivity} completedActivityIds={completedActivityIds} actionObserved={actionObserved} objectId="lamp" className={styles.lampLabel} inspectedObjectId={inspectedObjectId} onInspectObject={onInspectObject}/>
    <ObjectInformation lesson={lesson} activity={activeActivity} completedActivityIds={completedActivityIds} actionObserved={actionObserved} objectId="resistor" value={`${circuit.resistance} Ω`} className={styles.resistorLabel} highlighted={activeActivity?.information.activeObjectIds.includes("resistor")} inspectedObjectId={inspectedObjectId} onInspectObject={onInspectObject}/>
    <ObjectInformation lesson={lesson} activity={activeActivity} completedActivityIds={completedActivityIds} actionObserved={actionObserved} objectId="current-path" value={`${current.toFixed(2)} A`} className={styles.currentLabel} highlighted={activeActivity?.information.activeObjectIds.includes("current-path")} inspectedObjectId={inspectedObjectId} onInspectObject={onInspectObject}/>
    <ContextualExplanation activity={activeActivity} visible={showContext}/>
    {showUnderstandChain ? <div className={styles.circuitCausalChain}><small>WHAT CHANGED — AND WHY</small><div><span>Switch closes</span><i>→</i><span>Path completes</span><i>→</i><span>Current flows</span><i>→</i><span>Lamp responds</span></div></div> : null}
    {showVoltageConcept ? <aside className={styles.conceptReveal} aria-label="Voltage concept reveal"><small>CONCEPT REVEAL</small><h3>Voltage</h3><p>Voltage is the electrical push that drives current.</p><dl>{circuit.voltageObservations.map((voltage) => <div key={voltage}><dt>{voltage} V</dt><dd>→ {(voltage / circuit.resistance).toFixed(2)} A</dd></div>)}</dl><strong>Higher voltage → greater current</strong><span>You discovered this while resistance stayed fixed at {circuit.resistance} Ω.</span></aside> : null}
    {showGraph ? <div className={styles.attachedGraph}><header><small>YOUR EVIDENCE</small><strong>Current falls</strong></header><svg viewBox="0 0 230 130" aria-label="Graph created from learner circuit measurements"><path d="M28 12v94h184"/>{[...circuit.measurements].sort((a,b)=>a-b).map((resistance) => { const x = 28 + resistance / 12 * 170; const y = 106 - (circuit.voltage / resistance) / 4 * 80; return <circle key={resistance} cx={x} cy={y} r="6"/>; })}</svg></div> : null}
    {showFormula ? <div className={styles.formulaRibbon}><small>THE PATTERN YOU PRODUCED</small><strong>I = V ÷ R</strong></div> : null}
    {activeActivity?.interaction === "observe-voltage" && circuit.voltageObservations.length && !showVoltageConcept ? <div className={styles.voltageComparison}><small>SAME {circuit.resistance} Ω RESISTOR</small>{circuit.voltageObservations.map((voltage) => <div key={voltage}><strong>{voltage} V</strong><span>{(voltage / circuit.resistance).toFixed(2)} A</span></div>)}{goal === "understand" ? <p><b>A</b> means amperes—the unit for current.{circuit.voltageObservations.length > 1 ? <em>Higher voltage → greater current</em> : null}</p> : null}</div> : null}
    {circuit.comparisonVisible || adaptation?.kind === "comparison" || activeActivity?.interaction === "compare-resistance" ? <div className={styles.comparisonScene} data-activity={activeActivity?.interaction === "compare-resistance"}><small>SAME BATTERY · 9 V</small><div><b>CIRCUIT A</b><strong>3 Ω</strong><span>3.00 A</span></div><i>compare</i><div><b>CIRCUIT B</b><strong>9 Ω</strong><span>1.00 A</span></div></div> : null}
  </div>;
}

const historyEvents = [
  { year: "1957", title: "Sputnik", note: "First artificial satellite" },
  { year: "1961", title: "Gagarin", note: "First human in orbit" },
  { year: "1961", title: "Moon goal", note: "Kennedy commits the US" },
  { year: "1969", title: "Apollo 11", note: "Humans land on the Moon" },
];

function HistoryContinuum({ lesson, goal, state, activeActivity, adaptation, completedActivityIds, inspectedObjectId, onInspectObject }: SceneProps) {
  const history = state.history;
  const visibleCount = Math.max(history.revealedEvents, activeActivity?.id === "h-timeline" ? 1 : 4);
  const actionObserved = activeActivity?.interaction === "inspect-timeline" ? history.revealedEvents > 0
    : activeActivity?.interaction === "connect-causes" ? history.causeConnected || history.sourceSupportVisible || history.guidanceLevel > 0
    : activeActivity?.interaction === "source-evidence" ? history.sourceSelected || history.guidanceLevel > 0
    : activeActivity?.interaction === "build-cause-chain" ? history.chainBuilt || history.guidanceLevel > 0
    : true;
  const showContext = shouldRevealContext(activeActivity, { goal, actionObserved, guidanceLevel: history.guidanceLevel });
  return <div className={styles.historyContinuum}>
    <div className={styles.sceneCaption}><small>LIVE ARCHIVE</small><strong>The road to the Moon</strong></div>
    <div className={styles.timelineLine} aria-hidden="true"/>
    <div className={styles.timelineEvents}>{historyEvents.map((event, index) => <article key={`${event.year}-${event.title}`} data-visible={index < visibleCount} data-active={activeActivity?.id === "h-timeline" && index === visibleCount - 1}><span>{event.year}</span><i/><strong>{event.title}</strong>{index < visibleCount && activeActivity?.id === "h-timeline" && index === visibleCount - 1 ? <small>{event.note}</small> : null}</article>)}</div>
    <ObjectInformation lesson={lesson} activity={activeActivity} completedActivityIds={completedActivityIds} actionObserved={actionObserved} objectId="timeline" className={styles.historyTimelineLabel} highlighted={activeActivity?.information.activeObjectIds.includes("timeline")} inspectedObjectId={inspectedObjectId} onInspectObject={onInspectObject}/>
    <ObjectInformation lesson={lesson} activity={activeActivity} completedActivityIds={completedActivityIds} actionObserved={actionObserved} objectId="event-markers" className={styles.historyObjectLabel} highlighted={activeActivity?.information.activeObjectIds.includes("event-markers")} inspectedObjectId={inspectedObjectId} onInspectObject={onInspectObject}/>
    <ObjectInformation lesson={lesson} activity={activeActivity} completedActivityIds={completedActivityIds} actionObserved={actionObserved} objectId="cause-network" className={styles.historyObjectLabel} highlighted={activeActivity?.information.activeObjectIds.includes("cause-network")} inspectedObjectId={inspectedObjectId} onInspectObject={onInspectObject}/>
    <ObjectInformation lesson={lesson} activity={activeActivity} completedActivityIds={completedActivityIds} actionObserved={actionObserved} objectId="source-fragments" className={styles.historyObjectLabel} highlighted={activeActivity?.information.activeObjectIds.includes("source-fragments")} inspectedObjectId={inspectedObjectId} onInspectObject={onInspectObject}/>
    <ObjectInformation lesson={lesson} activity={activeActivity} completedActivityIds={completedActivityIds} actionObserved={actionObserved} objectId="cause-chain" className={styles.historyObjectLabel} highlighted={activeActivity?.information.activeObjectIds.includes("cause-chain")} inspectedObjectId={inspectedObjectId} onInspectObject={onInspectObject}/>
    <ContextualExplanation activity={activeActivity} visible={showContext}/>
    <div className={styles.historyConnections} data-visible={history.causeConnected || completedActivityIds.includes("h-causes")}><svg viewBox="0 0 900 190" aria-hidden="true"><path d="M105 30C250 5 325 160 445 92S680 35 795 130"/><path d="m775 116 22 14-25 8"/></svg><span>Competition increased pressure</span><strong>Pressure → commitment → Moon landing</strong></div>
    {(activeActivity?.id === "h-source" || history.sourceSelected || history.sourceSupportVisible || adaptation?.insertActivityId === "h-source") ? <div className={styles.sourceFragments}><blockquote><small>SOURCE A · 1961</small>“We choose to go to the Moon…”<span>Public ambition</span></blockquote><blockquote data-direct><small>SOURCE B · 1962</small>“This generation’s answer to the challenge…”<span>Direct competition language</span></blockquote></div> : null}
    {history.chainBuilt ? <div className={styles.causeChain}><span>Cold War pressure</span><i>→</i><span>Moon commitment</span><i>→</i><span>Apollo 11</span></div> : null}
    {history.guidanceLevel > 1 ? <div className={styles.archiveCue}>Look for the source that describes a <strong>challenge between nations</strong>.</div> : null}
  </div>;
}

const sceneRegistry: Record<P65SubjectId, ComponentType<SceneProps>> = { circuits: CircuitContinuum, history: HistoryContinuum };

export function PersistentLearningScene({ subjectId, ...props }: SceneProps & { subjectId: P65SubjectId }) {
  const Scene = sceneRegistry[subjectId];
  return <Scene {...props}/>;
}
