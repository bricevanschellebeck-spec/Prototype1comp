"use client";

import { useEffect, useRef, useState } from "react";
import { requestP3Composition } from "./clientComposer";
import { createP3InitialLearnerState } from "./composer";
import { workspaceBlockCatalogById } from "./catalog";
import type { P3ComposeResponse, P3Depth, P3Goal } from "./composerContracts";
import { resistanceSourceLesson } from "./sourceLesson";
import styles from "./prototype3.module.css";

type Props = {
  goal: P3Goal;
  depth: P3Depth;
  onBack: () => void;
  onComposed: (composition: P3ComposeResponse) => void;
  referenceMode?: boolean;
};

function StaticCircuitDiagram() {
  return (
    <svg className={styles.bookCircuit} viewBox="0 0 760 300" role="img" aria-label="A static closed circuit with a 9 volt battery, resistor, and lamp">
      <path className={styles.bookWire} d="M128 67h190m236 0h92v160H128V67" />
      <path className={styles.bookResistor} d="m318 67 25-26 28 52 30-52 29 52 30-52 29 52 65-26" />
      <path className={styles.bookWire} d="M128 67v62m0 49v49" />
      <line className={styles.bookBatteryLong} x1="88" y1="129" x2="168" y2="129" />
      <line className={styles.bookBatteryShort} x1="104" y1="178" x2="151" y2="178" />
      <circle className={styles.bookLamp} cx="555" cy="227" r="31" />
      <path className={styles.bookFilament} d="m539 227 16-15 17 15-17 15z" />
      <path className={styles.bookCurrentArrow} d="M215 227h92m-15-12 15 12-15 12" />

      <g className={styles.bookDirectLabel}>
        <path d="M77 93 111 122" />
        <text x="20" y="78"><tspan>VOLTAGE</tspan><tspan x="20" dy="19">9 V battery</tspan></text>
      </g>
      <g className={styles.bookDirectLabel}>
        <path d="M463 119 444 86" />
        <text x="438" y="143"><tspan>RESISTANCE</tspan><tspan x="438" dy="19">opposes flow</tspan></text>
      </g>
      <g className={styles.bookDirectLabel}>
        <path d="M323 264 306 237" />
        <text x="325" y="279"><tspan>CURRENT</tspan><tspan dx="7">charge moving</tspan></text>
      </g>
      <text className={styles.bookLampLabel} x="585" y="270">lamp</text>
    </svg>
  );
}

function StaticGraph() {
  const points = [
    [88, 51],
    [137, 78],
    [216, 111],
    [326, 137],
    [410, 150],
  ];
  return (
    <svg className={styles.bookGraph} viewBox="0 0 480 205" role="img" aria-label="A static graph showing current falling as resistance increases">
      <path className={styles.graphAxis} d="M52 18v150h394M52 168l-7-8m7 8-7 8M446 168l-8-7m8 7-8 7" />
      <path className={styles.graphCurve} d="M80 43C130 73 166 97 218 116c65 24 134 31 202 37" />
      {points.map(([x, y]) => <circle key={x} cx={x} cy={y} r="6" />)}
      <text x="10" y="22">current</text>
      <text x="369" y="195">resistance</text>
      <text className={styles.graphNote} x="252" y="55">fixed 9 V</text>
    </svg>
  );
}

