"use client";

import { getSourceDocument } from "./sources";
import type { CompiledLessonManifest } from "./types";
import styles from "./prototype5.module.css";

export function DataScene({ manifest, selectedRowId, revealedRows }: { manifest: CompiledLessonManifest; selectedRowId: string; revealedRows: string[] }) {
  const source = getSourceDocument(manifest.sourceDocumentId)!; const table = source.tables[0]; const selected = table.rows.find((row) => row.id === selectedRowId) ?? table.rows[0]; const x = table.columns[0]; const y = table.columns[1];
  const xValues = table.rows.map((row) => Number(row.values[x.id])); const yValues = table.rows.map((row) => Number(row.values[y.id])); const minX = Math.min(...xValues); const maxX = Math.max(...xValues); const minY = Math.min(...yValues); const maxY = Math.max(...yValues);
  return <section className={styles.dataScene}><header><span>PERSISTENT TRUSTED DATA SCENE</span><strong>One experimental condition remains visible while representations attach.</strong></header><div className={styles.sceneBody}>
    <div className={styles.liveExperiment}><div className={styles.beaker}><i/><span>{selected.values[x.id]} {x.unit}</span><b>HCl</b></div><div className={styles.bubbles}>{[0,1,2,3,4,5,6].map((item) => <i key={item} style={{animationDuration: `${1.7 - Number(selected.values[x.id]) * .28}s`}}/>)}</div><div className={styles.collector}><span>30 mL H₂</span><strong>{selected.values[y.id]} {y.unit}</strong></div></div>
    <div className={styles.generatedPlot}><div className={styles.plotGrid}/>{table.rows.map((row) => { const visible = revealedRows.includes(row.id); const left = 10 + ((Number(row.values[x.id]) - minX) / Math.max(.1, maxX - minX)) * 78; const bottom = 10 + ((Number(row.values[y.id]) - minY) / Math.max(.1, maxY - minY)) * 72; return <i className={visible ? styles.pointVisible : ""} key={row.id} style={{left: `${left}%`, bottom: `${bottom}%`}}><b>{visible ? row.values[y.id] : "?"}</b></i>; })}<span className={styles.xAxis}>{x.label} →</span><span className={styles.yAxis}>{y.label}</span></div>
  </div><footer><span>Values come only from {table.id}</span><i/><span>No interpolation</span><i/><span>No invented law</span></footer></section>;
}
