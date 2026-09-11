import styles from "@/src/app/hub.module.css";
import type { BlueprintPage, BlueprintSystem, SystemStatus } from "./blueprint";
import { PageIntro, ProjectShell } from "./ProjectShell";

const statusNames: Record<SystemStatus, string> = {
  exists: "Exists / proven",
  current: "Current design work",
  planned: "Planned",
  later: "Later / vision",
};

export function SystemStatusBadge({ status, label }: { status: SystemStatus; label?: string }) {
  return <span className={`${styles.systemStatus} ${styles[`systemStatus_${status}`]}`}><i />{label ?? statusNames[status]}</span>;
}

function SystemCard({ system, index }: { system: BlueprintSystem; index: number }) {
  return <details className={styles.systemCard} open={index === 0}>
    <summary>
      <span className={styles.systemNumber}>{system.number}</span>
      <span className={styles.systemTitle}><strong>{system.title}</strong><small>{system.purpose}</small></span>
      <SystemStatusBadge status={system.status} label={system.statusLabel} />
    </summary>
    <div className={styles.systemBody}>
      <div className={styles.systemMeta}>
        <div><span>Purpose</span><p>{system.purpose}</p></div>
        <div><span>Related prototype</span><p>{system.prototype}</p></div>
      </div>
      <div className={styles.systemColumns}>
        <section><h3>Target behaviour</h3><ul>{system.target.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <section><h3>Key principles</h3><ul>{system.principles.map((item) => <li key={item}>{item}</li>)}</ul></section>
      </div>
      {system.flow && <section className={styles.inlineFlow}><h3>System flow</h3><ol>{system.flow.map((step) => <li key={step}>{step}</li>)}</ol></section>}
      {system.strategies && <section className={styles.strategyArea}>
        <h3>Purpose strategies</h3>
        <div className={styles.strategyGrid}>{system.strategies.map((strategy) => <article key={strategy.title}>
          <strong>{strategy.title}</strong>
          <div><span>Starting assumption</span><p>{strategy.assumption}</p></div>
          <div><span>Design behaviour</span><ul>{strategy.behaviours.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </article>)}</div>
      </section>}
      {system.examples && <section className={styles.exampleArea}>
        <h3>Examples and modes</h3>
        <div className={styles.exampleGrid}>{system.examples.map((group) => <article key={group.label}><strong>{group.label}</strong><ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div>
      </section>}
      <section className={styles.systemQuestions}><h3>Open questions</h3><ul>{system.questions.map((item) => <li key={item}>{item}</li>)}</ul></section>
    </div>
  </details>;
}

export function BlueprintView({ page }: { page: BlueprintPage }) {
  return <ProjectShell active={`/blueprint/${page.slug}`}>
    <PageIntro eyebrow={page.eyebrow} title={page.title}><p>{page.intro}</p></PageIntro>
    <div className={styles.systemIndex}>
      <span>{String(page.systems.length).padStart(2, "0")} systems</span>
      <p>Select a system to inspect its target, status, prototype responsibility and open questions.</p>
    </div>
    <section className={styles.systemList}>{page.systems.map((system, index) => <SystemCard system={system} index={index} key={system.id} />)}</section>
  </ProjectShell>;
}
