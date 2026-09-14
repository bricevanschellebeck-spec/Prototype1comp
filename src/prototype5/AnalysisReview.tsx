"use client";

import { useMemo, useState } from "react";
import { buildApprovedSpec } from "./comparison";
import type { ApprovedLearningSpec, ComparisonGroup, SourceDocument } from "./types";
import styles from "./prototype5.module.css";

const sourceKinds = new Set(["concept", "fact", "relationship"]);
const statusLabels = { agreement: "Both models agree", "fast-only": "Needs your review", "quality-only": "Comparison draft", conflict: "Conflict" };

export function AnalysisReview({ source, groups, onApproved }: { source: SourceDocument; groups: ComparisonGroup[]; onApproved: (spec: ApprovedLearningSpec) => void }) {
  const [tab, setTab] = useState<"source" | "pedagogy">("source"); const [activeId, setActiveId] = useState(groups[0]?.id); const [selections, setSelections] = useState<Record<string, string | "reject">>({}); const [errors, setErrors] = useState<string[]>([]);
  const visible = useMemo(() => groups.filter((group) => tab === "source" ? sourceKinds.has(group.kind) : !sourceKinds.has(group.kind)), [groups, tab]);
  const active = visible.find((group) => group.id === activeId) ?? visible[0]; const resolved = Object.keys(selections).length;
  function finish() { if (resolved !== groups.length) { setErrors([`Resolve every item first: ${groups.length - resolved} remaining.`]); return; } const result = buildApprovedSpec(source.id, groups, selections); if (!result.spec) { setErrors(result.errors); return; } setErrors([]); onApproved(result.spec); }
  return <section className={`${styles.reviewLab} ${styles.stageSurface}`}>
    <header className={styles.labHeader}><div><span>SOURCE LABORATORY · QWEN 4B</span><h1>Resolve what enters the lesson.</h1></div><div className={styles.reviewProgress}><strong>{resolved} / {groups.length}</strong><span>items resolved by a human</span></div></header>
    <nav className={styles.reviewTabs}><button className={tab === "source" ? styles.activeTab : ""} onClick={() => setTab("source")}>Source-derived</button><button className={tab === "pedagogy" ? styles.activeTab : ""} onClick={() => setTab("pedagogy")}>Pedagogical proposals</button><i/><small>Only your approval admits an item.</small></nav>
    <div className={styles.reviewColumns}>
      <aside className={styles.sourcePane}><span>TRUSTED SOURCE</span>{source.sections.map((section) => <article key={section.id}><b>{section.heading}</b><p>{section.text}</p></article>)}{source.tables.map((table) => <table key={table.id}><tbody>{table.rows.map((row) => <tr key={row.id}>{table.columns.map((column) => <td key={column.id}>{row.values[column.id]} {column.unit}</td>)}</tr>)}</tbody></table>)}</aside>
      <main className={styles.itemsPane}>{visible.map((group) => <article className={`${styles.reviewItem} ${active?.id === group.id ? styles.reviewItemActive : ""}`} key={group.id} onClick={() => setActiveId(group.id)}><header><span>{group.kind}</span><b data-status={group.status}>{statusLabels[group.status]}</b></header>{group.candidates.map((candidate) => <button className={selections[group.id] === candidate.id ? styles.approvedChoice : ""} key={candidate.id} type="button" onClick={(event) => { event.stopPropagation(); setSelections((current) => ({ ...current, [group.id]: candidate.id })); setActiveId(group.id); }}><small>{candidate.modelId}</small><span>{candidate.label}</span><i>{selections[group.id] === candidate.id ? "APPROVED" : "APPROVE"}</i></button>)}<button className={selections[group.id] === "reject" ? styles.rejectedChoice : styles.rejectChoice} type="button" onClick={(event) => { event.stopPropagation(); setSelections((current) => ({ ...current, [group.id]: "reject" })); }}>Reject {group.candidates.length > 1 ? "both" : "item"}</button></article>)}</main>
      <aside className={styles.provenancePane}><span>PROVENANCE</span>{active ? <><h2>{active.candidates[0].label}</h2>{active.candidates[0].citations.length ? active.candidates[0].citations.map((citation, index) => citation.kind === "text" ? <blockquote key={index}>“{citation.quote}”<small>{citation.sectionId}</small></blockquote> : <div className={styles.tableCitation} key={index}><b>{citation.tableId}</b><span>Rows: {citation.rowIds.join(", ")}</span><span>Columns: {citation.columnIds.join(", ")}</span></div>) : <p>This is explicitly a pedagogical proposal. It must refer back to approved facts during compilation.</p>}</> : null}</aside>
    </div>
    <footer className={styles.reviewFooter}><div>{errors.map((error) => <span key={error}>{error}</span>)}</div><button type="button" onClick={finish}>Compile approved knowledge →</button></footer>
  </section>;
}
