"use client";

import { getSourceDocument } from "./sources";
import { explorationRows } from "./learningRules";
import type { CompiledBlock, CompiledLessonManifest } from "./types";
import styles from "./prototype5.module.css";

export function DataScene({ manifest, activeBlock, selectedRowId, revealedRows, conceal }: {
  manifest: CompiledLessonManifest; activeBlock?: CompiledBlock; selectedRowId: string; revealedRows: string[]; conceal: boolean;
}) {
  const source = getSourceDocument(manifest.sourceDocumentId)!;
  const config = activeBlock?.render;
  const table = source.tables.find((item) => config && "tableId" in config && item.id === config.tableId) ?? source.tables[0];
  if (!table) return <section className={styles.dataScene}><header><strong>{source.title}</strong></header><p>Explore the approved relationships using the attached activity.</p></section>;
  const rows = explorationRows(source, manifest, table.id);
  const selected = rows.find((row) => row.id === selectedRowId) ?? rows[0];
  const xId = config?.kind === "parameter-experiment" ? config.inputColumnId : config?.kind === "data-plot" ? config.xColumnId : table.columns[0].id;
  const yId = config?.kind === "parameter-experiment" ? config.outputColumnId : config?.kind === "data-plot" ? config.yColumnId : table.columns[1].id;
  const x = table.columns.find((column) => column.id === xId)!;
  const y = table.columns.find((column) => column.id === yId)!;
  const visible = !conceal && selected && revealedRows.includes(selected.id);
  const maxX = Math.max(1, ...rows.map((row) => Number(row.values[x.id])));
  const maxY = Math.max(1, ...rows.map((row) => Number(row.values[y.id])));
  const plot = !conceal && (config?.kind === "data-plot" || revealedRows.length >= 2);
  return <section className={styles.dataScene}>
    <header><span>{conceal ? "PREDICT BEFORE TESTING" : "RECORDED EXPERIMENT"}</span><strong>{conceal ? "The measurements are covered until you commit." : table.title}</strong></header>
    <div className={styles.sceneBody}>
      <div className={styles.liveExperiment}>
        <div className={styles.conditionDisplay}><span>{x.label}</span><strong>{selected?.values[x.id]} <small>{x.unit}</small></strong><div className={styles.conditionParticles} aria-hidden="true">{Array.from({ length: selected ? 4 * (rows.indexOf(selected) + 1) : 4 }, (_, index) => <i key={index}/>)}</div><small>Selected recorded condition</small></div>
        <div className={styles.collector}><span>{y.label}</span><strong aria-live="polite">{visible ? selected.values[y.id] : "—"} <small>{y.unit}</small></strong></div>
      </div>
      <div className={styles.generatedPlot}>
        {plot ? <svg viewBox="0 0 360 300" role="img" aria-label={`${y.label} against ${x.label}; observed trials only`}>
          {[0, .5, 1].map((fraction) => <g key={fraction}><line x1="45" x2="330" y1={250 - fraction * 210} y2={250 - fraction * 210} stroke="#42685d"/><text x="36" y={254 - fraction * 210} textAnchor="end" fill="#dce9e2" fontSize="13">{Math.round(maxY * fraction)}</text><text x={45 + fraction * 285} y="275" textAnchor="middle" fill="#dce9e2" fontSize="13">{(maxX * fraction).toFixed(2)}</text></g>)}
          {rows.filter((row) => revealedRows.includes(row.id)).map((row) => <g key={row.id}><circle cx={45 + Number(row.values[x.id]) / maxX * 285} cy={250 - Number(row.values[y.id]) / maxY * 210} r="6" fill="#c7f64a"/><title>{row.values[x.id]} {x.unit}: {row.values[y.id]} {y.unit}</title></g>)}
        </svg> : <div className={styles.plotWaiting}><span>{conceal ? "Your prediction comes first." : "Your observations build the graph."}</span></div>}
        <span className={styles.xAxis}>{x.label} ({x.unit}) →</span><span className={styles.yAxis}>{y.label} ({y.unit})</span>
      </div>
    </div>
    <footer><span>Measured values only · reserved trial hidden from experiments</span></footer>
  </section>;
}
