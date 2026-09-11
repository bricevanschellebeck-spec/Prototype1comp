"use client";

import { useEffect, useRef, useState } from "react";
import type { EvidenceEvent, GuidanceLevel, P65Activity, P65Depth, P65Goal } from "./types";
import type { SceneState } from "./Scenes";
import styles from "./prototype65.module.css";

type Props = {
  activity: P65Activity;
  goal: P65Goal;
  depth: P65Depth;
  scene: SceneState;
  setScene: React.Dispatch<React.SetStateAction<SceneState>>;
  onFinish: (event: EvidenceEvent) => void;
};

function eventFor(activity: P65Activity, result: EvidenceEvent["result"], attempts: number, guidanceLevel: GuidanceLevel, detail: string): EvidenceEvent {
  return { activityId: activity.id, conceptIds: activity.conceptIds, channel: activity.evidenceChannel, result, attempts, guidanceLevel, detail };
}

function Guidance({ level, subject }: { level: number; subject: "circuit" | "history" }) {
  if (!level) return null;
  const circuit = ["", "Keep the battery fixed.", "Look at the resistor, not the lamp.", "Should resistance become larger or smaller?", "Compare 3 Ω with 9 Ω.", "Use current = voltage ÷ resistance."];
  const history = ["", "Look for language about competition.", "Compare what each source directly claims.", "Which source mentions a challenge?", "Source B connects the goal to competition.", "Use the direct source as evidence in your chain."];
  return <div className={styles.guidanceCue}><small>GUIDANCE · LEVEL {level}</small><p>{(subject === "circuit" ? circuit : history)[level]}</p></div>;
}

