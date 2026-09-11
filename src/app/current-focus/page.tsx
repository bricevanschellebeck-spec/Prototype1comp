import Link from "next/link";
import styles from "../hub.module.css";
import { PageIntro, ProjectShell, Status } from "@/src/projectHub/ProjectShell";
import { designLanguage } from "@/src/projectHub/data";

export default function CurrentFocusPage() {
  return <ProjectShell active="/current-focus">
    <PageIntro eyebrow="P6.5 · Current work" title="The learning-experience language."><Status status="current" label="Design and pedagogy refinement" /></PageIntro>
    <section className={styles.languageLead}>
      <div className={styles.centralQuestion}><span>Central question</span><blockquote>“What does the learner actually see, do, discover and understand?”</blockquote></div>
      <article className={styles.panel}><h2>Why P6.5 exists</h2><p>P6 proved that AI can design a lesson. Before giving it unlimited topics through P7, Curiosity Lab needs a stronger definition of what a good lesson is.</p><p>P6.5 defines the experience. It does not obtain missing knowledge or build missing representations.</p><p><Link className={styles.actionLink} href="/prototype-6-5">Open Prototype 6.5 →</Link></p></article>
    </section>
    <section className={styles.languageList} aria-label="P6.5 design language">
      {designLanguage.map((item, index) => <details className={styles.languageItem} key={item.id} open={index === 0}>
        <summary><span>{item.letter}</span><span><strong>{item.title}</strong><small>{item.summary}</small></span></summary>
        <div className={styles.languageBody}>{item.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{item.items.length > 0 && <ul className={styles.cleanList}>{item.items.map((listItem) => <li key={listItem}>{listItem}</li>)}</ul>}</div>
      </details>)}
    </section>
  </ProjectShell>;
}
