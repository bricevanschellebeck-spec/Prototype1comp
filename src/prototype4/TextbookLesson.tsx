"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComposeResponse, LessonManifest } from "./types";
import { PersistentScene } from "./Scenes";
import styles from "./prototype4.module.css";

type Props = {
  manifest: LessonManifest;
  composition: ComposeResponse | null;
  composing?: boolean;
  modal?: boolean;
  onBuild?: () => void;
  onClose?: () => void;
};

export function TextbookLesson({ manifest, composition, composing, modal, onBuild, onClose }: Props) {
  const [page, setPage] = useState<1 | 2>(1);
  const blocks = useMemo(() => manifest.sourceBlocks.filter((block) => block.page === page).sort((a, b) => a.order - b.order), [manifest, page]);
  const figure = blocks.find((block) => block.kind === "figure");
  const definitions = blocks.filter((block) => block.kind === "definition");
  const remaining = blocks.filter((block) => block !== figure && !definitions.includes(block));

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") setPage(2);
      if (event.key === "ArrowLeft") setPage(1);
      if (event.key === "Escape" && modal) onClose?.();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal, onClose]);

  return (
    <section className={`${styles.textbookFrame} ${modal ? styles.textbookModal : ""}`} aria-label="Trusted textbook lesson">
      {modal ? <button className={styles.modalClose} type="button" onClick={onClose} aria-label="Close textbook">×</button> : null}
      <article className={styles.paperPage} key={`${manifest.id}-${page}`}>
        <header className={styles.paperHeader}>
          <div><span>{manifest.subject} · trusted source</span><h1>{page === 1 ? manifest.title : "Using the relationship"}</h1><p>{page === 1 ? manifest.subtitle : "The same knowledge, fixed in one arrangement."}</p></div>
          <b>PAGE {page} / 2</b>
        </header>
        <div className={styles.paperBody}>
          {figure ? <figure className={styles.paperFigure}><PersistentScene sceneId={manifest.sceneId} runtime={manifest.initialRuntime} active={false} compact /><figcaption>FIGURE 01 · {figure.title} — {figure.body}</figcaption></figure> : null}
          {definitions.length ? <aside className={styles.paperDefinitions}>{definitions.map((block) => <div key={block.id}><span>{block.title}</span><p>{block.body}</p></div>)}</aside> : null}
          <section className={styles.paperKnowledge}>{remaining.map((block) => <article className={styles[`paperKind${block.kind[0].toUpperCase()}${block.kind.slice(1)}`] ?? ""} key={block.id}><span>{block.kind}</span><h2>{block.title}</h2><p>{block.body}</p></article>)}</section>
        </div>
        <footer className={styles.paperFooter}>
          <button type="button" disabled={page === 1} onClick={() => setPage(1)}>← Previous</button>
          <div><span>Curiosity Lab · fixed knowledge page</span>{page === 2 && !modal ? <small>{composing ? "The local composer is arranging approved interactions…" : composition ? `${composition.source === "ollama" ? "Local AI" : "Safe fallback"} blueprint ready` : "Preparing the composer…"}</small> : null}</div>
          {page === 1 ? <button type="button" onClick={() => setPage(2)}>Next page →</button> : modal ? <button type="button" onClick={onClose}>Return to workspace →</button> : <button className={styles.buildPathButton} type="button" onClick={onBuild}>Build my interactive path →</button>}
        </footer>
      </article>
    </section>
  );
}
