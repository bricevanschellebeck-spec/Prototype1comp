import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../../hub.module.css";
import { PageIntro, ProjectShell, Status } from "@/src/projectHub/ProjectShell";
import { getPrototype, prototypes } from "@/src/projectHub/data";

export function generateStaticParams() { return prototypes.map((prototype) => ({ slug: prototype.slug })); }

export default async function PrototypeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prototype = getPrototype(slug);
  if (!prototype) notFound();
  const index = prototypes.findIndex((item) => item.slug === slug);
  const previous = prototypes[index - 1];
  const next = prototypes[index + 1];

  return <ProjectShell active="/roadmap">
    <PageIntro eyebrow={`Prototype ${prototype.number}`} title={prototype.name}><Status status={prototype.status} label={prototype.statusLabel} /></PageIntro>
    <section className={styles.detailTop}>
      <article className={styles.detailCard}><span className={styles.eyebrow}>Main question</span><h2>{prototype.question}</h2><p>{prototype.purpose}</p>{prototype.demonstration && <p><strong>Demonstration:</strong> {prototype.demonstration}</p>}</article>
      <article className={`${styles.detailCard} ${styles.proofCard}`}><span>{prototype.status === "completed" ? "What it proved" : "Intended proof"}</span><p>{prototype.proof}</p></article>
    </section>
    <section className={styles.detailGrid}>
      <article className={styles.detailCard}><h2>Key capabilities introduced</h2><ul className={styles.cleanList}>{prototype.capabilities.map((item) => <li key={item}>{item}</li>)}</ul></article>
      {prototype.pipeline && <article className={styles.detailCard}><h2>Pipeline</h2><ol className={styles.numberedList}>{prototype.pipeline.map((item) => <li key={item}>{item}</li>)}</ol></article>}
      {prototype.sections?.map((section) => <article className={styles.detailCard} key={section.title}><h2>{section.title}</h2>{section.intro && <p>{section.intro}</p>}<ul className={styles.cleanList}>{section.items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}
      {prototype.distinction && <article className={`${styles.detailCard} ${styles.wide}`}><h2>Defining distinction</h2><div className={styles.compare}><div>{prototype.distinction.from}</div><span>→</span><div>{prototype.distinction.to}</div></div></article>}
      {prototype.limitation && <article className={`${styles.detailCard} ${styles.limitation} ${prototype.pipeline ? styles.wide : ""}`}><h2>{prototype.status === "completed" ? "Limitation that motivated the next step" : "Boundary"}</h2><p>{prototype.limitation}</p></article>}
    </section>
    {prototype.demoHref && <p><Link className={styles.actionLink} href={prototype.demoHref}>Open the working prototype</Link></p>}
    <nav className={styles.pager} aria-label="Prototype detail navigation"><span>{previous && <Link href={`/roadmap/${previous.slug}`}>← {previous.number} · {previous.name}</Link>}</span><span>{next && <Link href={`/roadmap/${next.slug}`}>{next.number} · {next.name} →</Link>}</span></nav>
  </ProjectShell>;
}