export function ActivityDock({ activity, goal, depth, scene, setScene, onFinish }: Props) {
  const [attempts, setAttempts] = useState(0);
  const [guidance, setGuidance] = useState<GuidanceLevel>(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [predictionChoice, setPredictionChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const finishingRef = useRef(false);
  const learnerPrompt = activity.goalPrompts?.[goal] ?? activity.prompt;

  useEffect(() => {
    if (activity.interaction === "compare-resistance") {
      setScene((before) => ({ ...before, circuits: { ...before.circuits, closed: true, voltage: 9, comparisonVisible: true } }));
    }
    if (activity.interaction === "repair-circuit") {
      setScene((before) => ({ ...before, circuits: { ...before.circuits, closed: false, comparisonVisible: false } }));
    }
  }, [activity.interaction, setScene]);

  const finish = (result: EvidenceEvent["result"], detail: string, level = guidance) => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    onFinish(eventFor(activity, result, Math.max(1, attempts + 1), level, detail));
  };
  const finishAfter = (delay: number, result: EvidenceEvent["result"], detail: string, level = guidance) => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    window.setTimeout(() => onFinish(eventFor(activity, result, Math.max(1, attempts + 1), level, detail)), delay);
  };
  const miss = (message: string) => {
    const next = Math.min(5, guidance + 1) as GuidanceLevel;
    setAttempts((value) => value + 1); setGuidance(next); setFeedback(message);
    setScene((before) => ({ ...before, circuits: { ...before.circuits, guidanceLevel: next }, history: { ...before.history, guidanceLevel: next } }));
  };

  let body: React.ReactNode;
  if (activity.interaction === "close-circuit") body = <div className={styles.actionBody}><button className={styles.objectAction} onClick={() => { setScene((before) => ({ ...before, circuits: { ...before.circuits, closed: true } })); finishAfter(700, "supported", "Closed the circuit and observed current begin to flow."); }}><span>SWITCH</span><strong>Close the gap</strong><i>↘</i></button><p className={styles.actionHint}>One break changes the whole system.</p></div>;
  else if (activity.interaction === "observe-voltage") {
    const values = activity.circuitRuntime?.selectableVoltages ?? [9, 12];
    const fixedResistance = activity.circuitRuntime?.fixed?.resistance ?? scene.circuits.resistance;
    const comparisonComplete = selected.length === values.length;
    body = <div className={styles.actionBody}>{goal === "understand" ? <div className={styles.experimentStructure}><span><small>FIXED</small><strong>Resistance · {fixedResistance} Ω</strong></span><span><small>CHANGED</small><strong>Voltage</strong></span><span><small>MEASURED</small><strong>Current</strong></span></div> : null}<div className={styles.voltageChoices}>{values.map((value) => { const observed = selected.includes(String(value)); const active = scene.circuits.voltage === value; return <button key={value} data-active={active} data-observed={observed} onClick={() => { const next = [...new Set([...selected, String(value)])]; setSelected(next); setScene((before) => ({ ...before, circuits: { ...before.circuits, closed: true, voltage: value, resistance: fixedResistance, voltageObservations: [...new Set([...before.circuits.voltageObservations, value])] } })); if (next.length === values.length && goal !== "understand") finishAfter(650, "supported", `Compared ${values.join(" V and ")} V with the same ${fixedResistance} Ω resistance and observed the current change.`); }}><small>BATTERY</small><strong>{value} V</strong><span>{observed ? `✓ tested · ${(value / fixedResistance).toFixed(2)} A` : active ? "active · test this" : "try"}</span></button>; })}</div>{goal === "understand" && comparisonComplete ? <button className={styles.completeAction} onClick={() => finish("supported", `Compared ${values.join(" V and ")} V with the same ${fixedResistance} Ω resistance and observed the current change.`)}>Keep this in My lesson →</button> : <p className={styles.actionHint}>{selected.length ? `Resistance stayed at ${fixedResistance} Ω. Only the battery changed.` : "Change one thing. Watch the current."}</p>}</div>;
  }
  else if (activity.interaction === "predict-current") {
    const choices = [["↑", "increases"], ["↓", "decreases"], ["=", "stays the same"]];
    const predictionButtons = <div className={styles.directionChoices}>{choices.map(([mark,label]) => <button key={label} data-selected={predictionChoice === label} disabled={goal === "curious" && predictionChoice !== null} onClick={() => {
      if (goal === "curious") { setPredictionChoice(label); return; }
      setAttempts((value) => value + 1);
      if (label === "decreases") { setScene((before) => ({ ...before, circuits: { ...before.circuits, comparisonVisible: false, assessmentEvidenceRevealed: true } })); finish(attempts ? "supported" : "strong", attempts ? "Recovered after comparing resistance and current." : "Correctly predicted that current decreases as resistance rises."); }
      else { setScene((before) => ({ ...before, circuits: { ...before.circuits, comparisonVisible: true, assessmentEvidenceRevealed: true, guidanceLevel: 1 } })); finish("misconception", "Predicted that current would not decrease as resistance increased.", 1); }
    }}><i>{mark}</i><strong>{label}</strong></button>)}</div>;
    body = <div className={styles.actionBody}>{predictionButtons}{goal === "curious" && predictionChoice ? <button className={styles.testPrediction} onClick={() => {
      const values = activity.circuitRuntime?.selectableResistances ?? [4, 9];
      const [beforeResistance, afterResistance] = values;
      setScene((before) => ({ ...before, circuits: { ...before.circuits, closed: true, resistance: afterResistance, measurements: [...new Set([...before.circuits.measurements, beforeResistance, afterResistance])], comparisonVisible: false, assessmentEvidenceRevealed: true } }));
      finishAfter(1400, predictionChoice === "decreases" ? "strong" : "misconception", predictionChoice === "decreases" ? "Predicted the direction, then revealed it by changing the circuit." : "Tested the prediction and observed current fall as resistance increased.", predictionChoice === "decreases" ? 0 : 1);
    }}>Test it on the circuit →</button> : <p className={styles.actionHint}>Commit first. The earlier evidence is hidden until you test.</p>}</div>;
  }
  else if (activity.interaction === "resistance-lab") {
    const values = [3, 6, 9, 12];
    const required = goal === "curious" && depth === "quick" ? 2 : depth === "deep" && goal !== "curious" ? 4 : 3;
    const enoughEvidence = scene.circuits.measurements.length >= required;
    body = <div className={styles.actionBody}><div className={styles.resistorRack}>{values.map((value) => <button key={value} data-collected={scene.circuits.measurements.includes(value)} onClick={() => { const next = [...new Set([...scene.circuits.measurements, value])]; setSelected(next.map(String)); setScene((before) => ({ ...before, circuits: { ...before.circuits, closed: true, resistance: value, measurements: next } })); }}><small>RESISTOR</small><strong>{value} Ω</strong><span>{scene.circuits.measurements.includes(value) ? "collected" : "try"}</span></button>)}</div><div className={styles.evidenceProgress}><span style={{ width: `${Math.min(100, scene.circuits.measurements.length / required * 100)}%` }}/><small>{Math.min(required, scene.circuits.measurements.length)} / {required} observations</small></div>{enoughEvidence ? <div className={styles.relationshipBuilder}><small>COMPLETE THE PATTERN YOUR EVIDENCE SHOWS</small>{[["Resistance ↑", "Current ↓", true], ["Resistance ↑", "Current ↑", false], ["Resistance changes", "Current stays equal", false]].map(([left, right, correct]) => <button key={`${left}-${right}`} onClick={() => { if (correct) finish(attempts ? "supported" : "strong", `Generated ${scene.circuits.measurements.length} measurements and correctly connected higher resistance with lower current.`); else miss("Keep the 9 V battery in view and compare your first and last measurements."); }}><span>{left}</span><i>→</i><strong>{right}</strong></button>)}</div> : <p className={styles.actionHint}>Build enough evidence before naming the rule.</p>}{feedback ? <p className={styles.feedback}>{feedback}</p> : null}</div>;
  }
  else if (activity.interaction === "compare-resistance") body = <div className={styles.actionBody}><div className={styles.comparePrompt}><small>INSPECT THE TWO STATES</small><strong>What changed between them?</strong></div><div className={styles.compareChoices}>{["The battery", "The resistance", "Both"].map((choice) => <button key={choice} onClick={() => { setAttempts((value) => value + 1); if (choice === "The resistance") { setScene((before) => ({ ...before, circuits: { ...before.circuits, resistance: 9, comparisonVisible: false } })); finish(attempts ? "supported" : "strong", "Compared two 9 V circuits and isolated resistance as the change that explains the current difference."); } else miss("Both states use the same 9 V battery. Look again at the resistor labels."); }}>{choice}</button>)}</div><Guidance level={guidance} subject="circuit"/>{feedback ? <p className={styles.feedback}>{feedback}</p> : null}</div>;
  else if (activity.interaction === "target-current") body = <div className={styles.actionBody}><div className={styles.targetReadout}><small>MISSION</small><strong>9 V · target 1.50 A</strong></div><div className={styles.resistorRack}>{[3,6,9].map((value) => <button key={value} onClick={() => { setScene((before) => ({ ...before, circuits: { ...before.circuits, closed: true, voltage: 9, resistance: value } })); if (value === 6) finish(attempts ? "supported" : "strong", `Reached 1.50 A with a 6 Ω resistor${attempts ? " after support" : " independently"}.`); else miss(value < 6 ? "The current is too high." : "The current is too low."); }}><strong>{value} Ω</strong><span>try</span></button>)}</div><Guidance level={guidance} subject="circuit"/>{feedback ? <p className={styles.feedback}>{feedback}</p> : null}</div>;
  else if (activity.interaction === "repair-circuit") body = <div className={styles.actionBody}><div className={styles.repairReadout}><small>FAULT STATE</small><strong>Lamp off · current 0 A</strong><span>Trace the loop. Change only what is broken.</span></div><div className={styles.repairChoices}>{[["Close the open switch", "switch"], ["Replace the 9 V battery", "battery"], ["Remove the resistor", "resistor"]].map(([label, repair]) => <button key={repair} onClick={() => { setAttempts((value) => value + 1); if (repair === "switch") { setScene((before) => ({ ...before, circuits: { ...before.circuits, closed: true } })); finishAfter(650, attempts ? "supported" : "strong", `Repaired the broken path by closing the switch${attempts ? " after inspecting another component" : " without changing working components"}.`); } else miss("That component was working. Follow the wire until you find the break."); }}><span>{repair}</span><strong>{label}</strong></button>)}</div><Guidance level={guidance} subject="circuit"/>{feedback ? <p className={styles.feedback}>{feedback}</p> : null}</div>;
  else if (activity.interaction === "transfer-current") body = <div className={styles.actionBody}><div className={styles.targetReadout}><small>NEW CIRCUIT</small><strong>12 V ÷ 6 Ω = ?</strong></div><div className={styles.numericChoices}>{[1,2,3,4].map((value) => <button key={value} onClick={() => { setScene((before) => ({ ...before, circuits: { ...before.circuits, closed: true, voltage: 12, resistance: 6 } })); if (value === 2) finish(attempts ? "supported" : "strong", "Transferred Ohm's law to a 12 V circuit and found 2 A."); else miss("Use the new voltage, not the previous current."); }}>{value} A</button>)}</div><Guidance level={guidance} subject="circuit"/></div>;
  else if (activity.interaction === "circuit-playground") body = <div className={styles.actionBody}><div className={styles.playgroundControls}><label>Battery<select value={scene.circuits.voltage} onChange={(e) => setScene((before) => ({ ...before, circuits: { ...before.circuits, closed: true, voltage: Number(e.target.value) } }))}><option>9</option><option>12</option></select><span>V</span></label><label>Resistance<input type="range" min="3" max="12" step="1" value={scene.circuits.resistance} onChange={(e) => setScene((before) => ({ ...before, circuits: { ...before.circuits, resistance: Number(e.target.value) } }))}/><span>{scene.circuits.resistance} Ω</span></label></div><button className={styles.completeAction} onClick={() => finish("observed", "Used the open circuit playground to investigate a personal combination.")}>Keep this discovery →</button></div>;
  else if (activity.interaction === "inspect-timeline") body = <div className={styles.actionBody}><button className={styles.objectAction} onClick={() => { const count = Math.min(4, scene.history.revealedEvents + 1); setScene((before) => ({ ...before, history: { ...before.history, revealedEvents: count } })); if (count === 4) finishAfter(500, "supported", "Revealed and inspected four turning points from 1957 to 1969."); }}><span>ARCHIVE</span><strong>{scene.history.revealedEvents >= 4 ? "Timeline complete" : "Reveal the next event"}</strong><i>→</i></button><p className={styles.actionHint}>{scene.history.revealedEvents} / 4 moments visible</p></div>;
  else if (activity.interaction === "connect-causes") body = <div className={styles.actionBody}><div className={styles.causeChoices}>{["A better telescope made landing inevitable.","Cold War competition increased pressure to demonstrate capability.","The events were unrelated achievements."].map((choice,index) => <button key={choice} onClick={() => { setAttempts((value) => value + 1); if (index === 1) { setScene((before) => ({ ...before, history: { ...before.history, causeConnected: true } })); finish(attempts ? "supported" : "strong", "Connected Cold War competition to increased investment and commitment."); } else { setScene((before) => ({ ...before, history: { ...before.history, sourceSupportVisible: true, guidanceLevel: 1 } })); finish("misconception", "Selected a connection not supported by the visible chronology.", 1); } }}>{choice}</button>)}</div></div>;
  else if (activity.interaction === "source-evidence") body = <div className={styles.actionBody}><p className={styles.actionHint}>Which source speaks most directly about competition?</p><div className={styles.sourceChoices}>{["Source A","Source B"].map((source) => <button key={source} onClick={() => { setAttempts((value) => value + 1); if (source === "Source B") { setScene((before) => ({ ...before, history: { ...before.history, sourceSelected: true } })); finish(attempts ? "supported" : "strong", "Selected the source with direct competition language."); } else miss("That source shows ambition, but does it directly establish competition?"); }}>{source}<span>{source === "Source A" ? "public ambition" : "challenge language"}</span></button>)}</div><Guidance level={guidance} subject="history"/></div>;
  else if (activity.interaction === "build-cause-chain") body = <div className={styles.actionBody}><div className={styles.chainChoices}>{["Apollo 11 → competition → commitment","Competition → commitment → Apollo 11","Commitment → Apollo 11 → Sputnik"].map((chain,index) => <button key={chain} onClick={() => { setAttempts((value) => value + 1); if (index === 1) { setScene((before) => ({ ...before, history: { ...before.history, chainBuilt: true } })); finish(attempts ? "supported" : "strong", "Constructed a chronological cause-decision-outcome explanation."); } else miss("Keep cause before decision, and decision before outcome."); }}>{chain}</button>)}</div><Guidance level={guidance} subject="history"/></div>;
  else body = <div className={styles.actionBody}><p className={styles.actionHint}>Choose a thread in the timeline and inspect how it connects.</p><div className={styles.explorationThreads}>{["People","Competition","Technology","Consequences"].map((thread) => <button key={thread} data-selected={selected.includes(thread)} onClick={() => setSelected((before) => before.includes(thread) ? before : [...before, thread])}>{thread}</button>)}</div><button className={styles.completeAction} disabled={!selected.length} onClick={() => finish("observed", `Explored the ${selected.join(" and ")} thread independently.`)}>Keep this exploration →</button></div>;

  return <section className={styles.activityDock} data-purpose={activity.purpose} data-interaction={activity.interaction}>
    <header><div><small>{activity.family.replaceAll("-", " ")} · {activity.freedom.replaceAll("-", " ")}</small><h2>{activity.title}</h2></div><span>{activity.purpose === "casual" ? "learn" : "challenge"}</span></header>
    <p className={styles.activityPrompt}>{learnerPrompt}</p>
    {body}
  </section>;
}
