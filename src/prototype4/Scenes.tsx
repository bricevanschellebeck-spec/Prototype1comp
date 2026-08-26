"use client";

import type { ComponentType } from "react";
import styles from "./prototype4.module.css";

export type SceneProps = {
  runtime: Record<string, string | number>;
  active: boolean;
  compact?: boolean;
};

function CircuitScene({ runtime, active, compact }: SceneProps) {
  const voltage = Number(runtime.voltage ?? 9);
  const resistance = Number(runtime.resistance ?? 4);
  const current = voltage / resistance;
  const speed = Math.max(0.75, Math.min(4, 4.4 - current));
  return (
    <div className={`${styles.sceneCanvas} ${styles.circuitCanvas} ${compact ? styles.sceneCompact : ""}`}>
      <svg viewBox="0 0 760 380" role="img" aria-label={`Live circuit at ${voltage} volts, ${resistance} ohms and ${current.toFixed(2)} amperes`}>
        <path className={styles.wire} d="M120 78 H290" />
        <path className={styles.resistor} d="M290 78 l26 -28 34 56 34 -56 34 56 34 -56 26 28" />
        <path className={styles.wire} d="M478 78 H642 V298 H120 V78" />
        <path className={styles.batteryLong} d="M78 156 H162" />
        <path className={styles.batteryShort} d="M92 205 H148" />
        <circle className={styles.lampOuter} cx="526" cy="298" r="43" />
        <path className={styles.lampCore} d="M526 274 l24 24 -24 24 -24 -24z" />
        {active && Array.from({ length: 13 }).map((_, index) => (
          <circle key={index} className={styles.charge} r="4" style={{ animationDelay: `${index * -0.24}s`, animationDuration: `${speed}s` }}>
            <animateMotion dur={`${speed}s`} repeatCount="indefinite" path="M120 78 H290 L316 50 L350 106 L384 50 L418 106 L452 50 L478 78 H642 V298 H120 V78" />
          </circle>
        ))}
        <g className={styles.sceneLabel} transform="translate(28 104)"><text>VOLTAGE</text><text y="20">{voltage} V · fixed</text></g>
        <g className={styles.sceneLabel} transform="translate(330 134)"><text>RESISTANCE</text><text y="20">{resistance} Ω</text></g>
        <g className={styles.sceneLabel} transform="translate(210 264)"><text>CURRENT</text><text y="20">{current.toFixed(2)} A</text></g>
      </svg>
    </div>
  );
}

function Particle({ x, y, delay, reverse = false }: { x: number; y: number; delay: number; reverse?: boolean }) {
  return <circle className={`${styles.cellParticle} ${reverse ? styles.particleReverse : ""}`} cx={x} cy={y} r="8" style={{ animationDelay: `${delay}s` }} />;
}

function CellScene({ runtime, active, compact }: SceneProps) {
  const left = Number(runtime.leftParticles ?? 9);
  const right = Number(runtime.rightParticles ?? 3);
  const cellState = String(runtime.cellState ?? "balanced");
  const direction = left === right ? "balanced" : left > right ? "right" : "left";
  const cellRadius = cellState === "swelling" ? 74 : cellState === "shrinking" ? 48 : 61;
  return (
    <div className={`${styles.sceneCanvas} ${styles.cellCanvas} ${compact ? styles.sceneCompact : ""}`}>
      <svg viewBox="0 0 760 380" role="img" aria-label="Live cell membrane transport model">
        <rect className={styles.cellSpaceLeft} x="42" y="52" width="318" height="276" rx="4" />
        <rect className={styles.cellSpaceRight} x="400" y="52" width="318" height="276" rx="4" />
        <g className={styles.membrane}>
          <path d="M376 54 V326" />
          {Array.from({ length: 11 }).map((_, index) => <circle key={index} cx="376" cy={68 + index * 24} r="8" />)}
          {Array.from({ length: 11 }).map((_, index) => <circle key={index} cx="392" cy={68 + index * 24} r="8" />)}
        </g>
        {Array.from({ length: left }).map((_, index) => <Particle key={`l${index}`} x={88 + (index % 4) * 62} y={94 + Math.floor(index / 4) * 74} delay={index * -0.17} />)}
        {Array.from({ length: right }).map((_, index) => <Particle key={`r${index}`} x={470 + (index % 4) * 62} y={108 + Math.floor(index / 4) * 82} delay={index * -0.2} reverse />)}
        {active && direction !== "balanced" ? (
          <g className={styles.transportArrow} transform={direction === "right" ? "translate(0 0)" : "translate(768 0) scale(-1 1)"}>
            <path d="M300 190 H476" /><path d="m458 172 20 18 -20 18" />
          </g>
        ) : null}
        <circle className={`${styles.cellState} ${styles[`cellState${cellState[0]?.toUpperCase()}${cellState.slice(1)}`] ?? ""}`} cx="588" cy="240" r={cellRadius} />
        <g className={styles.sceneLabel} transform="translate(58 72)"><text>HIGHER CONCENTRATION</text><text y="20">{left} particles</text></g>
        <g className={styles.sceneLabel} transform="translate(526 72)"><text>LOWER CONCENTRATION</text><text y="20">{right} particles</text></g>
        <g className={styles.sceneLabel} transform="translate(330 336)"><text>SELECTIVE MEMBRANE</text></g>
      </svg>
    </div>
  );
}

export const sceneRegistry: Record<"circuit-loop-v1" | "cell-membrane-v1", ComponentType<SceneProps>> = {
  "circuit-loop-v1": CircuitScene,
  "cell-membrane-v1": CellScene,
};

export function PersistentScene({ sceneId, ...props }: SceneProps & { sceneId: keyof typeof sceneRegistry }) {
  const Scene = sceneRegistry[sceneId];
  return <Scene {...props} />;
}
