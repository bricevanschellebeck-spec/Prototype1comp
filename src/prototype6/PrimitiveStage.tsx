"use client";

import { useMemo, useState } from "react";
import { circuitKnowledge, deriveValue, valueById } from "./knowledge";
import type { BlockOutcome, CompiledStage } from "./types";
import type { CircuitState } from "./CircuitScene";
import styles from "./prototype6.module.css";

const scoredKinds = new Set(["prediction", "multiple-choice", "target-challenge", "transfer-challenge"]);
const unitFor = (variableId: string) => circuitKnowledge.variables.find((item) => item.id === variableId)?.unit ?? "";
const variableFor = (valueId: string) => valueById(valueId)?.variableId;
const format = (value: number) => Number(value.toFixed(2));

function complete(stage: CompiledStage, onOutcome: (outcome: BlockOutcome) => void, result: BlockOutcome["result"], attempts = 1, hintUsed = false) {
  onOutcome({ stageId: stage.stageId, result, attempts, hintUsed, misconceptionIds: result === "incorrect" ? stage.addressesMisconceptionIds : [] });
}

function DirectionChoice({ stage, onOutcome }: { stage: CompiledStage; onOutcome: (outcome: BlockOutcome) => void }) {
  const [attempts, setAttempts] = useState(0); const [hint, setHint] = useState(false); const [feedback, setFeedback] = useState("");
  const choose = (choice: "increases" | "decreases" | "same") => {
    const nextAttempts = attempts + 1; setAttempts(nextAttempts);
    const primitive = stage.primitive.kind === "prediction" || stage.primitive.kind === "multiple-choice" ? stage.primitive : null;
    const direction = circuitKnowledge.relationships.find((item) => item.id === primitive?.relationshipId)?.type;
    const correct = choice === direction;
    setFeedback(correct ? stage.correctFeedback || "That matches the trusted relationship." : stage.incorrectFeedback || "Compare the values again.");
    complete(stage, onOutcome, correct ? "correct" : "incorrect", nextAttempts, hint);
  };
  return <div className={styles.directionChoice}>
    <div className={styles.choiceRow}>{([['increases', '↑', 'Increases'], ['decreases', '↓', 'Decreases'], ['same', '=', 'Stays the same']] as const).map(([id, mark, label]) => <button key={id} onClick={() => choose(id)}><i>{mark}</i><strong>{label}</strong></button>)}</div>
    <div className={styles.inlineGuide}>{feedback || "Choose before changing the circuit."}</div>
    <button className={styles.hintButton} onClick={() => { setHint(true); setFeedback("Hold voltage fixed. Compare only resistance and current."); }}>Need one clue?</button>
  </div>;
}

function ParameterExperiment({ stage, state, setState, onOutcome }: { stage: CompiledStage; state: CircuitState; setState: (state: CircuitState) => void; onOutcome: (outcome: BlockOutcome) => void }) {
  const [visited, setVisited] = useState<string[]>([]);
  if (stage.primitive.kind !== "parameter-experiment") return null;
  const current = deriveValue(stage.primitive.derivationRuleId, [state.voltageId, state.resistanceId]);
  const select = (id: string) => {
    const fixed = new Map(stage.primitive.kind === "parameter-experiment" ? stage.primitive.fixedBindings.map((item) => [item.variableId, item.valueId]) : []);
    setState({ voltageId: stage.primitive.kind === "parameter-experiment" && stage.primitive.controlVariableId === "voltage" ? id : fixed.get("voltage") || state.voltageId, resistanceId: stage.primitive.kind === "parameter-experiment" && stage.primitive.controlVariableId === "resistance" ? id : fixed.get("resistance") || state.resistanceId });
    setVisited((before) => before.includes(id) ? before : [...before, id]);
  };
  const ready = visited.length >= stage.primitive.minimumComparisons;
  return <div className={styles.experimentPanel}>
    <div className={styles.resistanceChoices}>{stage.primitive.selectableValueIds.map((id) => { const value = valueById(id)!; return <button data-active={state.resistanceId === id} key={id} onClick={() => select(id)}><small>RESISTOR</small><strong>{value.value} {unitFor(value.variableId)}</strong><span>{visited.includes(id) ? "measured" : "try"}</span></button>; })}</div>
    <div className={styles.liveReadout}><small>LIVE CURRENT</small><strong>{current === undefined ? "—" : format(current)} A</strong><span>{visited.length} / {stage.primitive.minimumComparisons} comparisons</span></div>
    <button className={styles.primaryButton} disabled={!ready} onClick={() => complete(stage, onOutcome, "completed")}>{ready ? "Use these observations →" : "Try another resistance"}</button>
  </div>;
}

