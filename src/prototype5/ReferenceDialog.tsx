"use client";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./prototype5.module.css";

export function ReferenceDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={ref} className={styles.referenceDialog} aria-label={title} onCancel={onClose}>
    <button className={styles.closeModal} onClick={onClose}>Close {title.toLowerCase()} ×</button>{children}
  </dialog>;
}
