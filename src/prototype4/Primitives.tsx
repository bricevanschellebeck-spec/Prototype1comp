"use client";

import { useMemo, useState } from "react";
import type { BlockOutcome, InteractiveBlock, RenderConfig } from "./types";
import styles from "./prototype4.module.css";

type Props = {
  block: InteractiveBlock;
  runtime: Record<string, string | number>;
  onRuntime: (patch: Record<string, string | number>) => void;
  onComplete: (outcome: BlockOutcome) => void;
};

function OutcomeButton({ disabled, children, onClick }: { disabled?: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button className={styles.primaryAction} type="button" disabled={disabled} onClick={onClick}>{children}</button>;
}

function Prediction({ block, onRuntime, onComplete }: Props) {
  const config = block.render as Extract<RenderConfig, { kind: "prediction" }>;
  const [choice, setChoice] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState(false);
  const [correction, setCorrection] = useState(false);
  function commit() {
    if (!choice) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    const correct = choice === config.correctOptionId;
    if (!correct && block.role === "support") {
      setCorrection(true);
      return;
    }
    if (correct && config.scenePatch) onRuntime(config.scenePatch);
    const misconception = config.misconceptionByOption?.[choice];
    onComplete({ blockId: block.id, result: correct ? "correct" : "incorrect", attempts: nextAttempts, hintUsed: hint, misconceptionIds: !correct && misconception ? [misconception] : [] });
  }
  return (
    <div className={styles.actionContent}>
      <span className={styles.actionEyebrow}>{block.role === "support" ? "Guided retry" : "Start with evidence"}</span>
      <h2>{block.title}</h2>
      <p>{config.prompt}</p>
      <div className={styles.choiceGrid}>
        {config.options.map((option) => <button className={choice === option.id ? styles.choiceSelected : ""} type="button" key={option.id} onClick={() => { setChoice(option.id); setCorrection(false); }}><b>{option.symbol}</b><span>{option.label}</span></button>)}
      </div>
      {correction ? <small className={styles.correction}>Use the live comparison and try once more.</small> : null}
      <OutcomeButton disabled={!choice} onClick={commit}>Commit and test →</OutcomeButton>
      <button className={styles.hintButton} type="button" onClick={() => setHint(true)}>{hint ? config.hint : "Need one clue?"}</button>
    </div>
  );
}

function ParameterExperiment({ block, runtime, onRuntime, onComplete }: Props) {
  const config = block.render as Extract<RenderConfig, { kind: "parameter-experiment" }>;
  const current = Number(runtime[config.controlKey] ?? config.initial);
  const changed = Math.abs(current - config.initial) >= config.requiredDelta;
  const observation = config.observationTemplate
    .replace("{value}", String(current))
    .replace("{current}", (Number(runtime.voltage ?? 9) / current).toFixed(2));
  return (
    <div className={styles.actionContent}>
      <span className={styles.actionEyebrow}>Manipulate the system</span><h2>{block.title}</h2><p>{config.prompt}</p>
      <label className={styles.sliderControl}><span>{config.label}</span><strong>{current} {config.unit}</strong><input type="range" min={config.min} max={config.max} step={config.step} value={current} onChange={(event) => onRuntime({ [config.controlKey]: Number(event.target.value) })} /></label>
      <div className={styles.liveNote}>{observation}</div>
      <OutcomeButton disabled={!changed} onClick={() => onComplete({ blockId: block.id, result: "completed", attempts: 1, hintUsed: false, misconceptionIds: [] })}>Keep this observation →</OutcomeButton>
    </div>
  );
}

function Comparison({ block, onComplete }: Props) {
  const config = block.render as Extract<RenderConfig, { kind: "comparison" }>;
  return <div className={styles.actionContent}><span className={styles.actionEyebrow}>Compare one change</span><h2>{block.title}</h2><p>{config.prompt}</p><div className={styles.comparisonGrid}><article><span>{config.left.title}</span><strong>{config.left.value}</strong><small>{config.left.note}</small></article><article><span>{config.right.title}</span><strong>{config.right.value}</strong><small>{config.right.note}</small></article></div><OutcomeButton onClick={() => onComplete({ blockId: block.id, result: "completed", attempts: 1, hintUsed: false, misconceptionIds: [] })}>Use this comparison →</OutcomeButton></div>;
}

function DataPlot({ block, runtime, onRuntime, onComplete }: Props) {
  const config = block.render as Extract<RenderConfig, { kind: "data-plot" }>;
  const [measured, setMeasured] = useState<number[]>([]);
  const points = measured.map((value) => ({ x: value, y: Number(runtime.voltage ?? 9) / value }));
  return <div className={styles.actionContent}><span className={styles.actionEyebrow}>Generate a representation</span><h2>{block.title}</h2><p>{config.prompt}</p><div className={styles.measureButtons}>{config.values.map((value) => <button className={measured.includes(value) ? styles.choiceSelected : ""} type="button" key={value} onClick={() => { onRuntime({ [config.controlKey]: value }); setMeasured((previous) => previous.includes(value) ? previous : [...previous, value]); }}>{value} Ω</button>)}</div><div className={styles.miniPlot}>{config.values.map((value, index) => { const point = points.find((item) => item.x === value); return <i key={value} style={{ left: `${18 + index * 30}%`, bottom: point ? `${12 + point.y * 18}%` : "12%" }}><span>{point ? point.y.toFixed(1) : "?"}</span></i>; })}<b className={styles.plotAxisX}>{config.xLabel} →</b><b className={styles.plotAxisY}>{config.yLabel}</b></div><OutcomeButton disabled={measured.length < config.values.length} onClick={() => onComplete({ blockId: block.id, result: "completed", attempts: 1, hintUsed: false, misconceptionIds: [] })}>Use the pattern →</OutcomeButton></div>;
}

function Classification({ block, onComplete }: Props) {
  const config = block.render as Extract<RenderConfig, { kind: "classification" }>;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attempts, setAttempts] = useState(0);
  const complete = Object.keys(answers).length === config.items.length;
  return <div className={styles.actionContent}><span className={styles.actionEyebrow}>Classify the evidence</span><h2>{block.title}</h2><p>{config.prompt}</p><div className={styles.classificationList}>{config.items.map((item) => <label key={item.id}><span>{item.label}</span><select value={answers[item.id] ?? ""} onChange={(event) => setAnswers((previous) => ({ ...previous, [item.id]: event.target.value }))}><option value="">Choose…</option>{config.buckets.map((bucket) => <option value={bucket.id} key={bucket.id}>{bucket.label}</option>)}</select></label>)}</div><OutcomeButton disabled={!complete} onClick={() => { const nextAttempts = attempts + 1; setAttempts(nextAttempts); const correct = config.items.every((item) => answers[item.id] === item.correctBucketId); onComplete({ blockId: block.id, result: correct ? "correct" : "incorrect", attempts: nextAttempts, hintUsed: false, misconceptionIds: correct ? [] : [config.misconceptionId] }); }}>Check the classification →</OutcomeButton></div>;
}

