import Link from "next/link";
import styles from "../hub.module.css";
import { ProjectShell, PageIntro } from "@/src/projectHub/ProjectShell";
import { blueprintPrinciples, capabilityStatus, notTheProduct, targetDescription, targetLoop, targetLoopConnections } from "@/src/projectHub/blueprint";
import { SystemStatusBadge } from "@/src/projectHub/BlueprintView";

export default function ProjectHubHome() {
  return (
    <ProjectShell active="/hub">
      <PageIntro eyebrow="Product blueprint · Living source of truth" title="Course Builder — Target Learning System">
        <p>From trusted knowledge to a learning experience built around the concept and the learner.</p>
      </PageIntro>
      <section className={styles.targetHero}>
        <div><span className={styles.eyebrow}>The product in one statement</span><h2>{targetDescription}</h2></div>
        <aside><span>It is not primarily</span><ul>{notTheProduct.map((item) => <li key={item}>{item}</li>)}</ul></aside>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}><h2>The complete target loop</h2><p>These are connected systems, not independent features. Every interaction creates the evidence that determines what happens next.</p></div>
        <div className={styles.targetLoop}>
          <ol>{targetLoop.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step}</strong></li>)}</ol>
          <div>{targetLoopConnections.map((connection) => <p key={connection}>{connection}</p>)}</div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}><h2>System status</h2><Link className={styles.actionLink} href="/roadmap">See prototype evidence</Link></div>
        <div className={styles.capabilityGrid}>
          {capabilityStatus.map((item) => <article key={item.name}><SystemStatusBadge status={item.status} label={item.label} /><h3>{item.name}</h3></article>)}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}><h2>North-star principles</h2><p>The design vocabulary may evolve; these ideas set its direction.</p></div>
        <div className={styles.principleGrid}>{blueprintPrinciples.map((principle, index) => <article className={styles.principle} key={principle}><span>{String(index + 1).padStart(2, "0")}</span><p>{principle}</p></article>)}</div>
      </section>
    </ProjectShell>
  );
}
