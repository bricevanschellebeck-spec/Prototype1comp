"use client";

import { useState } from "react";
import type { LearningBlock } from "@/src/domain/contracts";

type Props = {
  block: LearningBlock;
  onInteraction?: () => void;
};

export function CircuitFoundationBlock({ block, onInteraction }: Props) {
  if (block.content.kind !== "circuit-foundation") return null;

  const [closed, setClosed] = useState(false);
  const { heading, introduction } = block.content;

  function toggleCircuit() {
    const nextClosed = !closed;
    setClosed(nextClosed);
    if (nextClosed) onInteraction?.();
  }

  return (
    <article className={`learning-block foundation-block${closed ? " circuit-closed" : ""}`}>
      <header className="foundation-opening">
        <div>
          <span>Start with the system</span>
          <h3>{heading}</h3>
        </div>
        <p>{introduction}</p>
      </header>

      <div className="foundation-workspace">
        <div className="foundation-action">
          <span>{closed ? "You did it" : "01 · Try this"}</span>
          <strong>{closed ? "The path is complete." : "Close the gap."}</strong>
          <button
            type="button"
            aria-pressed={closed}
            onClick={toggleCircuit}
          >
            <i aria-hidden="true" />
            {closed ? "Open the switch" : "Close the switch"}
          </button>
        </div>

        <div className="foundation-circuit" aria-label={closed ? "Closed circuit with current flowing" : "Open circuit with a gap"}>
          <svg viewBox="0 0 760 330" role="img">
            <title>{closed ? "A closed circuit lighting a lamp" : "An open circuit with a switch gap"}</title>
            <path className="foundation-wire" d="M130 76 H282 M420 76 H628 V252 H130 V76" />
            <line className="battery-long" x1="102" y1="132" x2="158" y2="132" />
            <line className="battery-short" x1="114" y1="172" x2="146" y2="172" />
            <path className="foundation-wire" d="M130 76 V132 M130 172 V252" />
            <circle className="foundation-switch-contact" cx="297" cy="76" r="8" />
            <circle className="foundation-switch-contact" cx="405" cy="76" r="8" />
            <line
              className="foundation-switch-arm"
              x1="297"
              y1="76"
              x2="405"
              y2={closed ? "76" : "35"}
            />
            <circle className="foundation-lamp-glow" cx="522" cy="252" r="42" />
            <circle className="foundation-lamp" cx="522" cy="252" r="25" />
            <path className="foundation-filament" d="M509 252 l13 -11 l13 11 l-13 11 z" />
            <path className="foundation-current-path" d="M175 252 H430" />
            <path className="foundation-current-head" d="M430 252 l-17 -11 v22 z" />
          </svg>

          <div className="foundation-label foundation-battery-label">
            <span>Battery</span><strong>Energy source</strong>
          </div>
          <div className="foundation-label foundation-switch-label">
            <span>Switch</span><strong>{closed ? "Path closed" : "Path open"}</strong>
          </div>
          <div className="foundation-label foundation-lamp-label">
            <span>Lamp</span><strong>{closed ? "Lamp on" : "Lamp off"}</strong>
          </div>

          <div className={`foundation-path-reveal${closed ? " visible" : ""}`}>
            <span>Path complete</span>
            <strong>One unbroken loop</strong>
          </div>

          <div className={`foundation-current-reveal${closed ? " visible" : ""}`} aria-live="polite">
            <span>Charge is moving around the loop.</span>
            <strong>This flow is called current.</strong>
          </div>
        </div>
      </div>
    </article>
  );
}
