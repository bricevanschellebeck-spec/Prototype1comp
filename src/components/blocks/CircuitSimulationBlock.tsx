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
  const [resistanceIntroduced, setResistanceIntroduced] = useState(false);
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
      : resistanceIntroduced
        ? "predict"
        : "introduce";

  function changeResistance(nextResistance: number) {
    const constrained = Math.min(
      resistanceRange[1],
      Math.max(resistanceRange[0], nextResistance),
    );
    setResistance(constrained);
    if (!hasInteracted && constrained === initialResistance * 2) {
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
          Closed circuit · battery fixed at {fixedVoltage} V
        </div>

        <section className="prediction-object" aria-label="Prediction before experiment">
          <span><i aria-hidden="true" /> 01 · Predict</span>
          <strong>If resistance increases while voltage stays fixed, what will current do?</strong>
          <p>Choose first. Then test your idea.</p>
          <div>
            <button
              type="button"
              className={prediction === "increase" ? "selected" : ""}
              onClick={() => setPrediction("increase")}
              aria-label="Predict current increases"
              aria-pressed={prediction === "increase"}
            >
              <b aria-hidden="true">↑</b><small>Increases</small>
            </button>
            <button
              type="button"
              className={prediction === "decrease" ? "selected" : ""}
              onClick={() => setPrediction("decrease")}
              aria-label="Predict current decreases"
              aria-pressed={prediction === "decrease"}
            >
              <b aria-hidden="true">↓</b><small>Decreases</small>
            </button>
            <button
              type="button"
              className={prediction === "same" ? "selected" : ""}
              onClick={() => setPrediction("same")}
              aria-label="Predict current stays the same"
              aria-pressed={prediction === "same"}
            >
              <b aria-hidden="true">=</b><small>Stays same</small>
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
            className={`attached-resistance-control${resistanceIntroduced ? " introduced" : ""}${prediction ? " unlocked" : ""}`}
          >
            <span>Resistor</span>
            <p className="resistor-definition">Opposes flow. This opposition is called <strong>resistance</strong>.</p>
            {!resistanceIntroduced ? (
              <button
                className="resistor-intro-button"
                type="button"
                onClick={() => setResistanceIntroduced(true)}
              >
                Predict what changes →
              </button>
            ) : null}
            <div className={`resistance-controls${resistanceIntroduced ? " visible" : ""}`}>
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
          <span>02 · Now test it</span>
          <strong>{prediction ? `Try ${initialResistance * 2} Ω` : "Choose a prediction"}</strong>
          <small>{prediction ? "Watch the movement and current value." : "The resistor control will unlock."}</small>
        </div>

        <div className={`context-observation${hasInteracted ? " visible" : ""}`} aria-live="polite">
          {hasInteracted ? (
            <>
              <span>03 · Notice</span>
              <strong>More resistance. Less current.</strong>
              <p>{initialResistance} Ω → {resistance} Ω &nbsp;·&nbsp; {initialCurrent} A → {current} A</p>
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
