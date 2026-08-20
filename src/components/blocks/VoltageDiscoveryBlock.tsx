"use client";

import { useState } from "react";
import type { LearningBlock } from "@/src/domain/contracts";

type Props = {
  block: LearningBlock;
  onInteraction?: () => void;
};

export function VoltageDiscoveryBlock({ block, onInteraction }: Props) {
  if (block.content.kind !== "voltage-discovery") return null;

  const [batteryPresent, setBatteryPresent] = useState(true);
  const [compared, setCompared] = useState(false);
  const { fixedVoltage, heading } = block.content;

  function toggleBattery() {
    const nextPresent = !batteryPresent;
    setBatteryPresent(nextPresent);
    if (!nextPresent && !compared) {
      setCompared(true);
      onInteraction?.();
    }
  }

  return (
    <article className={`learning-block voltage-block${batteryPresent ? " source-present" : " source-missing"}${compared ? " comparison-made" : ""}`}>
      <header className="object-step-heading">
        <span>Look at one object</span>
        <h3>{heading}</h3>
      </header>

      <div className="voltage-workspace">
        <div className="voltage-circuit" aria-label={batteryPresent ? "Circuit powered by a battery" : "Complete circuit without a battery"}>
          <svg viewBox="0 0 780 350" role="img">
            <title>{batteryPresent ? "Charge moving in a circuit with a battery" : "No charge movement without the battery"}</title>
            <path className="voltage-wire" d="M135 77 H645 V270 H135 V77" />
            {batteryPresent ? (
              <>
                <line className="battery-long" x1="106" y1="139" x2="164" y2="139" />
                <line className="battery-short" x1="119" y1="181" x2="151" y2="181" />
              </>
            ) : (
              <path className="missing-source" d="M106 138h58v44h-58z" />
            )}
            <path className="voltage-wire" d="M135 77 V139 M135 181 V270" />
            <circle className="voltage-lamp-glow" cx="545" cy="270" r="43" />
            <circle className="voltage-lamp" cx="545" cy="270" r="25" />
            <path className="voltage-filament" d="M532 270 l13 -11 l13 11 l-13 11 z" />
            <path className="voltage-current" d="M205 270 H435" />
            <path className="voltage-current-head" d="M435 270 l-17 -11 v22 z" />
          </svg>

          <div className="battery-attached-label">
            <span>{batteryPresent ? "Battery" : "Battery removed"}</span>
            <strong>{compared && batteryPresent ? `${fixedVoltage} V · provides voltage` : batteryPresent ? "Remove it and compare" : "No electrical push"}</strong>
            <button type="button" onClick={toggleBattery}>
              {batteryPresent ? "Remove battery" : "Put battery back"}
            </button>
          </div>

          <div className="wire-attached-label">
            <span>Complete path</span>
            <strong>{batteryPresent ? "Charge moving" : "No movement"}</strong>
          </div>

          <div className={`voltage-name-reveal${compared ? " visible" : ""}`} aria-live="polite">
            <span>Notice</span>
            <strong>{batteryPresent ? "The movement returns." : "The path is complete, but charge stops."}</strong>
            <p>The battery provides the electrical push.</p>
            <p>That push is called <b>voltage</b>.</p>
          </div>
        </div>

        <div className="voltage-action-cue">
          <span>{compared ? "Comparison made" : "Try this"}</span>
          <strong>{compared ? "Same path. One missing source." : "What changes without the battery?"}</strong>
        </div>
      </div>
    </article>
  );
}
