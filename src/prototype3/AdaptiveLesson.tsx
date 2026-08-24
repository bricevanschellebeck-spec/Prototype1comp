"use client";

import { useEffect, useRef, useState } from "react";
import { AdaptiveBlock } from "./AdaptiveBlocks";
import { adaptiveBlockCatalog, adaptiveBlockCatalogById } from "./catalog";
import { requestP3Composition } from "./clientComposer";
import { createP3InitialLearnerState } from "./composer";
import type {
  P3ComposeResponse,
  P3Depth,
  P3Goal,
  P3LessonBlueprint,
} from "./composerContracts";
import { updateLearnerState } from "./engine";
import type { BlockOutcome, LearnerState } from "./domain";
import styles from "./prototype3.module.css";

type Props = {
  goal: P3Goal;
  depth: P3Depth;
  goalLabel: string;
  depthLabel: string;
  initialComposition: P3ComposeResponse;
  onAdjust: () => void;
  onCompareTextbook: () => void;
};

type ComposedStep = P3LessonBlueprint["remainingSteps"][number] & {
  outcome?: BlockOutcome;
};

type Session = {
  learner: LearnerState;
  steps: ComposedStep[];
  composition: P3ComposeResponse;
};

const DIAGNOSTIC_BLOCK_ID = "resistance-prediction-experiment";

const sourceRepresentations = [
  { id: "01", label: "Circuit figure", live: "Live circuit" },
  { id: "02", label: "Definitions", live: "Attached labels" },
  { id: "03", label: "Relationship", live: "Responsive pattern" },
  { id: "04", label: "Ohm's law", live: "Formula application" },
  { id: "05", label: "Question", live: "Learner evidence" },
] as const;

function activeSourceIds(blockId?: string) {
  const mapping: Record<string, string[]> = {
    "resistance-prediction-experiment": ["01", "02", "05"],
    "resistance-misconception-visual": ["02", "03"],
    "guided-resistance-experiment": ["01", "02", "03"],
    "resistance-equivalent-retry": ["01", "02", "05"],
    "current-resistance-graph": ["03"],
    "target-current-challenge": ["01", "04", "05"],
    "final-circuit-design-challenge": ["01", "04", "05"],
  };
  return new Set(blockId ? mapping[blockId] ?? [] : []);
}

function createSession(composition: P3ComposeResponse): Session {
  return {
    learner: createP3InitialLearnerState(),
    steps: composition.blueprint.remainingSteps.map((step) => ({ ...step })),
    composition,
  };
}

function readableReason(reason: ComposedStep["reasonCode"]) {
  const labels: Record<ComposedStep["reasonCode"], string> = {
    "elicit-existing-model": "Elicit the learner's existing model",
    "test-through-manipulation": "Test the relationship by changing the circuit",
    "offer-alternate-representation": "Show the same relationship another way",
    "respond-to-misconception": "Respond to the evidence just detected",
    "increase-challenge": "Increase challenge after secure evidence",
    "confirm-transfer": "Confirm that the idea transfers",
  };
  return labels[reason];
}

