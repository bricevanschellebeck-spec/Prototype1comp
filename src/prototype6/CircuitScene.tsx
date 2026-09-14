"use client";

import { deriveValue, valueById } from "./knowledge";
import styles from "./prototype6.module.css";

export type CircuitState = { voltageId: string; resistanceId: string };

export function CircuitScene({ state, compact = false, highlight = [] }: { state: CircuitState; compact?: boolean; highlight?: string[] }) {
  const voltage = valueById(state.voltageId)?.value ?? 9;
  const resistance = valueById(state.resistanceId)?.value ?? 4;
  const current = deriveValue("ohms-law-current", [state.voltageId, state.resistanceId]) ?? voltage / resistance;
  const duration = Math.max(0.75, Math.min(4, 3.4 / Math.max(current, .5)));
  return <div className={`${styles.circuitScene} ${compact ? styles.circuitCompact : ""}`}>
    <svg viewBox="0 0 880 410" role="img" aria-label={`Closed circuit with ${voltage} volts, ${resistance} ohms, and ${Number(current.toFixed(2))} amperes`}>
      <defs><filter id="p6-glow"><feGaussianBlur stdDeviation="12"/></filter></defs>
      <path className={styles.wire} d="M155 82 H330 L365 38 405 132 450 38 495 132 540 38 585 82 H730 V315 H155 V82"/>
      <path className={styles.chargePath} style={{ animationDuration: `${duration}s` }} pathLength="1" d="M155 82 H330 L365 38 405 132 450 38 495 132 540 38 585 82 H730 V315 H155 V82"/>
      <path className={styles.resistor} d="M330 82 L365 38 405 132 450 38 495 132 540 38 585 82"/>
      <path className={styles.batteryPlate} d="M115 180 H205 M130 238 H190"/>
      <circle className={styles.lampGlow} cx="610" cy="315" r="64" filter="url(#p6-glow)"/>
      <circle className={styles.lamp} cx="610" cy="315" r="49"/><path className={styles.lampCore} d="M610 280 646 315 610 350 574 315Z"/>
    </svg>
    <div className={`${styles.sceneLabel} ${styles.voltageLabel} ${highlight.includes("concept-voltage") ? styles.highlight : ""}`}><small>Voltage</small><strong>{voltage} V · fixed</strong></div>
    <div className={`${styles.sceneLabel} ${styles.resistanceLabel} ${highlight.includes("concept-resistance") ? styles.highlight : ""}`}><small>Resistance</small><strong>{resistance} Ω</strong></div>
    <div className={`${styles.sceneLabel} ${styles.currentLabel} ${highlight.includes("concept-current") ? styles.highlight : ""}`}><small>Current</small><strong>{Number(current.toFixed(2))} A</strong></div>
  </div>;
}

export function SourceCircuit() {
  return <svg className={styles.sourceCircuit} viewBox="0 0 700 300" role="img" aria-label="A closed circuit containing a battery, resistor, and lamp">
    <path d="M105 75 H255 L285 42 318 110 355 42 392 110 430 42 462 75 H590 V225 H105 V75"/><path className={styles.sourceResistor} d="M255 75 L285 42 318 110 355 42 392 110 430 42 462 75"/>
    <path className={styles.sourceBattery} d="M72 125 H140 M82 172 H130"/><circle cx="490" cy="225" r="35"/><path className={styles.sourceLamp} d="M490 202 514 225 490 248 466 225Z"/>
    <text x="75" y="113">9 V battery</text><text x="325" y="142">resistor</text><text x="470" y="282">lamp</text><text x="165" y="250">closed path</text>
  </svg>;
}
