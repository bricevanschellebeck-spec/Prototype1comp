"use client";

import { useMemo, useState } from "react";
import { ComparisonPaths, MeasurementGraph, WorkspaceCircuit } from "./AdaptiveBlocks";
import {
  type WorkspaceBlockId,
  workspaceBlockCatalogById,
} from "./catalog";
import { requestP3Composition } from "./clientComposer";
import { createP3InitialLearnerState } from "./composer";
import type {
  P3ComposeResponse,
  P3Depth,
  P3Goal,
  P3LessonBlueprint,
} from "./composerContracts";
import { MORE_RESISTANCE_MORE_CURRENT } from "./curriculum";
import type { BlockOutcome, LearnerState, WorkspaceMeasurement } from "./domain";
import { updateLearnerState } from "./engine";
import { TextbookLesson } from "./TextbookLesson";
import styles from "./prototype3.module.css";

type Props = {
  goal: P3Goal;
  depth: P3Depth;
  goalLabel: string;
  depthLabel: string;
  initialComposition: P3ComposeResponse;
  onAdjust: () => void;
};

type ComposedStep = P3LessonBlueprint["remainingSteps"][number] & {
  outcome?: BlockOutcome;
};

type Session = {
  learner: LearnerState;
  steps: ComposedStep[];
  composition: P3ComposeResponse;
};

function createSession(composition: P3ComposeResponse): Session {
  return {
    learner: createP3InitialLearnerState(),
    steps: composition.blueprint.remainingSteps.map((step) => ({ ...step })),
    composition,
  };
}

function outcomeFor(
  blockId: WorkspaceBlockId,
  evidence: Omit<BlockOutcome, "blockId" | "objectiveIds" | "completed">,
): BlockOutcome {
  const block = workspaceBlockCatalogById.get(blockId);
  if (!block) throw new Error(`Unknown block ${blockId}`);
  return {
    blockId,
    objectiveIds: block.objectiveIds,
    completed: true,
    ...evidence,
  };
}

const reasonLabels: Record<P3LessonBlueprint["remainingSteps"][number]["reasonCode"], string> = {
  "elicit-existing-model": "Collect evidence before explaining",
  "test-through-manipulation": "Turn the fixed diagram into an experiment",
  "offer-alternate-representation": "Represent the same idea another way",
  "respond-to-misconception": "Insert support because of the learner's answer",
  "connect-observation-to-symbols": "Reveal symbols after observable results",
  "increase-challenge": "Move quickly into application",
  "confirm-transfer": "Check whether the idea transfers",
};

