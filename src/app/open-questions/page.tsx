import styles from "../hub.module.css";
import { PageIntro, ProjectShell } from "@/src/projectHub/ProjectShell";
import { PlanningLog } from "@/src/projectHub/PlanningLog";
import { openQuestionSeeds } from "@/src/projectHub/blueprint";

export default function OpenQuestionsPage() {
  return <ProjectShell active="/open-questions">
    <PageIntro eyebrow="Living planning log" title="Questions that should remain open until evidence resolves them."><p>These questions cut across the learning canvas, evidence model, activity vocabulary and future construction layers. Edit the working draft as the design develops.</p></PageIntro>
    <section className={styles.section}><PlanningLog storageKey="curiosity-lab-open-questions" seeds={openQuestionSeeds} kind="question" /></section>
  </ProjectShell>;
}