export function AdaptiveLesson({
  goal,
  depth,
  goalLabel,
  depthLabel,
  initialComposition,
  onAdjust,
  onCompareTextbook,
}: Props) {
  const [session, setSession] = useState<Session>(() => createSession(initialComposition));
  const [composing, setComposing] = useState(false);
  const [showTrace, setShowTrace] = useState(false);
  const canvasRef = useRef<HTMLElement>(null);
  const traceRef = useRef<HTMLElement>(null);
  const pathRef = useRef<HTMLDivElement>(null);

  const activeIndex = session.steps.findIndex((step) => !step.outcome);
  const activeStep = activeIndex >= 0 ? session.steps[activeIndex] : undefined;
  const activeBlock = activeStep ? adaptiveBlockCatalogById.get(activeStep.blockId) : undefined;
  const completedSteps = session.steps.filter((step) => step.outcome);
  const isComplete = !composing && session.steps.length > 0 && activeIndex < 0;
  const activeSources = activeSourceIds(activeBlock?.id);

  useEffect(() => {
    canvasRef.current?.scrollTo({ top: 0 });
    traceRef.current?.scrollTo({ top: 0 });
    const path = pathRef.current;
    if (path) path.scrollTo({ left: Math.max(0, path.scrollWidth - path.clientWidth), behavior: "smooth" });
  }, [activeBlock?.id, composing]);

  async function recordOutcome(outcome: BlockOutcome) {
    if (!activeStep || activeStep.outcome || activeStep.blockId !== outcome.blockId || composing) return;

    const learner = updateLearnerState(session.learner, outcome);
    const completed = session.steps.map((step, index) =>
      index === activeIndex ? { ...step, outcome } : step,
    );

    if (outcome.blockId !== DIAGNOSTIC_BLOCK_ID) {
      setSession({ ...session, learner, steps: completed });
      return;
    }

    const completedPrefix = completed.slice(0, activeIndex + 1);
    const completedBlockIds = completedPrefix.map((step) => step.blockId);
    setComposing(true);
    setSession({ ...session, learner, steps: completedPrefix });

    const composition = await requestP3Composition({
      phase: "adapt",
      goal,
      depth,
      learnerState: learner,
      completedBlockIds,
      lastOutcome: outcome,
    });
    setSession({
      learner,
      composition,
      steps: [
        ...completedPrefix,
        ...composition.blueprint.remainingSteps.map((step) => ({ ...step })),
      ],
    });
    setComposing(false);
  }

  const lastEvidence = session.learner.lastOutcome;
  const selectedIds = session.composition.blueprint.remainingSteps.map((step) => step.blockId);

  return (
    <section className={styles.workspace} aria-label="Prototype 3 AI-composed learning workspace">
      <header className={styles.controlBar}>
        <div className={styles.controlTitle}>
          <span>Assembled for this learner</span>
          <h2>How resistance changes current</h2>
        </div>
        <div className={styles.liveDecision} aria-live="polite">
          <span>{composing ? "Recomposing" : isComplete ? "Path complete" : "Current selection"}</span>
          <strong>{composing ? "Using your latest evidence" : isComplete ? "Learning record ready" : activeBlock?.title}</strong>
        </div>
        <div className={styles.contextControls}>
          <div><span>Goal</span><strong>{goalLabel}</strong></div>
          <div><span>Depth</span><strong>{depthLabel}</strong></div>
          <button type="button" onClick={onCompareTextbook}>Textbook</button>
          <button type="button" onClick={() => setShowTrace((value) => !value)}>{showTrace ? "Close composer" : "View composer"}</button>
          <button type="button" onClick={onAdjust}>Adjust</button>
        </div>
      </header>

      <div ref={pathRef} className={styles.compositionBand} aria-label="AI-composed blocks">
        <div className={styles.compositionBandLabel}>
          <span>{session.composition.source === "ollama" ? "Ollama blueprint" : "Verified fallback"}</span>
          <strong>{composing ? "Unfinished path is changing" : `${session.steps.length} verified pieces`}</strong>
        </div>
        <ol>
          {session.steps.map((step, index) => {
            const block = adaptiveBlockCatalogById.get(step.blockId);
            const active = index === activeIndex;
            return (
              <li key={`${step.blockId}-${index}`} className={`${step.outcome ? styles.pathComplete : active ? styles.pathActive : styles.pathFuture}`}>
                <b>{String(index + 1).padStart(2, "0")}</b>
                <span>{block?.title}</span>
                <small>{step.outcome ? "observed" : active ? "now" : "next"}</small>
              </li>
            );
          })}
          {composing ? <li className={styles.unknownNext}><b>AI</b><span>Recomposing…</span></li> : null}
        </ol>
      </div>

      <div className={`${styles.workspaceGrid} ${showTrace ? styles.workspaceGridTrace : ""}`}>
        <main ref={canvasRef} className={styles.learningCanvas}>
          <div className={styles.canvasHeading}>
            <span>{composing ? "Learner evidence → AI composer" : `Live representation ${Math.max(1, completedSteps.length + 1)}`}</span>
            <p>{activeBlock ? `${activeBlock.sourceFactIds.length} trusted facts · ${activeBlock.interactionType}` : "The fixed source is becoming an active learning object."}</p>
          </div>

          <div className={styles.sourceRepresentationRail} aria-label="Textbook pieces transformed in this activity">
            {sourceRepresentations.map((source) => (
              <div key={source.id} className={activeSources.has(source.id) ? styles.sourceRepresentationActive : ""}>
                <b>{source.id}</b>
                <span>{source.label}</span>
                <i aria-hidden="true">→</i>
                <strong>{source.live}</strong>
              </div>
            ))}
          </div>

          {composing ? (
            <section className={styles.recomposingState} aria-live="polite">
              <div aria-hidden="true"><i /><i /><i /></div>
              <span>New evidence received</span>
              <h2>Recomposing only what comes next…</h2>
              <p>Completed interactions remain in place.</p>
            </section>
          ) : null}
          {activeBlock && !composing ? (
            <div className={styles.assembledObjectStage} data-active-block={activeBlock.id}>
              <AdaptiveBlock key={`${activeBlock.id}-${activeIndex}`} block={activeBlock} onComplete={recordOutcome} />
            </div>
          ) : null}
          {!activeBlock && !composing && !isComplete ? (
            <section className={styles.blocked} role="alert">
              <strong>A selected component is not registered.</strong>
              <p>Return to the textbook and compose a verified fallback path.</p>
            </section>
          ) : null}
          {isComplete ? (
            <section className={styles.completion}>
              <span>AI-composed path complete</span>
              <h2>The textbook knowledge became something you could manipulate.</h2>
              <p>{session.steps.length} verified components represented the same trusted lesson. The unfinished path changed once learner evidence became available.</p>
              <div>
                <button type="button" onClick={onCompareTextbook}>Compare with the textbook</button>
                <button type="button" onClick={() => setSession(createSession(initialComposition))}>Try the other path</button>
              </div>
            </section>
          ) : null}
        </main>

        {showTrace ? <aside ref={traceRef} className={styles.engineTrace} aria-label="AI composer trace">
          <header>
            <span className={styles.tracePulse} aria-hidden="true" />
            <div><small>Live composer trace</small><strong>How was this assembled?</strong></div>
            <button type="button" onClick={() => setShowTrace(false)} aria-label="Close composer trace">×</button>
          </header>
          <section>
            <span>01 · Composer</span>
            <strong>{session.composition.source === "ollama" ? "Local Ollama AI" : "Verified fallback"}</strong>
            <p>{session.composition.source === "ollama" ? session.composition.model : session.composition.fallbackReason ?? "The deterministic safety path was used."}</p>
          </section>
          <section>
            <span>02 · Latest learner evidence</span>
            {lastEvidence ? (
              <dl>
                <div><dt>Result</dt><dd>{lastEvidence.correct === undefined ? "completed" : lastEvidence.correct ? "correct" : "support needed"}</dd></div>
                <div><dt>Attempts</dt><dd>{lastEvidence.attempts}</dd></div>
                <div><dt>Hint</dt><dd>{lastEvidence.hintUsed ? "used" : "not used"}</dd></div>
              </dl>
            ) : <p>No learner evidence yet. Goal and depth shaped the first composition.</p>}
          </section>
          <section>
            <span>03 · Available verified blocks</span>
            <ol>
              {session.composition.candidateBlockIds.map((blockId) => {
                const block = adaptiveBlockCatalogById.get(blockId);
                return (
                  <li key={blockId} className={selectedIds.includes(blockId) ? styles.candidateSelected : ""}>
                    <div><strong>{block?.title ?? blockId}</strong><small>{block?.interactionType}</small></div>
                    <span>{selectedIds.includes(blockId) ? "chosen" : "available"}</span>
                  </li>
                );
              })}
            </ol>
          </section>
          <section>
            <span>04 · AI chose</span>
            <ol>
              {session.composition.blueprint.remainingSteps.map((step, index) => (
                <li key={`${step.blockId}-${index}`} className={styles.candidateSelected}>
                  <div><strong>{adaptiveBlockCatalogById.get(step.blockId)?.title}</strong><small>{readableReason(step.reasonCode)}</small></div>
                  <span>{index + 1}</span>
                </li>
              ))}
            </ol>
          </section>
          <footer>
            <span>Why</span>
            <strong>{session.composition.source === "ollama" ? "AI decision, deterministically validated" : "Safe authored decision"}</strong>
            <p>{session.composition.blueprint.compositionSummary}</p>
          </footer>
        </aside> : null}
      </div>
      <footer className={styles.catalogNote}>
        <strong>{adaptiveBlockCatalog.length} registered blocks · 7 trusted facts</strong>
        <span>Rules are guardrails · Ollama is the composer · React components are the vocabulary</span>
      </footer>
    </section>
  );
}