function Comparison({ stage, onOutcome }: { stage: CompiledStage; onOutcome: (outcome: BlockOutcome) => void }) {
  if (stage.primitive.kind !== "comparison") return null;
  return <div className={styles.comparisonPanel}>{stage.primitive.caseBindings.map((item) => {
    const derived = stage.primitive.kind === "comparison" && stage.primitive.derivationRuleId ? deriveValue(stage.primitive.derivationRuleId, item.valueIds) : undefined;
    return <article key={item.label}><small>{item.label}</small><strong>{item.valueIds.map((id) => `${valueById(id)?.value} ${unitFor(variableFor(id) || "")}`).join(" · ")}</strong>{derived !== undefined ? <b>{format(derived)} A</b> : null}</article>;
  })}<button className={styles.primaryButton} onClick={() => complete(stage, onOutcome, "completed")}>Use this contrast →</button></div>;
}

function DataPlot({ stage, state, setState, onOutcome }: { stage: CompiledStage; state: CircuitState; setState: (state: CircuitState) => void; onOutcome: (outcome: BlockOutcome) => void }) {
  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([]);
  if (stage.primitive.kind !== "data-plot") return null;
  const fixedIds = stage.primitive.fixedBindings.map((item) => item.valueId);
  const add = (id: string) => { const x = valueById(id)?.value; const y = deriveValue(stage.primitive.kind === "data-plot" ? stage.primitive.derivationRuleId : "", [...fixedIds, id]); if (x === undefined || y === undefined) return; const fixed = new Map(stage.primitive.kind === "data-plot" ? stage.primitive.fixedBindings.map((item) => [item.variableId, item.valueId]) : []); setState({ voltageId: stage.primitive.kind === "data-plot" && stage.primitive.xVariableId === "voltage" ? id : fixed.get("voltage") || state.voltageId, resistanceId: stage.primitive.kind === "data-plot" && stage.primitive.xVariableId === "resistance" ? id : fixed.get("resistance") || state.resistanceId }); setPoints((before) => before.some((point) => point.x === x) ? before : [...before, { x, y }].sort((a, b) => a.x - b.x)); };
  const maxX = Math.max(...stage.primitive.xValueIds.map((id) => valueById(id)?.value ?? 1)); const maxY = Math.max(...stage.primitive.xValueIds.map((id) => deriveValue(stage.primitive.kind === "data-plot" ? stage.primitive.derivationRuleId : "", [...fixedIds, id]) ?? 1));
  return <div className={styles.plotPanel}><div className={styles.plotControls}>{stage.primitive.xValueIds.map((id) => <button key={id} onClick={() => add(id)}>{valueById(id)?.value} Ω</button>)}</div><svg viewBox="0 0 460 220" aria-label="Learner generated resistance and current graph"><path d="M45 18 V185 H435"/>{points.map((point) => <circle key={point.x} cx={45 + point.x / maxX * 370} cy={185 - point.y / maxY * 150} r="7"/>)}{points.length > 1 ? <polyline points={points.map((point) => `${45 + point.x / maxX * 370},${185 - point.y / maxY * 150}`).join(" ")}/> : null}<text x="405" y="210">R</text><text x="18" y="26">I</text></svg><button className={styles.primaryButton} disabled={points.length < 3} onClick={() => complete(stage, onOutcome, "completed")}>Name the pattern →</button></div>;
}

