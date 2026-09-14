"use client";

import { useState } from "react";
import { getSourceDocument } from "./sources";
import { explorationRows, predictionModel } from "./learningRules";
import type { BlockOutcome, CompiledBlock, CompiledLessonManifest } from "./types";
import styles from "./prototype5.module.css";

type Props = { block: CompiledBlock; manifest: CompiledLessonManifest; selectedRowId: string; revealedRows: string[]; onRow: (id: string) => void; onReveal: (id: string) => void; onComplete: (outcome: BlockOutcome) => void };
const outcome = (block: CompiledBlock, result: BlockOutcome["result"], attempts = 1, hintUsed = false): BlockOutcome => ({
  blockId: block.id, result, attempts, hintUsed,
  misconceptionIds: result === "incorrect" ? block.possibleMisconceptionIds.slice(0, 1) : [],
});

export function P5Primitive({ block, manifest, selectedRowId, revealedRows, onRow, onReveal, onComplete }: Props) {
  const source = getSourceDocument(manifest.sourceDocumentId)!;
  const config = block.render;
  const table = source.tables.find((item) => "tableId" in config && item.id === config.tableId) ?? source.tables[0];
  const rows = table ? explorationRows(source, manifest, table.id) : [];
  const [choice, setChoice] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [hint, setHint] = useState(false);
  const [ordered, setOrdered] = useState<string[]>([]);
  const [visited, setVisited] = useState<string[]>([]);
  const [comparisonViewed, setComparisonViewed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const prediction = predictionModel(manifest, block);
  function finish(result: BlockOutcome["result"]) {
    if (submitted) return;
    setSubmitted(true);
    onComplete(outcome(block, result, 1, hint));
  }
  const heading = <><span>{block.role === "evidence" ? "TRY THIS FIRST" : "EXPLORE THE EVIDENCE"}</span><h2>{block.title}</h2></>;

  if (config.kind === "prediction" && prediction) return <div className={styles.actionContent}>
    {heading}<strong className={styles.objectQuestion}>{prediction.question}</strong>
    <div className={styles.choiceRow}>{[["increases","↑","Increases"],["decreases","↓","Decreases"],["stays-same","=","Stays the same"]].map(([id,symbol,label]) => <button aria-pressed={choice === id} className={choice === id ? styles.selected : ""} key={id} onClick={() => setChoice(id)}><b>{symbol}</b>{label}</button>)}</div>
    <p>Your prediction stays separate from the measurements. Test it next.</p>
    <button className={styles.primary} disabled={!choice || submitted} onClick={() => finish(choice === prediction.correct ? "correct" : "incorrect")}>Commit prediction →</button>
  </div>;

  if (config.kind === "parameter-experiment") return <div className={styles.actionContent}>
    {heading}<p>Select a recorded condition. Watch the measured result change.</p>
    <div className={styles.trialButtons}>{rows.map((row) => <button aria-pressed={selectedRowId === row.id} className={selectedRowId === row.id ? styles.selected : ""} key={row.id} onClick={() => { onRow(row.id); onReveal(row.id); setVisited((current) => current.includes(row.id) ? current : [...current, row.id]); }}>{row.values[config.inputColumnId]} {table.columns.find((column) => column.id === config.inputColumnId)?.unit}</button>)}</div>
    <p role="status">{visited.length < 2 ? "Try two different conditions." : "You have compared two conditions. What changed?"}</p>
    <button className={styles.primary} disabled={visited.length < 2 || submitted} onClick={() => finish("completed")}>Keep these observations →</button>
  </div>;

  if (config.kind === "comparison") {
    const comparisonRows = rows.filter((row) => config.rowIds.includes(row.id));
    return <div className={styles.actionContent}>{heading}<p>Switch between the observed trials and compare their measurements.</p>
      <div className={styles.compareRows}>{comparisonRows.map((row) => <button key={row.id} className={selectedRowId === row.id ? styles.selected : ""} onClick={() => { onRow(row.id); onReveal(row.id); setComparisonViewed(true); }}>{config.columnIds.map((id) => <span key={id}>{table.columns.find((column) => column.id === id)?.label}<b>{row.values[id]} {table.columns.find((column) => column.id === id)?.unit}</b></span>)}</button>)}</div>
      <button className={styles.primary} disabled={!comparisonViewed || submitted} onClick={() => finish("completed")}>Use this comparison →</button>
    </div>;
  }

  if (config.kind === "data-plot") return <div className={styles.actionContent}>
    {heading}<p>Select the observed trials to place their measurements on the graph.</p>
    <div className={styles.revealButtons}>{rows.map((row) => <button aria-pressed={revealedRows.includes(row.id)} className={revealedRows.includes(row.id) ? styles.selected : ""} key={row.id} onClick={() => { onRow(row.id); onReveal(row.id); }}>{row.values[config.xColumnId]} {table.columns.find((column) => column.id === config.xColumnId)?.unit}</button>)}</div>
    <p>{rows.filter((row) => revealedRows.includes(row.id)).length} / {rows.length} observed points. One trial stays reserved for your challenge.</p>
    <button className={styles.primary} disabled={!rows.every((row) => revealedRows.includes(row.id)) || submitted} onClick={() => finish("completed")}>Use the pattern →</button>
  </div>;

  if (config.kind === "evidence-reveal") return <div className={styles.actionContent}>
    {heading}<p>Connect your observations to the source.</p>
    {revealed ? <div className={styles.factReveal}>{config.factIds.map((id) => <strong key={id}>{manifest.facts.find((fact) => fact.id === id)?.statement}</strong>)}</div> : <button className={styles.revealAction} onClick={() => setRevealed(true)}>Show the explanation</button>}
    <button className={styles.primary} disabled={!revealed || submitted} onClick={() => finish("completed")}>Carry the idea forward →</button>
  </div>;

  if (config.kind === "target-challenge") {
    const held = table.rows.find((row) => row.id === config.heldOutRowId)!;
    const values = [...new Set(table.rows.map((row) => String(row.values[config.predictionColumnId])))];
    return <div className={styles.actionContent}>{heading}
      <p>Which measurement fits this reserved trial?</p>
      <div className={styles.heldOut}>{table.columns.filter((column) => column.id !== config.predictionColumnId).map((column) => <span key={column.id}>{column.label}<strong>{held.values[column.id]} {column.unit}</strong></span>)}</div>
      <div className={styles.choiceRow}>{values.map((value) => <button aria-pressed={choice === value} className={choice === value ? styles.selected : ""} key={value} onClick={() => setChoice(value)}>{value} {table.columns.find((column) => column.id === config.predictionColumnId)?.unit}</button>)}</div>
      <button onClick={() => setHint(true)}>Show a hint</button>
      {hint ? <p role="status">Compare the observed points. Does this condition suggest a larger or smaller measurement?</p> : null}
      <button className={styles.primary} disabled={!choice || submitted} onClick={() => finish(choice === String(held.values[config.predictionColumnId]) ? "correct" : "incorrect")}>Check this trial →</button>
    </div>;
  }

  if (config.kind === "step-sequence") {
    const items = [...config.relationshipIds].reverse();
    return <div className={styles.actionContent}>{heading}<p>Select the stages in order.</p>
      {items.map((id) => {
        const relation = manifest.relationships.find((item) => item.id === id)!;
        const names = [relation.fromConceptId, relation.toConceptId].map((key) => manifest.concepts.find((item) => item.id === key)?.name);
        return <button className={ordered.includes(id) ? styles.selected : ""} key={id} disabled={ordered.includes(id)} onClick={() => setOrdered((current) => [...current, id])}>{ordered.includes(id) ? ordered.indexOf(id) + 1 : "·"} {names.join(" → ")}</button>;
      })}
      <button onClick={() => setOrdered([])}>Reset order</button>
      <button className={styles.primary} disabled={ordered.length !== items.length || submitted} onClick={() => finish(ordered.every((id, index) => id === config.relationshipIds[index]) ? "correct" : "incorrect")}>Check the sequence →</button>
    </div>;
  }
  return <div className={styles.actionContent}><h2>Representation unavailable</h2><p>Return to the planner and select a supported interaction.</p></div>;
}
