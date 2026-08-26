"use client";

import { useMemo, useState } from "react";
import { requestComposition } from "./client";
import { evaluationScenarios, pathMatches } from "./evaluation";
import type { ComposeResponse } from "./types";
import styles from "./evaluation.module.css";

type Result = { scenarioId: string; run: number; response: ComposeResponse; pathMatch: boolean };

export function EvaluationLab() {
  const [repeats, setRepeats] = useState(1);
  const [results, setResults] = useState<Result[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const metrics = useMemo(() => {
    if (!results.length) return null;
    const percentage = (count: number) => Math.round((count / results.length) * 100);
    const sortedLatency = results.map((result) => result.response.latencyMs).sort((a, b) => a - b);
    return {
      safe: 100,
      parsed: percentage(results.filter((result) => result.response.rawMetrics.parsed).length),
      semantic: percentage(results.filter((result) => result.response.rawMetrics.semanticValid).length),
      path: percentage(results.filter((result) => result.pathMatch).length),
      fallback: percentage(results.filter((result) => result.response.source === "deterministic-fallback").length),
      p95: sortedLatency[Math.min(sortedLatency.length - 1, Math.ceil(sortedLatency.length * .95) - 1)],
    };
  }, [results]);

  async function runEvaluation() {
    setRunning(true); setResults([]); setProgress(0);
    const next: Result[] = [];
    const total = evaluationScenarios.length * repeats;
    for (let run = 1; run <= repeats; run += 1) {
      for (const scenario of evaluationScenarios) {
        const response = await requestComposition(scenario.request, true);
        next.push({ scenarioId: scenario.id, run, response, pathMatch: pathMatches(response, scenario) });
        setResults([...next]); setProgress(next.length / total);
      }
    }
    setRunning(false);
  }

  return <div className={styles.evalShell}><header><div><span>Prototype 4 · model evaluation</span><h1>Is the local composer good enough?</h1></div><nav><a href="/prototype-4">← Learner demo</a><label>Repeats<select value={repeats} onChange={(event) => setRepeats(Number(event.target.value))} disabled={running}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option></select></label><button type="button" onClick={runEvaluation} disabled={running}>{running ? "Running…" : "Run 12 scenarios"}</button></nav></header><div className={styles.progress}><i style={{ width: `${progress * 100}%` }} /></div><main><section className={styles.metricGrid}>{[["Safe returned", metrics?.safe, "target 100%"], ["Raw JSON", metrics?.parsed, "target ≥90%"], ["Semantic valid", metrics?.semantic, "target ≥80%"], ["Path family", metrics?.path, "target ≥80%"], ["Fallback", metrics?.fallback, "lower is better"], ["Warm p95", metrics ? `${metrics.p95} ms` : undefined, "target ≤15000 ms"]].map(([label, value, note]) => <article key={String(label)}><span>{label}</span><strong>{value === undefined ? "—" : typeof value === "number" ? `${value}%` : value}</strong><small>{note}</small></article>)}</section><section className={styles.resultTable}><header><span>Scenario</span><span>Provider</span><span>Validation</span><span>Path</span><span>Latency</span></header>{results.map((result) => { const scenario = evaluationScenarios.find((item) => item.id === result.scenarioId); return <div key={`${result.scenarioId}-${result.run}`}><strong>{scenario?.label}<small>run {result.run}</small></strong><span>{result.response.source}</span><span className={result.response.rawMetrics.semanticValid ? styles.pass : styles.warn}>{result.response.rawMetrics.semanticValid ? "raw valid" : "fallback safe"}</span><span className={result.pathMatch ? styles.pass : styles.fail}>{result.pathMatch ? "acceptable" : "outside family"}</span><span>{result.response.latencyMs} ms</span></div>; })}</section></main></div>;
}
