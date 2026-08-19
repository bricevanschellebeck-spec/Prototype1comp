"use client";

import { useState } from "react";
import type { LearningBlock } from "@/src/domain/contracts";
import { BlockLabel } from "@/src/components/blocks/CircuitDiagramBlock";

type Props = {
  block: LearningBlock;
  onResult?: (correct: boolean) => void;
};

export function PredictionQuestionBlock({ block, onResult }: Props) {
  if (block.content.kind !== "question") return null;

  return (
    <PredictionQuestionContent
      block={block}
      content={block.content}
      onResult={onResult}
    />
  );
}

function PredictionQuestionContent({
  block,
  content,
  onResult,
}: Props & {
  content: Extract<LearningBlock["content"], { kind: "question" }>;
}) {

  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const correct = selected === content.correctIndex;

  return (
    <article className="learning-block question-block">
      <BlockLabel purpose={block.purpose} title={block.title} />
      <h3>{content.heading}</h3>
      <p className="question-prompt">{content.prompt}</p>
      <fieldset className="choice-list">
        <legend className="sr-only">Choose one answer</legend>
        {content.options.map((option, index) => (
          <label
            className={`choice ${selected === index ? "selected" : ""}`}
            key={option}
          >
            <input
              type="radio"
              name={block.id}
              checked={selected === index}
              onChange={() => {
                setSelected(index);
                setSubmitted(false);
              }}
            />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>
      <button
        className="secondary-button"
        type="button"
        disabled={selected === null}
        onClick={() => {
          setSubmitted(true);
          onResult?.(correct);
        }}
      >
        Check prediction
      </button>
      {submitted ? (
        <div className={`feedback ${correct ? "correct" : "incorrect"}`} role="status">
          <strong>{correct ? "That is the relationship." : "Try the relationship again."}</strong>
          <span>{content.feedback}</span>
        </div>
      ) : null}
    </article>
  );
}
