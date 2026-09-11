import Link from "next/link";
import styles from "../hub.module.css";
import { PageIntro, ProjectShell } from "@/src/projectHub/ProjectShell";
import { courseBuilderExpansion, decisions, openQuestions, parkedCapabilities } from "@/src/projectHub/data";

export default function FuturePage() {
  return <ProjectShell active="/future">
    <PageIntro eyebrow="Boundaries and next moves" title="Decided, unresolved, deliberately later."><p>A clear separation between settled architecture, active questions and parked ideas keeps the programme honest as it grows.</p></PageIntro>
    <section className={styles.futureGrid}>
      <article className={styles.panel}><h2>Decisions</h2><ul className={styles.cleanList}>{decisions.map((decision) => <li key={decision}>{decision}</li>)}</ul></article>
      <article className={styles.panel}><h2>Open questions</h2><ol className={styles.numberedList}>{openQuestions.map((question) => <li key={question}>{question}</li>)}</ol></article>
      <article className={styles.panel}><h2>Later course-builder expansion</h2><p>After the lesson builder, research system and autonomous interactive builder are mature, the same architecture may expand into complete learning structures.</p><div className={styles.tagList}>{courseBuilderExpansion.map((item) => <span key={item}>{item}</span>)}</div></article>
      <article className={styles.panel}><h2>Future / parked</h2><p>Recorded without pulling them into current scope.</p><div className={styles.tagList}>{parkedCapabilities.map((item) => <span key={item}>{item}</span>)}</div></article>
      <article className={styles.panel}><h2>Planned sequence</h2><p>P6.5 defines the experience. <Link className={styles.actionLink} href="/roadmap/prototype-7">P7 obtains knowledge</Link>. <Link className={styles.actionLink} href="/roadmap/prototype-8">P8 constructs missing interactive representations</Link>. Complete course construction comes later.</p></article>
    </section>
  </ProjectShell>;
}
