import styles from "../hub.module.css";
import { PageIntro, ProjectShell } from "@/src/projectHub/ProjectShell";

const architecture = [["Trusted sources", "Ground truth and provenance"], ["AI", "Learning design and composition"], ["Validators", "Guardrails and legal choices"], ["Components", "The interaction vocabulary"], ["Learner interactions", "Evidence of understanding"], ["Renderer / runtime", "Controlled execution"]];
const quotes = ["Objects are the explanation. Text supports them.", "A chatbot changes its answer. Curiosity Lab changes the way you learn.", "When possible, let the learner discover something by doing."];

export default function PrinciplesPage() {
  return <ProjectShell active="/principles">
    <PageIntro eyebrow="Design constitution" title="Freedom over learning design. Control over truth."><p>The system is intentionally neither a paragraph generator nor an unrestricted code generator. It composes learning experiences inside a trusted, inspectable architecture.</p></PageIntro>
    <section className={styles.threeCol}>{quotes.map((quote, index) => <article className={styles.quoteCard} key={quote}><span>Principle {String(index + 1).padStart(2, "0")}</span><blockquote>“{quote}”</blockquote></article>)}</section>
    <section className={styles.section}><div className={styles.sectionHead}><h2>Responsibility split</h2><p>AI receives meaningful design freedom, but it never becomes the authority for facts, calculations or executable code.</p></div><div className={styles.roadmapGrid}>{architecture.map(([title, text], index) => <article className={styles.detailCard} key={title}><span className={styles.eyebrow}>{String(index + 1).padStart(2, "0")}</span><h2>{title}</h2><p>{text}</p></article>)}</div></section>
    <section className={styles.section}><article className={`${styles.detailCard} ${styles.proofCard}`}><span>Operating rule</span><p>AI should have freedom over learning design while trusted sources, validators, deterministic code and controlled runtimes protect truth and execution.</p></article></section>
  </ProjectShell>;
}
