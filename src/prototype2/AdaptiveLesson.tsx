"use client";

import { useEffect, useRef, useState } from "react";
import { AdaptiveBlock } from "./AdaptiveBlocks";
import { adaptiveBlockCatalog, adaptiveBlockCatalogById } from "./catalog";
import { OBJECTIVE_LABELS } from "./curriculum";
import {
  createInitialLearnerState,
  selectNextBlock,
  updateLearnerState,
} from "./engine";
import type {
  BlockOutcome,
  LearnerState,
  NextBlockDecision,
  PathStep,
} from "./domain";
import styles from "./prototype2.module.css";

type Props = {
  goalLabel: string;
  depthLabel: string;
  onAdjust: () => void;
};

type Session = {
  learner: LearnerState;
  decision: NextBlockDecision;
  steps: PathStep[];
};

function createSession(): Session {
  const learner = createInitialLearnerState();
  const decision = selectNextBlock(learner);
  return {
    learner,
    decision,
    steps: decision.selectedBlockId
      ? [{ blockId: decision.selectedBlockId, decision }]
      : [],
  };
}

function readableReason(reason: string) {
  if (reason.startsWith("target:")) return "Matches the current curriculum objective";
  const labels: Record<string, string> = {
    "curriculum-core": "Core block for this objective",
    "addresses-active-misconception": "Addresses the evidence just detected",
    "varies-interaction": "Changes the form of interaction",
    "repeats-recent-interaction": "Repeats a recent interaction",
    "already-completed": "Already completed",
    "support-not-needed": "Support block is not currently needed",
    "prerequisite-not-secure": "A prerequisite is not secure",
    "all-required-objectives-secure": "All required objectives are complete",
    "no-legal-candidate": "No registered legal candidate remains",
  };
  return labels[reason] ?? reason;
}

