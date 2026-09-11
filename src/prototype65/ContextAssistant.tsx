"use client";

import { useEffect, useRef } from "react";
import type { GoldLesson, P65Activity } from "./types";
import styles from "./prototype65.module.css";

export function ContextAssistant({ lesson, activity, message, branchOpen, onConfused, onWhy, onAlternate, onBranch, onCloseBranch }: { lesson: GoldLesson; activity?: P65Activity; message: string; branchOpen: boolean; onConfused: () => void; onWhy: () => void; onAlternate: () => void; onBranch: () => void; onCloseBranch: () => void }) {
  const branch = lesson.sideBranches[0];
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!branchOpen) return;
    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onCloseBranch(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [branchOpen, onCloseBranch]);
  return <>
    <div className={styles.contextBar}><span><i/>Need a different way in?</span><div><button onClick={onConfused}>I don’t understand</button><button onClick={onWhy}>Why?</button><button onClick={onAlternate}>Show another way</button><button onClick={onBranch}>{branch.label}</button></div>{message ? <p>{message}</p> : <small>{activity ? `Help is attached to ${activity.title}.` : "Help stays connected to the scene."}</small>}</div>
    {branchOpen ? <div className={styles.sideBranch} role="dialog" aria-modal="true" aria-label={branch.question}><header><div><small>SIDE PATH · RETURN POINT SAVED</small><strong>{branch.question}</strong></div><button ref={closeRef} onClick={onCloseBranch} aria-label="Close side path">×</button></header><div><p>{branch.answer}</p><span>The main {activity?.title || "lesson"} activity is still waiting underneath.</span><button onClick={onCloseBranch}>Return to the main path →</button></div></div> : null}
  </>;
}
