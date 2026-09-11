"use client";

import { FormEvent, useEffect, useState } from "react";
import styles from "@/src/app/hub.module.css";

type LogItem = { id: string; text: string; seeded: boolean };

export function PlanningLog({ storageKey, seeds, kind, canonicalVersion = 1 }: { storageKey: string; seeds: string[]; kind: "question" | "decision"; canonicalVersion?: number }) {
  const [items, setItems] = useState<LogItem[]>(() => seeds.map((text, index) => ({ id: `seed-${index}`, text, seeded: true })));
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hydration = window.setTimeout(() => {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as LogItem[] | { version: number; items: LogItem[] };
          const storedItems = Array.isArray(parsed) ? parsed : parsed.items;
          const storedVersion = Array.isArray(parsed) ? 1 : parsed.version;
          if (storedVersion === canonicalVersion) {
            setItems(storedItems);
          } else {
            const customItems = storedItems.filter((item) => !item.seeded);
            setItems([...seeds.map((text, index) => ({ id: `seed-${index}`, text, seeded: true })), ...customItems]);
          }
        } catch { /* Keep canonical seeds. */ }
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(hydration);
  }, [canonicalVersion, seeds, storageKey]);

  useEffect(() => {
    if (ready) window.localStorage.setItem(storageKey, JSON.stringify({ version: canonicalVersion, items }));
  }, [canonicalVersion, items, ready, storageKey]);

  function addItem(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setItems((current) => [...current, { id: `draft-${Date.now()}`, text, seeded: false }]);
    setDraft("");
  }

  function updateItem(id: string, text: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, text } : item));
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function reset() {
    setItems(seeds.map((text, index) => ({ id: `seed-${index}`, text, seeded: true })));
  }

  return <div className={styles.logSurface}>
    <div className={styles.logNotice}><span>Editable planning draft</span><p>Changes are saved in this browser. Canonical seed items remain maintained in the project data.</p><button type="button" onClick={reset}>Reset to seed</button></div>
    <ol className={styles.logList}>
      {items.map((item, index) => <li key={item.id}>
        <span>{String(index + 1).padStart(2, "0")}</span>
        <textarea aria-label={`${kind} ${index + 1}`} value={item.text} onChange={(event) => updateItem(item.id, event.target.value)} rows={2} />
        <button type="button" aria-label={`Remove ${kind} ${index + 1}`} onClick={() => removeItem(item.id)}>Remove</button>
      </li>)}
    </ol>
    <form className={styles.logForm} onSubmit={addItem}>
      <label htmlFor={`${storageKey}-new`}>Add {kind}</label>
      <div><textarea id={`${storageKey}-new`} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={kind === "question" ? "What still needs to be resolved?" : "Record a settled product decision…"} rows={3} /><button type="submit">Add to log</button></div>
    </form>
  </div>;
}
