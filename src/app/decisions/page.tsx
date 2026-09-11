import styles from "../hub.module.css";
import { PageIntro, ProjectShell } from "@/src/projectHub/ProjectShell";
import { PlanningLog } from "@/src/projectHub/PlanningLog";
import { decisionSeeds } from "@/src/projectHub/blueprint";

export default function DecisionsPage() {
  return <ProjectShell active="/decisions">
    <PageIntro eyebrow="Living decision log" title="The design commitments shaping the learning engine."><p>Record settled choices here so individual systems can evolve without losing the architecture’s intent.</p></PageIntro>
    <section className={styles.section}><PlanningLog storageKey="curiosity-lab-decisions" seeds={decisionSeeds} kind="decision" canonicalVersion={2} /></section>
  </ProjectShell>;
}