function StepSequence({ block, onComplete }: Props) {
  const config = block.render as Extract<RenderConfig, { kind: "step-sequence" }>;
  const [chosen, setChosen] = useState<string[]>([]);
  const next = config.stages[chosen.length];
  return <div className={styles.actionContent}><span className={styles.actionEyebrow}>Build the process</span><h2>{block.title}</h2><p>{config.prompt}</p><div className={styles.sequenceChoices}>{config.stages.map((stage) => <button type="button" disabled={chosen.includes(stage.id)} key={stage.id} onClick={() => { if (stage.id === next?.id) setChosen((previous) => [...previous, stage.id]); }}>{chosen.indexOf(stage.id) >= 0 ? `${chosen.indexOf(stage.id) + 1}` : "·"}<span>{stage.label}</span></button>)}</div><OutcomeButton disabled={chosen.length < config.stages.length} onClick={() => onComplete({ blockId: block.id, result: "completed", attempts: 1, hintUsed: false, misconceptionIds: [] })}>Keep the sequence →</OutcomeButton></div>;
}

function EvidenceReveal({ block, onComplete }: Props) {
  const config = block.render as Extract<RenderConfig, { kind: "evidence-reveal" }>;
  const [revealed, setRevealed] = useState(false);
  return <div className={styles.actionContent}><span className={styles.actionEyebrow}>Evidence becomes a rule</span><h2>{block.title}</h2><p>{config.prompt}</p>{revealed ? <div className={styles.revealPanel}><span>{config.title}</span><strong>{config.statement}</strong><small>{config.example}</small></div> : <button type="button" className={styles.revealButton} onClick={() => setRevealed(true)}>Reveal from the evidence</button>}<OutcomeButton disabled={!revealed} onClick={() => onComplete({ blockId: block.id, result: "completed", attempts: 1, hintUsed: false, misconceptionIds: [] })}>Apply the rule →</OutcomeButton></div>;
}

function TargetChallenge({ block, onRuntime, onComplete }: Props) {
  const config = block.render as Extract<RenderConfig, { kind: "target-challenge" }>;
  const [choice, setChoice] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [wrong, setWrong] = useState(false);
  return <div className={styles.actionContent}><span className={styles.actionEyebrow}>{block.role === "transfer" ? "Transfer" : "Application"}</span><h2>{block.title}</h2><p>{config.prompt}</p><div className={styles.targetChoices}>{config.options.map((option) => <button className={choice === option.id ? styles.choiceSelected : ""} type="button" key={option.id} onClick={() => { setChoice(option.id); setWrong(false); const patch = config.scenePatchByOption?.[option.id]; if (patch) onRuntime(patch); }}>{option.label}</button>)}</div>{wrong ? <small className={styles.correction}>The live object changed, but it has not reached the target. Try another option.</small> : null}<OutcomeButton disabled={!choice} onClick={() => { if (!choice) return; const nextAttempts = attempts + 1; setAttempts(nextAttempts); const correct = choice === config.correctOptionId; if (!correct) { setWrong(true); return; } onComplete({ blockId: block.id, result: "correct", attempts: nextAttempts, hintUsed: false, misconceptionIds: [] }); }}>Test this choice →</OutcomeButton></div>;
}

export function PrimitiveRenderer(props: Props) {
  const component = useMemo(() => ({
    prediction: Prediction,
    "parameter-experiment": ParameterExperiment,
    comparison: Comparison,
    "data-plot": DataPlot,
    classification: Classification,
    "step-sequence": StepSequence,
    "evidence-reveal": EvidenceReveal,
    "target-challenge": TargetChallenge,
  }[props.block.primitiveId]), [props.block.primitiveId]);
  const Component = component;
  return <Component key={props.block.id} {...props} />;
}