function DerivedTask({ stage, onOutcome }: { stage: CompiledStage; onOutcome: (outcome: BlockOutcome) => void }) {
  const [revealed, setRevealed] = useState(false); const [attempts, setAttempts] = useState(0);
  if (!(["worked-example", "target-challenge", "transfer-challenge"] as string[]).includes(stage.primitive.kind)) return null;
  const primitive = stage.primitive as Extract<CompiledStage["primitive"], { kind: "worked-example" }> | Extract<CompiledStage["primitive"], { kind: "target-challenge" }> | Extract<CompiledStage["primitive"], { kind: "transfer-challenge" }>;
  const answer = deriveValue(primitive.derivationRuleId, primitive.inputValueIds);
  const targetVariableId = primitive.kind === "worked-example" ? circuitKnowledge.derivations.find((item) => item.id === primitive.derivationRuleId)?.outputVariableId || "current" : primitive.targetVariableId;
  const inputs = primitive.inputValueIds.map((id) => valueById(id)).filter(Boolean);
  if (primitive.kind === "worked-example") return <div className={styles.workedExample}><div>{inputs.map((item) => <span key={item!.id}>{item!.value} {unitFor(item!.variableId)}</span>)}</div><i>÷</i><strong>{revealed && answer !== undefined ? `${format(answer)} ${unitFor(targetVariableId)}` : "?"}</strong><button className={styles.primaryButton} onClick={() => revealed ? complete(stage, onOutcome, "completed") : setRevealed(true)}>{revealed ? "Continue →" : "Reveal the operation"}</button></div>;
  const values = circuitKnowledge.values.filter((item) => item.variableId === targetVariableId); const options = [...new Set([answer, ...values.map((item) => item.value)].filter((item): item is number => item !== undefined))].slice(0, 4).sort((a, b) => a - b);
  return <div className={styles.targetTask}><div className={styles.givenValues}>{inputs.map((item) => <span key={item!.id}><small>{circuitKnowledge.variables.find((v) => v.id === item!.variableId)?.label}</small><strong>{item!.value} {unitFor(item!.variableId)}</strong></span>)}</div><div className={styles.answerChoices}>{options.map((option) => <button key={option} onClick={() => { const next = attempts + 1; setAttempts(next); complete(stage, onOutcome, option === answer ? "correct" : "incorrect", next); }}>{option} {unitFor(targetVariableId)}</button>)}</div></div>;
}

export function PrimitiveStage({ stage, circuitState, setCircuitState, onOutcome }: { stage: CompiledStage; circuitState: CircuitState; setCircuitState: (state: CircuitState) => void; onOutcome: (outcome: BlockOutcome) => void }) {
  const [revealed, setRevealed] = useState(false);
  const highlights = useMemo(() => stage.primitive.kind === "observation" || stage.primitive.kind === "diagram" ? stage.primitive.highlightConceptIds : [], [stage]);
  const passive = ["explanation", "observation", "diagram", "evidence-reveal"].includes(stage.primitive.kind);
  return <section className={styles.activeStage}>
    <header><span>{stage.role} · {stage.estimatedMinutes} min</span><h1>{stage.title}</h1><p>{stage.instruction}</p></header>
    {stage.primitive.kind === "prediction" || stage.primitive.kind === "multiple-choice" ? <DirectionChoice stage={stage} onOutcome={onOutcome}/> : null}
    {stage.primitive.kind === "parameter-experiment" ? <ParameterExperiment stage={stage} state={circuitState} setState={setCircuitState} onOutcome={onOutcome}/> : null}
    {stage.primitive.kind === "comparison" ? <Comparison stage={stage} onOutcome={onOutcome}/> : null}
    {stage.primitive.kind === "data-plot" ? <DataPlot stage={stage} state={circuitState} setState={setCircuitState} onOutcome={onOutcome}/> : null}
    {stage.primitive.kind === "worked-example" || stage.primitive.kind === "target-challenge" || stage.primitive.kind === "transfer-challenge" ? <DerivedTask stage={stage} onOutcome={onOutcome}/> : null}
    {passive ? <div className={styles.passiveStage}><div className={styles.conceptMarks}>{highlights.map((id) => <span key={id}>{circuitKnowledge.concepts.find((item) => item.id === id)?.name}</span>)}</div>{stage.explanation ? <p data-visible={revealed}>{revealed ? stage.explanation : "Observe the circuit first. Reveal the idea when you are ready."}</p> : null}<button className={styles.primaryButton} onClick={() => stage.explanation && !revealed ? setRevealed(true) : complete(stage, onOutcome, "completed")}>{stage.explanation && !revealed ? "Reveal from the evidence" : "Continue →"}</button></div> : null}
    {!scoredKinds.has(stage.primitive.kind) && stage.primitive.kind === "explanation" && !passive ? <button onClick={() => complete(stage, onOutcome, "completed")}>Continue</button> : null}
  </section>;
}
