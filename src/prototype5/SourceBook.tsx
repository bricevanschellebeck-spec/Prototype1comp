"use client";

import { useState } from "react";
import type { SourceDocument } from "./types";
import styles from "./prototype5.module.css";

export function SourceBook({ source, onStart }: { source: SourceDocument; onStart?: () => void }) {
  const [page, setPage] = useState<1 | 2>(1); const [direction, setDirection] = useState<"next" | "previous">("next"); const table = source.tables[0];
  function turn(nextPage: 1 | 2) { setDirection(nextPage > page ? "next" : "previous"); setPage(nextPage); }
  return <section className={`${styles.bookStage} ${styles.stageSurface}`} aria-label="Trusted source document">
    <div className={styles.bookPaper}>
      <header><span>TRUSTED SOURCE · {source.subject.toUpperCase()}</span><b>{page} / 2</b></header>
      {page === 1 ? <div key="source-page-1" className={`${styles.sourcePage} ${direction === "next" ? styles.pageTurnNext : styles.pageTurnPrevious}`}>
        <div className={styles.sourceLead}><span>REACTION RATES</span><h1>{source.title}</h1><p>{source.sections[0].text}</p></div>
        <figure className={styles.reactionFigure}><div className={styles.flask}><i/><b>HCl</b><span>Mg</span></div><div className={styles.gasTrail}>{[0,1,2,3,4,5].map((item) => <i key={item}/>)}</div><div className={styles.syringe}><b>30 mL</b><i/></div><figcaption>FIGURE 1 · Magnesium + hydrochloric acid → hydrogen</figcaption></figure>
        <aside className={styles.sourceMargin}><span>THE MEASURE</span><strong>Time to collect<br/>30 mL H₂</strong><p>The gas volume stays fixed. The measured time changes.</p></aside>
        <div className={styles.pageNote}><b>Particle explanation</b><p>{source.sections[1].text}</p></div>
      </div> : <div key="source-page-2" className={`${styles.sourcePageTwo} ${direction === "next" ? styles.pageTurnNext : styles.pageTurnPrevious}`}>
        <div><span>RECORDED EVIDENCE</span><h1>Four trusted trials</h1><p>{table.description}</p></div>
        <table><thead><tr>{table.columns.map((column) => <th key={column.id}>{column.label}<small>{column.unit}</small></th>)}</tr></thead><tbody>{table.rows.map((row) => <tr key={row.id}>{table.columns.map((column) => <td key={column.id}>{row.values[column.id]}</td>)}</tr>)}</tbody></table>
        <div className={styles.staticPattern}><span>CONCENTRATION</span><div>{table.rows.map((row, index) => <i key={row.id} style={{height: `${28 + index * 17}%`}}><b>{row.values.concentration}</b></i>)}</div><strong>more particles in the same volume →</strong></div>
        <blockquote>{source.sections[2].text}</blockquote>
      </div>}
      <footer><button type="button" disabled={page === 1} onClick={() => turn(1)}>← Previous</button><span>Bundled structured source · no web search · no generated media</span>{page === 1 ? <button type="button" onClick={() => turn(2)}>Read the data →</button> : onStart ? <button className={styles.compileButton} type="button" onClick={onStart}>Open source laboratory →</button> : <button type="button" onClick={() => turn(1)}>Return to page 1</button>}</footer>
    </div>
  </section>;
}
