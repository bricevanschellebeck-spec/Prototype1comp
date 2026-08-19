"use client";

import { useMemo, useRef, useState } from "react";
import { blockCatalogById } from "@/src/data/blockCatalog";
import type {
  BlueprintStep,
  LearningBlock,
  LessonBlueprint,
} from "@/src/domain/contracts";
import { ChallengeBlock } from "@/src/components/blocks/ChallengeBlock";
import { CircuitDiagramBlock } from "@/src/components/blocks/CircuitDiagramBlock";
import { CircuitSimulationBlock } from "@/src/components/blocks/CircuitSimulationBlock";
import { GraphBlock } from "@/src/components/blocks/GraphBlock";
import { PredictionQuestionBlock } from "@/src/components/blocks/PredictionQuestionBlock";

type Props = {
  blueprint: LessonBlueprint;
  lessonTitle: string;
  goalLabel: string;
  depthLabel: string;
  onAdjust: () => void;
};

type DisplayStep = {
  step: BlueprintStep;
  block: LearningBlock;
  adaptive: boolean;
};

function renderBlock(
  block: LearningBlock,
  callbacks: {
    onSimulationInteraction: () => void;
    onPredictionResult: (correct: boolean) => void;
  },
) {
  if (block.componentType === "diagram") return <CircuitDiagramBlock block={block} />;
  if (block.componentType === "simulation") {
    return (
      <CircuitSimulationBlock
        block={block}
        onInteraction={callbacks.onSimulationInteraction}
      />
    );
  }
  if (block.componentType === "question") {
    return (
      <PredictionQuestionBlock
        block={block}
        onResult={callbacks.onPredictionResult}
      />
    );
  }
  if (block.componentType === "graph") return <GraphBlock block={block} />;
  if (block.componentType === "challenge") return <ChallengeBlock block={block} />;
  return null;
}

function learningNote(block: LearningBlock) {
  if (block.content.kind === "diagram") return block.content.body;
  if (block.content.kind === "simulation") {
    return `At a fixed ${block.content.fixedVoltage} V, increasing resistance reduces the current.`;
  }
  if (block.content.kind === "question") return block.content.feedback;
  if (block.content.kind === "graph") return block.content.body;
  return "Use R = V ÷ I to choose the resistance that produces the target current.";
}

