import type { WorkspaceMeasurement } from "./domain";
import styles from "./prototype3.module.css";

type CircuitProps = {
  voltage: number;
  resistance: number;
  current: number;
  active: boolean;
  compact?: boolean;
};

export function WorkspaceCircuit({ voltage, resistance, current, active, compact = false }: CircuitProps) {
  const chargeDuration = Math.max(0.7, Math.min(3.8, resistance / 3));
  const brightness = Math.max(0.25, Math.min(1, current / 3));
  return (
    <svg
      className={`${styles.workspaceCircuit} ${compact ? styles.workspaceCircuitCompact : ""}`}
      viewBox="0 0 820 390"
      role="img"
      aria-label={`Live circuit at ${voltage} volts and ${resistance} ohms, producing ${current.toFixed(2)} amps`}
    >
      <defs>
        <filter id="p3-lamp-glow"><feGaussianBlur stdDeviation="13" /></filter>
      </defs>
      <path className={styles.liveWire} d="M145 116H370m239 0h81v199H145V116" />
      <path className={styles.liveWire} d="M145 116v64m0 58v77" />
      <path className={styles.liveResistor} d="m370 116 26-27 29 54 30-54 30 54 30-54 30 54 64-27" />
      <line className={styles.liveBatteryLong} x1="99" y1="180" x2="190" y2="180" />
      <line className={styles.liveBatteryShort} x1="119" y1="238" x2="172" y2="238" />
      <circle className={styles.liveLampGlow} cx="580" cy="315" r="52" style={{ opacity: brightness }} filter="url(#p3-lamp-glow)" />
      <circle className={styles.liveLamp} cx="580" cy="315" r="39" />
      <path className={styles.liveFilament} d="m559 315 21-19 22 19-22 20z" />
      {active ? (
        <path
          className={styles.movingCharge}
          d="M173 116H360m259 0h71v199h-65M530 315H185v-65"
          style={{ animationDuration: `${chargeDuration}s` }}
        />
      ) : null}

      <g className={styles.attachedBatteryLabel}>
        <rect x="34" y="122" width="104" height="43" />
        <text x="49" y="140">VOLTAGE</text>
        <text x="49" y="158">{voltage} V · fixed</text>
      </g>
      <g className={styles.attachedResistorLabel}>
        <path d="M485 162v-29" />
        <rect x="417" y="163" width="137" height="46" />
        <text x="432" y="181">RESISTANCE</text>
        <text x="432" y="200">{resistance} Ω</text>
      </g>
      <g className={styles.attachedCurrentLabel}>
        <rect x="239" y="285" width="144" height="50" />
        <text x="254" y="304">CURRENT</text>
        <text x="254" y="326">{current.toFixed(2)} A</text>
      </g>
    </svg>
  );
}

export function MeasurementGraph({ measurements }: { measurements: WorkspaceMeasurement[] }) {
  const sorted = [...measurements].sort((a, b) => a.resistance - b.resistance);
  const points = sorted.map((measurement) => {
    const x = 44 + ((measurement.resistance - 2) / 10) * 250;
    const y = 148 - (measurement.current / 4.5) * 120;
    return { ...measurement, x, y };
  });
  return (
    <svg className={styles.liveGraph} viewBox="0 0 330 190" role="img" aria-label="Graph generated from the learner's circuit measurements">
      <path className={styles.liveGraphAxis} d="M44 18v130h263M44 148l-6-7m6 7-6 7M307 148l-7-6m7 6-7 7" />
      {points.length > 1 ? <polyline className={styles.liveGraphLine} points={points.map((point) => `${point.x},${point.y}`).join(" ")} /> : null}
      {points.map((point) => (
        <g key={point.resistance}>
          <circle cx={point.x} cy={point.y} r="6" />
          <text x={point.x - 9} y={point.y - 12}>{point.resistance}Ω</text>
        </g>
      ))}
      <text x="4" y="15">A</text>
      <text x="278" y="178">Ω</text>
    </svg>
  );
}

export function ComparisonPaths() {
  return (
    <div className={styles.comparisonPaths}>
      <div>
        <span>Same 9 V</span>
        <strong>3 Ω</strong>
        <i><b style={{ width: "92%" }} /></i>
        <small>3.00 A · faster charge flow</small>
      </div>
      <div>
        <span>Same 9 V</span>
        <strong>9 Ω</strong>
        <i><b style={{ width: "34%" }} /></i>
        <small>1.00 A · slower charge flow</small>
      </div>
    </div>
  );
}
