"use client";

import { useState } from "react";
import type { LearningBlock } from "@/src/domain/contracts";
import { BlockLabel } from "@/src/components/blocks/CircuitDiagramBlock";

type Props = {
  block: LearningBlock;
};

export function ChallengeBlock({ block }: Props) {
  if (block.content.kind !== "challenge") return null;

  return <ChallengeContent block={block} content={block.content} />;
}

function ChallengeContent({
  block,
  content,
}: Props & {
  content: Extract<LearningBlock["content"], { kind: "challenge" }>;
}) {

  const [selected, setSelected] = useState<number | null>(null);
  const correctResistance = content.voltage / content.targetCurrent;
  const correct = selected === correctResistance;

  return (
    <article className="learning-block challenge-block">
      <BlockLabel purpose={block.purpose} title={block.title} />
      <div className="challenge-banner">Final application</div>
      <h3>{content.heading}</h3>
      <p>{content.prompt}</p>
      <div className="formula-chip">R = V ÷ I</div>
      <div className="resistance-options" role="group" aria-label="Resistance choices">
        {content.resistanceOptions.map((resistance) => (
          <button
            type="button"
            className={selected === resistance ? "selected" : ""}
            key={resistance}
            onClick={() => setSelected(resistance)}
          >
            {resistance} Ω
          </button>
        ))}
      </div>
      {selected !== null ? (
        <div className={`feedback ${correct ? "correct" : "incorrect"}`} role="status">
          <strong>{correct ? "Circuit target reached." : "That resistor misses the target."}</strong>
          <span>
            {correct
              ? `${content.voltage} V ÷ ${selected} Ω = ${content.targetCurrent} A.`
              : `Calculate ${content.voltage} V ÷ ${content.targetCurrent} A before choosing.`}
          </span>
        </div>
      ) : null}
    </article>
  );
}