export function LessonRenderer({
  blueprint,
  lessonTitle,
  goalLabel,
  depthLabel,
  onAdjust,
}: Props) {
  const workspaceRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);
  const [simulationExplored, setSimulationExplored] = useState(false);
  const [checkpointResult, setCheckpointResult] = useState<boolean | null>(null);

  const composedSteps = useMemo<DisplayStep[]>(
    () =>
      blueprint.steps.flatMap((step) => {
        const block = blockCatalogById.get(step.blockId);
        return block ? [{ step, block, adaptive: false }] : [];
      }),
    [blueprint.steps],
  );

  const displaySteps = useMemo<DisplayStep[]>(() => {
    const steps = [...composedSteps];
    if (checkpointResult !== false) return steps;
    if (steps.some(({ block }) => block.id === "ohms-law-relationship-diagram")) {
      return steps;
    }

    const checkpointIndex = steps.findIndex(
      ({ block }) => block.componentType === "question",
    );
    const remediationBlock = blockCatalogById.get("ohms-law-relationship-diagram");
    if (checkpointIndex < 0 || !remediationBlock) return steps;

    const remediationStep: BlueprintStep = {
      stepId: "adaptive-remediation",
      blockId: remediationBlock.id,
      purpose: remediationBlock.purpose,
      reasonCode: "address-known-misconception",
      expectedEvidence:
        "Learner revisits the inverse resistance-current relationship in a simpler visual form.",
    };

    steps.splice(checkpointIndex + 1, 0, {
      step: remediationStep,
      block: remediationBlock,
      adaptive: true,
    });
    return steps;
  }, [checkpointResult, composedSteps]);

  const lessonComplete = activeIndex >= displaySteps.length;
  const active = lessonComplete ? null : displaySteps[activeIndex];
  const waitingForExperiment =
    active?.block.componentType === "simulation" && !simulationExplored;
  const waitingForPrediction =
    active?.block.componentType === "question" && checkpointResult === null;
  const continueBlocked = waitingForExperiment || waitingForPrediction;
  const collectedCount = Math.min(completedCount, displaySteps.length);

  function moveTo(nextIndex: number) {
    setActiveIndex(nextIndex);
    window.requestAnimationFrame(() => {
      if (document.documentElement.scrollHeight > window.innerHeight + 2) {
        workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  function continueForward() {
    if (continueBlocked) return;
    setCompletedCount((current) => Math.max(current, activeIndex + 1));
    moveTo(activeIndex + 1);
  }

  function nextActionLabel() {
    if (waitingForExperiment) return "Predict, then move the slider";
    if (waitingForPrediction) return "Answer to reveal the next block";
    if (activeIndex === displaySteps.length - 1) return "Build my learning record";
    return `Next: ${displaySteps[activeIndex + 1].block.title}`;
  }

  return (
    <section className="lesson-renderer learning-workspace" aria-label="Composed lesson" ref={workspaceRef}>
      <header className="workspace-control-bar">
        <div className="control-lesson-title">
          <span>Assembled learning path</span>
          <h2>{lessonTitle}</h2>
        </div>
        <div className="control-current-step" aria-live="polite">
          <span>
            {active?.adaptive
              ? "Adaptive support inserted"
              : lessonComplete
                ? "Path complete"
                : `Step ${activeIndex + 1} of ${displaySteps.length}`}
          </span>
          <strong>{lessonComplete ? "Learning record ready" : active?.block.title}</strong>
        </div>
        <div className="control-actions">
          <div><span>Goal</span><strong>{goalLabel}</strong></div>
          <div><span>Depth</span><strong>{depthLabel}</strong></div>
          <button type="button" onClick={onAdjust}>Adjust</button>
          <button
            className="notes-toggle"
            type="button"
            aria-expanded={notesOpen}
            onClick={() => setNotesOpen(true)}
          >
            Notes <span>{collectedCount}</span>
          </button>
        </div>
      </header>

      <header className="workspace-header">
        <div>
          <span className="eyebrow">Continuous learning workspace</span>
          <h2>One idea at a time.</h2>
        </div>
        <p>
          Each section is a trusted learning block selected for this path. The
          workspace changes; the verified material stays within its boundaries.
        </p>
      </header>

      <nav className="workspace-route" aria-label="Lesson sections">
        {displaySteps.map(({ step, block, adaptive }, index) => {
          const reached = index <= collectedCount;
          const current = index === activeIndex && !lessonComplete;
          return (
            <button
              type="button"
              key={step.stepId}
              className={`${current ? "current" : ""} ${index < collectedCount ? "complete" : ""} ${adaptive ? "adaptive" : ""}`}
              disabled={!reached}
              aria-current={current ? "step" : undefined}
              aria-label={`${index + 1}. ${block.title}${adaptive ? ", adaptive support" : ""}`}
              onClick={() => moveTo(index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{block.title}</strong>
              <i aria-hidden="true" />
            </button>
          );
        })}
      </nav>

      <div className="workspace-grid">
        <div className="active-exhibit" aria-live="polite">
          {active ? (
            <div className={`exhibit-scene${active.adaptive ? " adaptive-exhibit" : ""}`} key={active.step.stepId}>
              <header className="exhibit-index">
                <span>Section {String(activeIndex + 1).padStart(2, "0")}</span>
                <strong>{active.step.purpose}</strong>
                <small>{activeIndex + 1} / {displaySteps.length}</small>
              </header>

              {renderBlock(active.block, {
                onSimulationInteraction: () => setSimulationExplored(true),
                onPredictionResult: setCheckpointResult,
              })}

              <details className="composition-reason">
                <summary>Why the composer selected this block</summary>
                <p><strong>{active.step.reasonCode}</strong></p>
                <p>{active.step.expectedEvidence}</p>
              </details>

              <nav className="exhibit-navigation" aria-label="Move through lesson">
                <button
                  className="exhibit-back"
                  type="button"
                  disabled={activeIndex === 0}
                  onClick={() => moveTo(activeIndex - 1)}
                >
                  <span aria-hidden="true">←</span> Previous
                </button>
                <button
                  className="exhibit-continue"
                  type="button"
                  disabled={continueBlocked}
                  onClick={continueForward}
                >
                  <span>
                    <small>
                      {active.adaptive
                        ? "Support added from your answer"
                        : activeIndex === displaySteps.length - 1
                          ? "Complete the experience"
                          : "Continue through the path"}
                    </small>
                    <strong>{nextActionLabel()}</strong>
                  </span>
                  <i aria-hidden="true">→</i>
                </button>
              </nav>
            </div>
          ) : (
            <section className="lesson-complete-scene">
              <span className="eyebrow">Path complete</span>
              <h2>The explanation became a record of what you explored.</h2>
              <p>
                This path was assembled from trusted blocks. When the checkpoint
                revealed a misconception, the workspace inserted additional
                support instead of merely changing a paragraph.
              </p>
              <button type="button" onClick={() => moveTo(0)}>Review from the beginning</button>
            </section>
          )}
        </div>

        <button
          className={`learning-record-backdrop${notesOpen ? " open" : ""}`}
          type="button"
          aria-label="Close learning record"
          tabIndex={notesOpen ? 0 : -1}
          onClick={() => setNotesOpen(false)}
        />
        <aside
          className={`learning-record learning-record-drawer${notesOpen ? " open" : ""}`}
          aria-label="What you have learned"
          aria-hidden={!notesOpen}
        >
          <header>
            <span className="record-mark" aria-hidden="true">✦</span>
            <div>
              <span className="eyebrow">Learning record</span>
              <h2>What you have learned</h2>
            </div>
            <button type="button" aria-label="Close notes" onClick={() => setNotesOpen(false)}>×</button>
          </header>

          {collectedCount === 0 ? (
            <p className="empty-record">Your notes will form here as you move through the experience.</p>
          ) : (
            <ol>
              {displaySteps.slice(0, collectedCount).map(({ step, block }, index) => (
                <li key={step.stepId}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{block.title}</strong>
                    <p>{learningNote(block)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <footer>
            <span>{collectedCount}</span>
            <small>of {displaySteps.length} ideas collected</small>
          </footer>
        </aside>
      </div>
    </section>
  );
}
