"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./prototype6.module.css";

export function P6Dialog({ open, title, onClose, children, wide = false }: { open: boolean; title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const root = closeRef.current?.closest('[role="dialog"]');
        const focusable = [...(root?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])') || [])];
        if (!focusable.length) return;
        const first = focusable[0]; const last = focusable.at(-1)!;
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", escape);
    return () => { window.removeEventListener("keydown", escape); previous?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  return <div className={styles.dialogBackdrop} onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-label={title} className={`${styles.dialog} ${wide ? styles.dialogWide : ""}`}>
      <header><span>{title}</span><button ref={closeRef} aria-label={`Close ${title}`} onClick={onClose}>×</button></header>
      <div className={styles.dialogBody}>{children}</div>
    </section>
  </div>;
}