export function TextbookLesson({
  goal,
  depth,
  onBack,
  onComposed,
  referenceMode = false,
}: Props) {
  const [page, setPage] = useState<1 | 2>(1);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const [composing, setComposing] = useState(false);
  const [composition, setComposition] = useState<P3ComposeResponse | null>(null);
  const [status, setStatus] = useState("Selecting approved representations");
  const stageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    stageRef.current?.focus();
  }, []);

  function turn(nextPage: 1 | 2) {
    if (nextPage === page || composing) return;
    setDirection(nextPage > page ? "next" : "previous");
    setPage(nextPage);
  }

  async function compose() {
    if (composing) return;
    setComposing(true);
    setStatus("Selecting approved representations");
    const learnerState = createP3InitialLearnerState();
    const nextComposition = await requestP3Composition({
      phase: "initial",
      goal,
      depth,
      learnerState,
      completedBlockIds: [],
    });
    setComposition(nextComposition);
    setStatus("Mapping textbook blocks into the workspace");
    window.setTimeout(() => {
      setStatus("Blueprint validated");
      window.setTimeout(() => onComposed(nextComposition), 620);
    }, 760);
  }

  const selected = new Set(composition?.blueprint.remainingSteps.map((step) => step.blockId) ?? []);
  const selectedSourceIds = new Set(
    [...selected].flatMap((id) => workspaceBlockCatalogById.get(id as never)?.sourceBlockIds ?? []),
  );
  const delayed = new Set(composition?.blueprint.delaySourceBlockIds ?? []);

  function sourceClass(id: string) {
    if (!composition) return "";
    if (delayed.has(id)) return styles.sourceDelayed;
    if (selectedSourceIds.has(id as never)) return styles.sourceSelected;
    return styles.sourceQuiet;
  }

  return (
    <section
      ref={stageRef}
      className={`${styles.textbookStage} ${referenceMode ? styles.textbookModalStage : ""}`}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") turn(2);
        if (event.key === "ArrowLeft") turn(1);
      }}
      aria-label="Two-page static textbook lesson"
    >
      <header className={styles.p3SiteHeader}>
        <div className={styles.p3Brand}><i aria-hidden="true">+</i><strong>Curiosity Lab</strong><span>Prototype 3</span></div>
        <div className={styles.fixedLessonBadge}>
          <span>{referenceMode ? "Textbook reference" : "Before composition"}</span>
          <strong>{referenceMode ? "Your interactive workspace remains open underneath" : "One fixed arrangement for every learner"}</strong>
        </div>
        <button type="button" onClick={onBack}>{referenceMode ? "Close textbook ×" : "← Change setup"}</button>
      </header>

      <main className={styles.paperStage}>
        {referenceMode ? (
          <button className={styles.modalCloseButton} type="button" onClick={onBack}>
            Close textbook <b>×</b>
          </button>
        ) : null}
        <article
          key={page}
          className={`${styles.textbookPage} ${direction === "next" ? styles.pageEnterNext : styles.pageEnterPrevious} ${composing ? styles.pageComposing : ""}`}
        >
          {page === 1 ? (
            <>
              <header className={styles.pageHeader}>
                <div><span>Electric circuits · Resistance</span><h1>How resistance affects current</h1><p>A resistor changes how much current can move through a circuit.</p></div>
                <strong>Page 1 / 2</strong>
              </header>

              <div className={styles.pageOneBody}>
                <figure className={`${styles.bookFigure} ${sourceClass("circuit-figure")}`} data-source-block="circuit-figure">
                  <StaticCircuitDiagram />
                  <figcaption><b>Figure 1.</b> A closed circuit with a battery, resistor, and lamp.</figcaption>
                </figure>
                <aside className={styles.directDefinitions}>
                  <section className={sourceClass("concept-voltage")} data-source-block="concept-voltage"><b>Voltage</b><p>Push from the battery.</p></section>
                  <section className={sourceClass("concept-current")} data-source-block="concept-current"><b>Current</b><p>Charge moving each second.</p></section>
                  <section className={sourceClass("concept-resistance")} data-source-block="concept-resistance"><b>Resistance</b><p>Opposition to flow.</p></section>
                </aside>
              </div>

              <section className={`${styles.relationshipComparison} ${sourceClass("relationship-comparison")}`} data-source-block="relationship-comparison">
                <div><small>Resistance</small><strong>4 Ω</strong><span>Current</span><b>2.25 A</b></div>
                <i aria-hidden="true">→</i>
                <div><small>Resistance</small><strong>8 Ω</strong><span>Current</span><b>1.13 A</b></div>
                <p><span>More resistance</span><i>→</i><strong>less current</strong></p>
              </section>

              <footer className={styles.pageNavigation}>
                <span>Same information. Already arranged.</span>
                <button type="button" onClick={() => turn(2)}>Next page <b>→</b></button>
              </footer>
            </>
          ) : (
            <>
              <header className={styles.pageHeader}>
                <div><span>Using the relationship</span><h1>From a pattern to a rule</h1><p>The equation describes the same change shown by the circuit.</p></div>
                <strong>Page 2 / 2</strong>
              </header>

              <div className={styles.pageTwoTop}>
                <section className={`${styles.formulaPanel} ${sourceClass("ohms-law")}`} data-source-block="ohms-law">
                  <span>Current = voltage ÷ resistance</span>
                  <h2>I = V ÷ R</h2>
                  <dl><div><dt>I</dt><dd>current</dd></div><div><dt>V</dt><dd>voltage</dd></div><div><dt>R</dt><dd>resistance</dd></div></dl>
                </section>
                <figure className={`${styles.staticGraphPanel} ${sourceClass("static-graph")}`} data-source-block="static-graph">
                  <StaticGraph />
                  <figcaption><b>Figure 2.</b> At fixed voltage, current falls as resistance rises.</figcaption>
                </figure>
              </div>

              <section className={`${styles.workedExample} ${sourceClass("worked-example")}`} data-source-block="worked-example">
                <div><span>Worked example</span><p>A 9 V battery is connected to a 6 Ω resistor.</p></div>
                <strong>9 V ÷ 6 Ω = 1.5 A</strong>
              </section>

              <section className={`${styles.predictionQuestion} ${sourceClass("prediction-question")}`} data-source-block="prediction-question">
                <span>Predict</span>
                <p>{resistanceSourceLesson.blocks.find((block) => block.id === "prediction-question")?.fixedDisplayValues.question}</p>
                <small>The printed page can ask—but it cannot rearrange itself around your answer.</small>
              </section>

              <footer className={styles.pageNavigation}>
                <button className={styles.previousPage} type="button" onClick={() => turn(1)}>← Previous</button>
                <div><small>Same trusted knowledge.</small><span>A different way to experience it.</span></div>
                {referenceMode ? (
                  <button className={styles.buildPathButton} type="button" onClick={onBack}>
                    Close textbook <b>×</b>
                  </button>
                ) : (
                  <button className={styles.buildPathButton} type="button" onClick={compose} disabled={composing}>
                    {composing ? status : "Build my interactive path"} <b>{composing ? "···" : "→"}</b>
                  </button>
                )}
              </footer>
            </>
          )}
        </article>

        {composing ? (
          <aside className={styles.transformationRail} aria-live="polite">
            <div><span>Constrained composer</span><strong>{status}</strong></div>
            {composition ? (
              <>
                <ol>
                  {composition.blueprint.remainingSteps.map((step, index) => (
                    <li key={step.blockId}><b>{index + 1}</b><span>{workspaceBlockCatalogById.get(step.blockId as never)?.title}</span></li>
                  ))}
                </ol>
                <small>Held back: {composition.blueprint.delaySourceBlockIds.join(" · ") || "nothing"}</small>
              </>
            ) : <i aria-hidden="true" />}
          </aside>
        ) : null}
      </main>
    </section>
  );
}
