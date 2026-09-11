import Link from "next/link";
import styles from "../hub.module.css";
import { PageIntro, ProjectShell, Status } from "@/src/projectHub/ProjectShell";
import { prototypes } from "@/src/projectHub/data";

export default function RoadmapPage() {
  return <ProjectShell active="/roadmap">
    <PageIntro eyebrow="Prototype history" title="One system, becoming more autonomous."><p>Each prototype answers one architectural question, establishes a proof, and exposes the limitation that motivates the next step.</p></PageIntro>
    <section className={styles.roadmapGrid} aria-label="Course builder prototypes">
      {prototypes.map((prototype) => <Link className={styles.roadmapCard} data-number={prototype.number} href={`/roadmap/${prototype.slug}`} key={prototype.slug}>
        <Status status={prototype.status} label={prototype.statusLabel} />
        <h2>{prototype.number} · {prototype.name}</h2><p>{prototype.question}</p>
        <div className={styles.cardBottom}><span>{prototype.proof}</span><span>Open</span></div>
      </Link>)}
    </section>
  </ProjectShell>;
}
