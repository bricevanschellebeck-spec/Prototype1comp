"use client";

import { useState } from "react";
import type { LearningBlock } from "@/src/domain/contracts";
import { BlockLabel } from "@/src/components/blocks/CircuitDiagramBlock";

type Props = {
  block: LearningBlock;
  onComplete?: () => void;
};

export function ChallengeBlock({ block, onComplete }: Props) {
  if (block.content.kind !== "challenge") return null;

  return <ChallengeContent block={block} content={block.content} onComplete={onComplete} />;
}

function ChallengeContent({
  block,
  content,
  onComplete,
}: Props & {
  content: Extract<LearningBlock["content"], { kind: "challenge" }>;
}) {

  const [selected, setSelected] = useState<number | null>(null);
  const [symbolsRevealed, setSymbolsRevealed] = useState(false);
  const observedCurrent = Number((content.voltage / content.givenResistance).toFixed(2));
  const applicationCurrent = Number((content.voltage / content.applicationResistance).toFixed(2));
  const correct = selected === applicationCurrent;

  return (
    <article className="learning-block challenge-block">
      <BlockLabel purpose={block.purpose} title={block.title} />
      <div className="challenge-banner">Final application</div>
      <h3>{content.heading}</h3>
      <p>{content.prompt}</p>
      <div className={`formula-connection${symbolsRevealed ? " revealed" : ""}`} aria-label="Ohm's law connected to the experiment">
        <div className="word-equation">
          <span>First, in words</span>
          <strong>Current = Voltage ÷ Resistance</strong>
          {!symbolsRevealed ? (
            <button type="button" onClick={() => setSymbolsRevealed(true)}>
              Show the shorthand →
            </button>
          ) : null}
        </div>
        {symbolsRevealed ? <div className="symbol-equation">
          <span>Then, in shorthand</span>
          <strong>I = V ÷ R</strong>
          <small>I current · V voltage · R resistance</small>
        </div> : null}
        {symbolsRevealed ? <div className="value-equation">
          <span>Your circuit values</span>
          <strong>{content.voltage} ÷ {content.givenResistance} = {observedCurrent} A</strong>
          <small>{content.voltage} V battery · {content.givenResistance} Ω resistor</small>
        </div> : null}
      </div>
      {symbolsRevealed ? <><div className="formula-apply-prompt">
        <span>Apply it once</span>
        <strong>New resistor: at {content.voltage} V and {content.applicationResistance} Ω, what current should flow?</strong>
      </div>
      <div className="resistance-options" role="group" aria-label="Current choices">
        {content.currentOptions.map((currentOption) => (
          <button
            type="button"
            className={selected === currentOption ? "selected" : ""}
            key={currentOption}
            onClick={() => {
              setSelected(currentOption);
              if (currentOption === applicationCurrent) onComplete?.();
            }}
          >
            {currentOption} A
          </button>
        ))}
      </div>
      {selected !== null ? (
        <div className={`feedback ${correct ? "correct" : "incorrect"}`} role="status">
          <strong>{correct ? "Circuit target reached." : "That resistor misses the target."}</strong>
          <span>
            {correct
              ? `${content.voltage} V ÷ ${content.applicationResistance} Ω = ${applicationCurrent} A. You used the discovered relationship in a new circuit.`
              : `Try the new circuit values in order: ${content.voltage} ÷ ${content.applicationResistance}.`}
          </span>
        </div>
      ) : null}</> : null}
    </article>
  );
}
