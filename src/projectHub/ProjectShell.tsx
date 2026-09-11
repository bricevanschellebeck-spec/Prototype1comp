import Link from "next/link";
import type { ReactNode } from "react";
import styles from "@/src/app/hub.module.css";

const navItems = [
  { href: "/hub", label: "Overview" },
  { href: "/blueprint/learning-experience", label: "Learning experience" },
  { href: "/blueprint/activities", label: "Activities" },
  { href: "/blueprint/display-explanation", label: "Display & explanation" },
  { href: "/blueprint/learner-understanding", label: "Learner understanding" },
  { href: "/blueprint/adaptation", label: "Adaptation" },
  { href: "/blueprint/reference", label: "Reference / textbook" },
  { href: "/blueprint/ai-builder", label: "AI builder" },
  { href: "/blueprint/future-systems", label: "Future systems" },
  { href: "/open-questions", label: "Open questions" },
  { href: "/decisions", label: "Decisions" },
  { href: "/roadmap", label: "Prototype history" },
];

export function ProjectShell({
  children,
  active,
}: {
  children: ReactNode;
  active: string;
}) {
  return (
    <div className={styles.site}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/hub" aria-label="Curiosity Lab Project Hub home">
          <span className={styles.brandGlyph} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            <strong>Curiosity Lab</strong>
            <small>Project hub · Course builder</small>
          </span>
        </Link>
        <span className={styles.scopeBadge}>Core builder only</span>
      </header>

      <div className={styles.frame}>
        <aside className={styles.sidebar} aria-label="Project hub navigation">
          <p className={styles.navLabel}>Explore the system</p>
          <nav>
            {navItems.map((item, index) => (
              <Link
                className={active === item.href ? styles.navActive : styles.navLink}
                href={item.href}
                key={item.href}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className={styles.sidebarNote}>
            <span>Blueprint status</span>
            <strong>Living</strong>
            <p>The target product is intentionally open to refinement. P6.5 is the current design focus.</p>
          </div>
        </aside>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <header className={styles.pageIntro}>
      <span className={styles.eyebrow}>{eyebrow}</span>
      <h1>{title}</h1>
      <div className={styles.introCopy}>{children}</div>
    </header>
  );
}

export function Status({ status, label }: { status: string; label: string }) {
  return (
    <span className={`${styles.status} ${styles[`status_${status}`]}`}>
      <i aria-hidden="true" /> {label}
    </span>
  );
}