export function AdaptiveLesson({ goalLabel, depthLabel, onAdjust }: Props) {
  const [session, setSession] = useState<Session>(createSession);
  const canvasRef = useRef<HTMLElement>(null);
  const traceRef = useRef<HTMLElement>(null);
  const pathRef = useRef<HTMLDivElement>(null);
  const activeStep = session.steps.at(-1);
  const activeBlock = activeStep && !activeStep.outcome
    ? adaptiveBlockCatalogById.get(activeStep.blockId)
    : undefined;
  const completedSteps = session.steps.filter((step) => step.outcome);
  const isComplete = session.decision.status === "complete" && !activeBlock;

  useEffect(() => {
    canvasRef.current?.scrollTo({ top: 0 });
    traceRef.current?.scrollTo({ top: 0 });
    const path = pathRef.current;
    if (path) path.scrollTo({ left: path.scrollWidth });
  }, [activeBlock?.id]);

  function recordOutcome(outcome: BlockOutcome) {
    setSession((current) => {
      const currentStep = current.steps.at(-1);
      if (!currentStep || currentStep.outcome || currentStep.blockId !== outcome.blockId) {
        return current;
      }

      const learner = updateLearnerState(current.learner, outcome);
      const decision = selectNextBlock(learner);
      const completed = current.steps.map((step, index) =>
        index === current.steps.length - 1 ? { ...step, outcome } : step,
      );
      const steps = decision.selectedBlockId
        ? [...completed, { blockId: decision.selectedBlockId, decision }]
        : completed;
      return { learner, decision, steps };
    });
  }

  const chosenCandidate = session.decision.candidates.find(
    (candidate) => candidate.blockId === session.decision.selectedBlockId,
  );
  const lastEvidence = session.learner.lastOutcome;

  return (
    <section className={styles.workspace} aria-label="Prototype 2 adaptive learning workspace">
      <header className={styles.controlBar}>
        <div className={styles.controlTitle}>
          <span>Prototype 2 · adaptive path</span>
          <h2>How resistance changes current</h2>
        </div>
        <div className={styles.liveDecision} aria-live="polite">
          <span>{isComplete ? "Path complete" : "Current selection"}</span>
          <strong>{isComplete ? "Learning record ready" : activeBlock?.title}</strong>
        </div>
        <div className={styles.contextControls}>
          <div><span>Goal</span><strong>{goalLabel}</strong></div>
          <div><span>Depth</span><strong>{depthLabel}</strong></div>
          <button type="button" onClick={onAdjust}>Adjust</button>
          <button type="button" onClick={() => setSession(createSession())}>Reset learner</button>
        </div>
      </header>

      <div ref={pathRef} className={styles.pathRail} aria-label="Blocks selected so far">
        {session.steps.map((step, index) => {
          const block = adaptiveBlockCatalogById.get(step.blockId);
          const support = block?.selectionRole !== "core";
          return (
            <div key={`${step.blockId}-${index}`} className={`${styles.pathItem} ${step.outcome ? styles.pathComplete : styles.pathActive}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{block?.title}</strong>
              {support ? <small>adaptive support</small> : null}
            </div>
          );
        })}
        {!isComplete ? <div className={styles.unknownNext}><span>?</span><strong>Chosen after your evidence</strong></div> : null}
      </div>

      <div className={styles.workspaceGrid}>
        <main ref={canvasRef} className={styles.learningCanvas}>
          <div className={styles.canvasHeading}>
            <span>Block {completedSteps.length + (activeBlock ? 1 : 0)} · trusted component</span>
            <p>The content is predefined. Only its selection changes.</p>
          </div>
          {activeBlock ? (
            <AdaptiveBlock key={`${activeBlock.id}-${session.steps.length}`} block={activeBlock} onComplete={recordOutcome} />
          ) : null}
          {isComplete ? (
            <section className={styles.completion}>
              <span>Adaptive path complete</span>
              <h2>You built a working model of resistance and current.</h2>
              <p>The engine selected {session.steps.length} trusted blocks. Your completed history remained unchanged while every unfinished choice was made from current evidence.</p>
              <div>
                <button type="button" onClick={() => setSession(createSession())}>Try the other path</button>
                <button type="button" onClick={onAdjust}>Change setup</button>
              </div>
            </section>
          ) : null}
          {session.decision.status === "blocked" ? (
            <section className={styles.blocked} role="alert">
              <strong>The engine found no legal block.</strong>
              <p>Reset the learner to restore the verified fallback path.</p>
            </section>
          ) : null}
        </main>

        <aside ref={traceRef} className={styles.engineTrace} aria-label="Adaptation engine trace">
          <header>
            <span className={styles.tracePulse} aria-hidden="true" />
            <div><small>Live engine trace</small><strong>Why this block?</strong></div>
          </header>
          <section>
            <span>01 · Learner evidence</span>
            {lastEvidence ? (
              <dl>
                <div><dt>Result</dt><dd>{lastEvidence.correct === undefined ? "completed" : lastEvidence.correct ? "correct" : "incorrect"}</dd></div>
                <div><dt>Attempts</dt><dd>{lastEvidence.attempts}</dd></div>
                <div><dt>Hint</dt><dd>{lastEvidence.hintUsed ? "used" : "not used"}</dd></div>
              </dl>
            ) : <p>Waiting for the first completed interaction.</p>}
          </section>
          <section>
            <span>02 · Current learner state</span>
            <strong>{session.decision.targetObjectiveId ? OBJECTIVE_LABELS[session.decision.targetObjectiveId] : "All objectives complete"}</strong>
            <p>{session.learner.activeMisconceptionIds.length ? "Support needed: resistance was linked with more current." : "No active misconception flag."}</p>
          </section>
          <section>
            <span>03 · Candidate blocks</span>
            <ol>
              {session.decision.candidates.slice(0, 4).map((candidate) => (
                <li key={candidate.blockId} className={candidate.blockId === session.decision.selectedBlockId ? styles.candidateSelected : candidate.eligible ? "" : styles.candidateRejected}>
                  <div><strong>{candidate.title}</strong><small>{candidate.eligible ? `score ${candidate.score}` : "not legal now"}</small></div>
                  <span>{candidate.blockId === session.decision.selectedBlockId ? "selected" : candidate.eligible ? "candidate" : "held"}</span>
                </li>
              ))}
              {session.decision.candidates.length === 0 ? <li className={styles.candidateSelected}><div><strong>Path complete</strong><small>No further block required</small></div></li> : null}
            </ol>
          </section>
          <footer>
            <span>Decision</span>
            <strong>{chosenCandidate?.title ?? (isComplete ? "Finish the path" : "Safe fallback required")}</strong>
            <p>{session.decision.reasonCodes.slice(0, 2).map(readableReason).join(" · ")}</p>
          </footer>
        </aside>
      </div>
      <footer className={styles.catalogNote}>
        <strong>{adaptiveBlockCatalog.length} registered blocks</strong>
        <span>Rules are guardrails · components are vocabulary · interactions are feedback</span>
      </footer>
    </section>
  );
}
