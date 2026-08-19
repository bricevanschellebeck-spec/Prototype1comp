"use client";

import { useMemo, useState } from "react";
import type { LearningBlock } from "@/src/domain/contracts";

type Props = {
  block: LearningBlock;
  onInteraction?: () => void;
};

type Prediction = "increase" | "decrease" | "same";

export function CircuitSimulationBlock({ block, onInteraction }: Props) {
  if (block.content.kind !== "simulation") return null;

  return (
    <CircuitSimulationContent
      block={block}
      content={block.content}
      onInteraction={onInteraction}
    />
  );
}

function CircuitSimulationContent({
  block,
  content,
  onInteraction,
}: Props & {
  content: Extract<LearningBlock["content"], { kind: "simulation" }>;
}) {
  const {
    fixedVoltage,
    resistanceRange,
    initialResistance,
    heading,
    instructions,
  } = content;
  const [resistance, setResistance] = useState(initialResistance);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const current = useMemo(
    () => Number((fixedVoltage / resistance).toFixed(2)),
    [fixedVoltage, resistance],
  );
  const initialCurrent = Number((fixedVoltage / initialResistance).toFixed(2));
  const glow = Math.max(0.18, Math.min(1, current / 3));
  const flowDuration = `${Math.max(0.55, Math.min(2.8, 2.7 - current * 0.45))}s`;
  const predictionCorrect = prediction === "decrease";
  const guidanceStage = hasInteracted
    ? "observe"
    : prediction
      ? "test"
      : "predict";

  const graph = useMemo(() => {
    const [minimum, maximum] = resistanceRange;
    const values = Array.from({ length: 16 }, (_, index) => {
      const graphResistance = minimum + ((maximum - minimum) * index) / 15;
      return {
        resistance: graphResistance,
        current: fixedVoltage / graphResistance,
      };
    });
    const maximumCurrent = fixedVoltage / minimum;
    const points = values
      .map(({ resistance: graphResistance, current: graphCurrent }) => {
        const x = 17 + ((graphResistance - minimum) / (maximum - minimum)) * 166;
        const y = 92 - (graphCurrent / maximumCurrent) * 72;
        return `${x},${y}`;
      })
      .join(" ");
    return {
      points,
      activeX: 17 + ((resistance - minimum) / (maximum - minimum)) * 166,
      activeY: 92 - (current / maximumCurrent) * 72,
    };
  }, [current, fixedVoltage, resistance, resistanceRange]);

  function changeResistance(nextResistance: number) {
    const constrained = Math.min(
      resistanceRange[1],
      Math.max(resistanceRange[0], nextResistance),
    );
    setResistance(constrained);
    if (!hasInteracted) {
      setHasInteracted(true);
      onInteraction?.();
    }
  }

  return (
    <article className="learning-block simulation-block canvas-simulation-block">
      <h3 className="sr-only">{heading}</h3>
      <p className="sr-only">{instructions}</p>

      <div className={`resistance-learning-canvas guidance-${guidanceStage}`}>
        <div className="canvas-mode-label">
          <span className="live-dot" aria-hidden="true" />
          Live circuit · voltage fixed
        </div>

        <section className="prediction-object" aria-label="Prediction before experiment">
          <span><i aria-hidden="true" /> Start here</span>
          <strong>Resistance goes up. Current…</strong>
          <div>
            <button
              type="button"
              className={prediction === "increase" ? "selected" : ""}
              onClick={() => setPrediction("increase")}
              aria-label="Predict current increases"
            >
              ↑ <small>increases</small>
            </button>
            <button
              type="button"
              className={prediction === "decrease" ? "selected" : ""}
              onClick={() => setPrediction("decrease")}
              aria-label="Predict current decreases"
            >
              ↓ <small>decreases</small>
            </button>
            <button
              type="button"
              className={prediction === "same" ? "selected" : ""}
              onClick={() => setPrediction("same")}
              aria-label="Predict current stays the same"
            >
              = <small>same</small>
            </button>
          </div>
        </section>

        <div className="circuit-object">
          <svg viewBox="0 0 720 360" role="img" aria-label="Interactive resistor circuit">
            <path
              className="wire"
              style={{ animationDuration: flowDuration }}
              d="M125 86 H282 M438 86 H598 V278 H125 V86"
            />
            <line className="battery-long" x1="100" y1="139" x2="150" y2="139" />
            <line className="battery-short" x1="111" y1="178" x2="139" y2="178" />
            <path
              className="wire"
              style={{ animationDuration: flowDuration }}
              d="M125 86 V139 M125 178 V278"
            />
            <path
              className="resistor interactive-resistor"
              d="M282 86 l19 -25 l24 50 l24 -50 l24 50 l24 -50 l41 25"
            />
            <circle
              className="bulb-glow"
              cx="500"
              cy="278"
              r="33"
              style={{ opacity: glow }}
            />
            <circle className="bulb" cx="500" cy="278" r="20" />
            <path className="bulb-filament" d="M489 278 l11 -9 l11 9 l-11 9 z" />
            <path className="current-arrow" style={{ animationDuration: flowDuration }} d="M232 278 h95" />
            <path className="arrow-head" d="M327 278 l-16 -10 v20 z" />
          </svg>

          <div
            className="voltage-object has-object-tooltip"
            data-tooltip="Voltage stays fixed throughout this experiment."
            tabIndex={0}
          >
            <span>Fixed source</span>
            <strong>{fixedVoltage} V</strong>
          </div>

          <div
            className={`attached-resistance-control has-object-tooltip${prediction ? " unlocked" : ""}`}
            data-tooltip="Resistance makes it harder for charge to move through the circuit."
          >
            <span>Resistor</span>
            <div className="resistance-stepper">
              <button
                type="button"
                disabled={!prediction || resistance <= resistanceRange[0]}
                onClick={() => changeResistance(resistance - 1)}
                aria-label="Decrease resistance"
              >
                −
              </button>
              <strong>{resistance} Ω</strong>
              <button
                type="button"
                disabled={!prediction || resistance >= resistanceRange[1]}
                onClick={() => changeResistance(resistance + 1)}
                aria-label="Increase resistance"
              >
                +
              </button>
            </div>
            <input
              id={`${block.id}-resistance`}
              className="range-input attached-range"
              type="range"
              aria-label="Resistance"
              min={resistanceRange[0]}
              max={resistanceRange[1]}
              value={resistance}
              disabled={prediction === null}
              onInput={(event) => changeResistance(Number(event.currentTarget.value))}
            />
          </div>

          <div
            className="current-object has-object-tooltip"
            data-tooltip="Current measures how much electric charge is flowing."
            tabIndex={0}
            aria-live="polite"
          >
            <span>Current</span>
            <strong>{current} A</strong>
            <small style={{ animationDuration: flowDuration }}>charge flow</small>
          </div>
        </div>

        <div className={`test-cue${prediction ? " visible" : ""}`}>
          <span>Now test it</span>
          <strong>{prediction ? `Increase to ${initialResistance * 2} Ω` : "Choose a prediction"}</strong>
          <small>{prediction ? "Use the attached resistor control." : "The control will unlock."}</small>
        </div>

        <section className={`mini-graph-object${hasInteracted ? " visible" : ""}`} aria-label="Live resistance and current graph">
          <header><span>03 · Notice</span><strong>R ↑ · I ↓</strong></header>
          <svg viewBox="0 0 200 112" role="img" aria-label="Current falls as resistance rises">
            <path className="mini-axis" d="M16 12v82h174" />
            <polyline className="mini-curve" points={graph.points} />
            <circle className="mini-active-point" cx={graph.activeX} cy={graph.activeY} r="5" />
            <text x="146" y="108">Resistance</text>
            <text x="20" y="19">Current</text>
          </svg>
        </section>

        <div className={`context-observation${hasInteracted ? " visible" : ""}`} aria-live="polite">
          {hasInteracted ? (
            <>
              <span>Notice this</span>
              <strong>Resistance ↑ · Current ↓</strong>
              <p>{initialResistance} Ω → {resistance} Ω &nbsp;·&nbsp; {initialCurrent} A → {current} A</p>
              <small>I = V ÷ R</small>
              <em>{predictionCorrect ? "Your prediction matched." : "The circuit showed a different result."}</em>
            </>
          ) : (
            <span>The workspace will interpret what you change.</span>
          )}
        </div>
      </div>
    </article>
  );
}