export function AdaptiveLesson({
  goal,
  depth,
  goalLabel,
  depthLabel,
  initialComposition,
  onAdjust,
}: Props) {
  const [session, setSession] = useState<Session>(() => createSession(initialComposition));
  const [resistance, setResistance] = useState(4);
  const [prediction, setPrediction] = useState<"increase" | "decrease" | "same" | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [measurements, setMeasurements] = useState<WorkspaceMeasurement[]>([]);
  const [retryChoice, setRetryChoice] = useState<"more" | "less" | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [formulaRevealed, setFormulaRevealed] = useState(false);
  const [targetAttempts, setTargetAttempts] = useState(0);
  const [transferAttempts, setTransferAttempts] = useState(0);
  const [showTrace, setShowTrace] = useState(false);
  const [showTextbook, setShowTextbook] = useState(false);
  const [composing, setComposing] = useState(false);
  const [pathChanged, setPathChanged] = useState(false);

  const activeIndex = session.steps.findIndex((step) => !step.outcome);
  const activeStep = activeIndex >= 0 ? session.steps[activeIndex] : undefined;
  const activeId = activeStep?.blockId as WorkspaceBlockId | undefined;
  const activeBlock = activeId ? workspaceBlockCatalogById.get(activeId) : undefined;
  const current = 9 / resistance;
  const isComplete = !composing && session.steps.length > 0 && activeIndex < 0;
  const completedIds = useMemo(
    () => new Set(session.steps.filter((step) => step.outcome).map((step) => step.blockId)),
    [session.steps],
  );
  const formulaVisible =
    formulaRevealed ||
    activeId === "formula-from-measurements" ||
    completedIds.has("formula-from-measurements");

  async function recordOutcome(outcome: BlockOutcome) {
    if (!activeStep || activeStep.outcome || activeStep.blockId !== outcome.blockId || composing) return;
    const learner = updateLearnerState(session.learner, outcome);
    const completed = session.steps.map((step, index) =>
      index === activeIndex ? { ...step, outcome } : step,
    );

    if (outcome.blockId !== "predict-resistance-change") {
      setSession({ ...session, learner, steps: completed });
      return;
    }

    const completedPrefix = completed.slice(0, activeIndex + 1);
    setComposing(true);
    setPathChanged(false);
    setSession({ ...session, learner, steps: completedPrefix });
    const composition = await requestP3Composition({
      phase: "adapt",
      goal,
      depth,
      learnerState: learner,
      completedBlockIds: completedPrefix.map((step) => step.blockId),
      lastOutcome: outcome,
    });
    setSession({
      learner,
      composition,
      steps: [...completedPrefix, ...composition.blueprint.remainingSteps.map((step) => ({ ...step }))],
    });
    setComposing(false);
    setPathChanged(true);
    window.setTimeout(() => setPathChanged(false), 2200);
  }

  function addMeasurement(value: number) {
    setResistance(value);
    setMeasurements((currentMeasurements) => {
      if (currentMeasurements.some((item) => item.resistance === value)) return currentMeasurements;
      return [...currentMeasurements, { resistance: value, current: 9 / value }];
    });
  }

  function completeSimple(blockId: WorkspaceBlockId, correct = true, attempts = 1) {
    void recordOutcome(outcomeFor(blockId, {
      correct,
      attempts,
      hintUsed: false,
      misconceptionIds: [],
    }));
  }

  function selectTarget(value: number, transfer = false) {
    setResistance(value);
    const expected = 6;
    if (transfer) {
      const attempts = transferAttempts + 1;
      setTransferAttempts(attempts);
      if (value === expected) completeSimple("design-transfer-circuit", true, attempts);
      return;
    }
    const attempts = targetAttempts + 1;
    setTargetAttempts(attempts);
    if (value === expected) completeSimple("reach-target-current", true, attempts);
  }

  function activeControl() {
    if (!activeId || !activeBlock) return null;
    if (activeId === "predict-resistance-change") {
      return (
        <div className={styles.actionPanel}>
          <span className={styles.actionLabel}>Start here · predict</span>
          <h3>Resistance rises. What happens to current?</h3>
          <div className={styles.predictionChoices}>
            {([
              ["increase", "↑", "Increases"],
              ["decrease", "↓", "Decreases"],
              ["same", "=", "Stays same"],
            ] as const).map(([value, symbol, label]) => (
              <button key={value} type="button" className={prediction === value ? styles.choiceActive : ""} onClick={() => setPrediction(value)}>
                <b>{symbol}</b><span>{label}</span>
              </button>
            ))}
          </div>
          <button
            className={styles.primaryAction}
            type="button"
            disabled={!prediction}
            onClick={() => {
              const correct = prediction === "decrease";
              void recordOutcome(outcomeFor(activeId, {
                correct,
                attempts: 1,
                hintUsed,
                misconceptionIds: correct ? [] : [MORE_RESISTANCE_MORE_CURRENT],
              }));
            }}
          >
            Commit prediction →
          </button>
          <button className={styles.hintAction} type="button" onClick={() => setHintUsed(true)}>
            {hintUsed ? "The battery stays fixed; only the opposition changes." : "Need one clue?"}
          </button>
        </div>
      );
    }

    if (activeId === "manipulate-resistance") {
      return (
        <div className={styles.actionPanel}>
          <span className={styles.actionLabel}>Now test it</span>
          <h3>Move the resistor control.</h3>
          <label className={styles.resistanceSlider}>
            <span>Resistance <b>{resistance} Ω</b></span>
            <input type="range" min="3" max="12" step="1" value={resistance} onChange={(event) => setResistance(Number(event.target.value))} />
          </label>
          <p className={styles.liveObservation}>At {resistance} Ω, the circuit carries <strong>{current.toFixed(2)} A</strong>.</p>
          <button className={styles.primaryAction} type="button" disabled={resistance === 4} onClick={() => completeSimple(activeId)}>Keep this observation →</button>
        </div>
      );
    }

    if (activeId === "generate-current-graph") {
      return (
        <div className={styles.actionPanel}>
          <span className={styles.actionLabel}>Create the evidence</span>
          <h3>Test three resistors.</h3>
          <div className={styles.resistorButtons}>
            {[3, 6, 9].map((value) => (
              <button key={value} type="button" className={measurements.some((item) => item.resistance === value) ? styles.choiceActive : ""} onClick={() => addMeasurement(value)}>
                {value} Ω
              </button>
            ))}
          </div>
          <p className={styles.liveObservation}>{measurements.length} / 3 points measured</p>
          <button className={styles.primaryAction} type="button" disabled={measurements.length < 3} onClick={() => completeSimple(activeId)}>Use the graph →</button>
        </div>
      );
    }

    if (activeId === "compare-current-paths") {
      return (
        <div className={styles.actionPanel}>
          <span className={styles.actionLabel}>Evidence changed the path</span>
          <h3>Compare equal voltage.</h3>
          <p>Only resistance changes. The longer current bar belongs to the easier path.</p>
          <button className={styles.primaryAction} type="button" onClick={() => completeSimple(activeId)}>I see the difference →</button>
        </div>
      );
    }

    if (activeId === "guided-resistance-retry") {
      return (
        <div className={styles.actionPanel}>
          <span className={styles.actionLabel}>Guided retry</span>
          <h3>At 9 V, which path carries less current?</h3>
          <div className={styles.retryChoices}>
            <button type="button" onClick={() => setRetryChoice("more")}>3 Ω path</button>
            <button type="button" onClick={() => setRetryChoice("less")}>9 Ω path</button>
          </div>
          {retryAttempts > 0 && retryChoice === "more" ? <p className={styles.correction}>Look at the shorter current bar, then try again.</p> : null}
          <button
            className={styles.primaryAction}
            type="button"
            disabled={!retryChoice}
            onClick={() => {
              const attempts = retryAttempts + 1;
              setRetryAttempts(attempts);
              if (retryChoice === "less") completeSimple(activeId, true, attempts);
            }}
          >
            Test this answer →
          </button>
        </div>
      );
    }

    if (activeId === "formula-from-measurements") {
      return (
        <div className={styles.actionPanel}>
          <span className={styles.actionLabel}>Symbols, after experience</span>
          <h3>Your values follow one rule.</h3>
          {!formulaRevealed ? (
            <button className={styles.revealFormula} type="button" onClick={() => setFormulaRevealed(true)}>Reveal the relationship</button>
          ) : (
            <>
              <div className={styles.formulaReveal}><span>current</span><strong>I = V ÷ R</strong><small>{(measurements.at(-1)?.current ?? current).toFixed(2)} A = 9 V ÷ {measurements.at(-1)?.resistance ?? resistance} Ω</small></div>
              <button className={styles.primaryAction} type="button" onClick={() => completeSimple(activeId)}>Apply it →</button>
            </>
          )}
        </div>
      );
    }

    if (activeId === "reach-target-current") {
      return (
        <div className={styles.actionPanel}>
          <span className={styles.actionLabel}>Application</span>
          <h3>Make the meter read 1.50 A.</h3>
          <p>Battery: 9 V. Choose a resistor.</p>
          <div className={styles.resistorButtons}>
            {[3, 6, 9, 12].map((value) => <button key={value} type="button" onClick={() => selectTarget(value)}>{value} Ω</button>)}
          </div>
          {targetAttempts > 0 && resistance !== 6 ? <p className={styles.correction}>{current.toFixed(2)} A is not the target. Adjust the resistor.</p> : null}
        </div>
      );
    }

    return (
      <div className={styles.actionPanel}>
        <span className={styles.actionLabel}>Transfer</span>
        <h3>Build 2.00 A from a 12 V battery.</h3>
        <p>The circuit has changed; the relationship has not.</p>
        <div className={styles.resistorButtons}>
          {[2, 4, 6, 12].map((value) => <button key={value} type="button" onClick={() => selectTarget(value, true)}>{value} Ω</button>)}
        </div>
        {transferAttempts > 0 && resistance !== 6 ? <p className={styles.correction}>That gives {(12 / resistance).toFixed(2)} A. Try another resistor.</p> : null}
      </div>
    );
  }

  const showGraph = activeId === "generate-current-graph" || completedIds.has("generate-current-graph");
  const showComparison = activeId === "compare-current-paths" || activeId === "guided-resistance-retry";
  const latestEvidence = session.learner.lastOutcome;

  return (
    <section className={styles.workspace} aria-label="AI-assembled persistent learning workspace">
      <header className={styles.workspaceHeader}>
        <div>
          <span>Assembled for this learner</span>
          <h1>How resistance changes current</h1>
        </div>
        <div className={styles.workspaceContext}>
          <span>{goalLabel} · {depthLabel}</span>
          <button type="button" onClick={() => setShowTextbook(true)}>Textbook</button>
          <button type="button" onClick={() => setShowTrace(true)}>View composition</button>
          <button type="button" onClick={onAdjust}>Adjust</button>
        </div>
      </header>

      <div className={styles.singleProgress}>
        <div><b>{isComplete ? "✓" : String(Math.max(1, activeIndex + 1)).padStart(2, "0")}</b><span>{isComplete ? "Path complete" : activeBlock?.title}</span></div>
        <ol aria-label="Composed learning path">
          {session.steps.map((step, index) => (
            <li key={`${step.blockId}-${index}`} className={step.outcome ? styles.progressDone : index === activeIndex ? styles.progressActive : ""}>
              <i /><span>{workspaceBlockCatalogById.get(step.blockId as WorkspaceBlockId)?.title}</span>
            </li>
          ))}
        </ol>
        <small>{session.steps.filter((step) => step.outcome).length} / {session.steps.length} evidence blocks</small>
      </div>

      <main className={`${styles.workspaceBody} ${pathChanged ? styles.pathChanged : ""}`}>
        <aside className={styles.workspaceActions}>
          {activeControl()}
          {composing ? (
            <div className={styles.recomposeNotice} aria-live="polite"><i /><span>Evidence received</span><strong>Recomposing what comes next…</strong></div>
          ) : null}
          {pathChanged ? <div className={styles.pathChangedNotice}>The unfinished workspace changed.</div> : null}
        </aside>

        <section className={styles.circuitStage}>
          <div className={styles.liveStageLabel}><span>Persistent live circuit</span><strong>{activeBlock?.shortPrompt ?? "The path is complete."}</strong></div>
          <WorkspaceCircuit
            voltage={activeId === "design-transfer-circuit" ? 12 : 9}
            resistance={resistance}
            current={activeId === "design-transfer-circuit" ? 12 / resistance : current}
            active={!composing}
          />
          {activeId === "manipulate-resistance" ? (
            <label className={styles.attachedSlider}>
              <span>Resistance</span>
              <input type="range" min="3" max="12" value={resistance} onChange={(event) => setResistance(Number(event.target.value))} />
              <b>{resistance} Ω</b>
            </label>
          ) : null}
        </section>

        <aside className={styles.workspaceRepresentation}>
          <header><span>Representation</span><strong>{showComparison ? "Two current paths" : showGraph ? "Your measured graph" : formulaVisible ? "Observed relationship" : "Live evidence"}</strong></header>
          {showComparison ? <ComparisonPaths /> : null}
          {showGraph ? <MeasurementGraph measurements={measurements.length ? measurements : [{ resistance: 3, current: 3 }, { resistance: 6, current: 1.5 }, { resistance: 9, current: 1 }]} /> : null}
          {formulaVisible ? <div className={styles.sideFormula}><span>From your measurements</span><strong>I = V ÷ R</strong><small>Current changes because resistance changes—not because the battery changed.</small></div> : null}
          {!showComparison && !showGraph && !formulaVisible ? (
            <div className={styles.evidenceMeter}>
              <span>Fixed source</span><strong>9 V</strong>
              <span>Live current</span><strong>{current.toFixed(2)} A</strong>
              <small>Formula held back until the circuit produces evidence.</small>
            </div>
          ) : null}
        </aside>

        {isComplete ? (
          <div className={styles.workspaceComplete}>
            <span>Path complete</span>
            <h2>The page became an environment you could test.</h2>
            <p>Your answer changed what appeared next. Every representation still came from the same trusted textbook blocks.</p>
            <button type="button" onClick={() => setShowTextbook(true)}>Compare with the textbook →</button>
          </div>
        ) : null}
      </main>

      {showTrace ? (
        <aside className={styles.composerDrawer} aria-label="Composition details">
          <header><div><span>Constrained composition</span><strong>Real blueprint · no generated UI code</strong></div><button type="button" onClick={() => setShowTrace(false)}>×</button></header>
          <section><span>Composer</span><strong>{session.composition.source === "ollama" ? "Local Ollama" : "Deterministic fallback"}</strong><small>{session.composition.model ?? session.composition.fallbackReason}</small></section>
          <section><span>Preserved source</span><strong>{session.composition.blueprint.preserveSourceBlockIds.join(" · ")}</strong></section>
          <section><span>Delayed source</span><strong>{session.composition.blueprint.delaySourceBlockIds.join(" · ") || "none"}</strong></section>
          <section>
            <span>Selected representations</span>
            <ol>{session.composition.blueprint.remainingSteps.map((step) => <li key={step.blockId}><b>{workspaceBlockCatalogById.get(step.blockId as WorkspaceBlockId)?.title}</b><small>{reasonLabels[step.reasonCode]}</small></li>)}</ol>
          </section>
          <section><span>Latest evidence</span><strong>{latestEvidence ? latestEvidence.correct === false ? "Misconception detected" : "Completed" : "Waiting for interaction"}</strong></section>
          <footer>{session.composition.blueprint.compositionSummary}</footer>
        </aside>
      ) : null}

      {showTextbook ? (
        <TextbookLesson
          goal={goal}
          depth={depth}
          referenceMode
          onBack={() => setShowTextbook(false)}
          onComposed={() => undefined}
        />
      ) : null}
    </section>
  );
}
