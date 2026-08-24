"use client";

import { useState } from "react";
import { requestP3Composition } from "./clientComposer";
import { createP3InitialLearnerState } from "./composer";
import { adaptiveBlockCatalogById } from "./catalog";
import type { P3ComposeResponse, P3Depth, P3Goal } from "./composerContracts";
import { resistanceSourceLesson } from "./sourceLesson";
import styles from "./prototype3.module.css";

type Props = {
  goal: P3Goal;
  depth: P3Depth;
  onBack: () => void;
  onComposed: (composition: P3ComposeResponse) => void;
};

function StaticCircuitDiagram() {
  return (
    <svg className={styles.textbookCircuit} viewBox="0 0 800 260" role="img" aria-label="A conventional diagram of a 9 volt circuit with a resistor and lamp">
      <path d="M118 54h220m212 0h138v152H118V54" />
      <path d="M338 54l24-24 28 48 28-48 28 48 28-48 28 48 48-24" className={styles.textbookResistor} />
      <line x1="82" y1="111" x2="151" y2="111" className={styles.textbookBatteryLong} />
      <line x1="99" y1="148" x2="135" y2="148" className={styles.textbookBatteryShort} />
      <path d="M118 54v57m0 37v58" />
      <circle cx="585" cy="206" r="27" className={styles.textbookLamp} />
      <path d="m571 206 14-12 14 12-14 12z" className={styles.textbookFilament} />
      <text x="59" y="93">9 V</text>
      <text x="403" y="112">resistor</text>
      <text x="554" y="252">lamp</text>
      <text x="179" y="191" className={styles.textbookFigureNote}>closed path</text>
    </svg>
  );
}

export function TextbookLesson({
  goal,
  depth,
  onBack,
  onComposed,
}: Props) {
  const [composing, setComposing] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [compositionPreview, setCompositionPreview] = useState<P3ComposeResponse | null>(null);

  async function compose() {
    if (composing) return;
    setComposing(true);
    setStatusIndex(0);
    const timers = [
      window.setTimeout(() => setStatusIndex(1), 280),
      window.setTimeout(() => setStatusIndex(2), 620),
      window.setTimeout(() => setStatusIndex(3), 930),
    ];

    const learnerState = createP3InitialLearnerState();
    const composition = await requestP3Composition({
      phase: "initial",
      goal,
      depth,
      learnerState,
      completedBlockIds: [],
    });
    timers.forEach((timer) => window.clearTimeout(timer));
    setStatusIndex(3);
    setCompositionPreview(composition);
    await new Promise((resolve) => window.setTimeout(resolve, 4800));
    onComposed(composition);
  }

  const statuses = [
    "Reading 7 trusted facts",
    "Checking verified components",
    "Ollama composing the path",
    "Validating the blueprint",
  ];
  const goalLabel = {
    explore: "Curious",
    understand: "Understand",
    revise: "Revising",
    test: "Test preparation",
  }[goal];
  const depthLabel = { 5: "Quick look", 15: "Learn it", 30: "Go deep" }[depth];
  const selectedBlockIds = compositionPreview?.blueprint.remainingSteps.map((step) => step.blockId) ?? [];
  const formulaStep = selectedBlockIds.findIndex((id) => id === "target-current-challenge" || id === "final-circuit-design-challenge");

  return (
    <div className={`${styles.textbookStage} ${composing ? styles.textbookTransforming : ""}`}>
      <header className={styles.p3SiteHeader}>
        <div className={styles.p3Brand}><i aria-hidden="true">+</i><strong>Curiosity Lab</strong><span>Prototype 3</span></div>
        <div className={styles.fixedLessonBadge}><span>Static textbook</span><strong>Two pages · same path for every learner</strong></div>
        <button type="button" onClick={onBack}>← Change setup</button>
      </header>

      <main className={styles.textbookShell}>
        <section className={styles.textbookBookSpread} aria-label="Conventional two-page textbook lesson">
          <article className={`${styles.textbookLeaf} ${styles.textbookLeafLeft}`}>
            <div className={styles.textbookPageWave} aria-hidden="true" />
            <header className={styles.textbookUnitRibbon}>
              <span>Unit</span><b>P3</b><strong>Electricity</strong>
            </header>

            <div className={styles.textbookVerticalContent}>
              <header className={styles.textbookArrowHeading}>
                <i aria-hidden="true" />
                <div><span>Electric circuits · 3.2</span><h1>Resistance and current</h1></div>
              </header>

              <div className={styles.textbookIntroCopy}>
                <p>A resistor opposes the movement of charge through a circuit.</p>
                <p>With the battery voltage fixed, greater resistance produces a smaller current.</p>
              </div>

              <figure className={`${styles.textbookPortraitFigure} ${styles.sourceBlock}`} data-source-block="01">
                <span className={styles.sourceBlockLabel}>Source 01 · Circuit figure</span>
                <StaticCircuitDiagram />
                <figcaption><b>Figure 3.6</b> · A resistor and lamp in one closed circuit.</figcaption>
              </figure>

              <section className={`${styles.textbookRelationshipStrip} ${styles.sourceBlock}`} data-source-block="03">
                <span>Source 03 · Relationship</span>
                <div><b>Resistance</b><strong>increases</strong><i aria-hidden="true">→</i><b>Current</b><strong>decreases</strong></div>
              </section>

              <p className={styles.textbookClosingCopy}>The resistor changes how much current can flow; it does not provide the electrical push.</p>
            </div>

            <footer className={styles.textbookLeafFooter}><span>Curiosity Lab · Science</span><b>42</b></footer>
          </article>

          <article className={`${styles.textbookLeaf} ${styles.textbookLeafRight}`}>
            <div className={styles.textbookPageWave} aria-hidden="true" />
            <header className={styles.textbookUnitRibbon}>
              <span>Unit</span><b>P3</b><strong>Electricity</strong>
            </header>

            <div className={styles.textbookVerticalContent}>
              <aside className={styles.textbookKeyIdea}>
                <span>Key idea</span>
                <p>Voltage provides the push. Resistance controls how much current results.</p>
              </aside>

              <section className={`${styles.definitionSection} ${styles.sourceBlock}`} data-source-block="02">
                <header className={styles.textbookArrowHeading}>
                  <i aria-hidden="true" />
                  <div><span>Source 02</span><h2>Essential definitions</h2></div>
                </header>
                <dl>
                  <div><dt>Voltage</dt><dd>Electrical push from the battery.</dd></div>
                  <div><dt>Current</dt><dd>Charge flowing each second.</dd></div>
                  <div><dt>Resistance</dt><dd>Opposition to charge flow.</dd></div>
                </dl>
              </section>

              <section className={`${styles.textbookPortraitFormula} ${styles.sourceBlock}`} data-source-block="04">
                <span>Source 04 · Ohm&apos;s law</span>
                <div><b>Current</b><strong>I = V ÷ R</strong></div>
                <small>I in amperes · V in volts · R in ohms</small>
              </section>

              <section className={styles.textbookWorkedExample}>
                <header><span>Worked example</span><strong>9 V battery · 6 Ω resistor</strong></header>
                <div><p>Find the current flowing through the circuit.</p><strong>I = 9 ÷ 6 = 1.5 A</strong></div>
              </section>

              <section className={`${styles.textbookPortraitQuestion} ${styles.sourceBlock}`} data-source-block="05">
                <span>Source 05 · Check your understanding</span>
                <p>{resistanceSourceLesson.questions[0]}</p>
                <i aria-hidden="true" />
              </section>
            </div>

            <footer className={styles.textbookLeafFooter}><span>Two-page sequence · same for every learner</span><b>43</b></footer>
          </article>
        </section>

        <footer className={styles.transformAction}>
          <div>
            <span>Prototype demonstration</span>
            <strong>Same trusted knowledge. A different way to experience it.</strong>
          </div>
          <button type="button" onClick={compose} disabled={composing}>
            <span>{composing ? statuses[statusIndex] : "Build an interactive path"}</span><b>{composing ? "•••" : "→"}</b>
          </button>
        </footer>
      </main>

      {composing ? (
        <div className={styles.compositionOverlay} aria-live="polite">
          <header className={styles.composerPreviewHeader}>
            <div><span>AI composer · structured decision</span><strong>{compositionPreview ? "Validated learning blueprint" : statuses[statusIndex]}</strong></div>
            <small>{compositionPreview ? `${compositionPreview.source === "ollama" ? "Local Ollama AI" : "Verified fallback"} · ${compositionPreview.blueprint.remainingSteps.length} selected blocks` : "No interface code or lesson content is being generated"}</small>
          </header>

          <div className={styles.composerDecisionGrid}>
            <section className={styles.composerSourceColumn}>
              <span>Fixed source representations</span>
              <div className={styles.sourcePieceList} aria-label="Trusted textbook pieces">
                <div><b>01</b><strong>Circuit figure</strong><small>closed path · voltage</small></div>
                <div><b>02</b><strong>Concept definitions</strong><small>voltage · current · resistance</small></div>
                <div><b>03</b><strong>Relationship</strong><small>resistance up · current down</small></div>
                <div><b>04</b><strong>Ohm&apos;s law</strong><small>I = V ÷ R</small></div>
                <div><b>05</b><strong>Prediction question</strong><small>fixed voltage · doubled resistance</small></div>
              </div>
            </section>

            <div className={styles.composerFlow} aria-hidden="true"><i /><span>recompose</span><i /></div>

            <section className={styles.composerResultColumn}>
              <div className={styles.composerLearnerContext}>
                <div><span>Learner goal</span><strong>{goalLabel}</strong></div>
                <div><span>Depth</span><strong>{depthLabel}</strong></div>
              </div>
              {compositionPreview ? (
                <>
                  <span>Selected initial path</span>
                  <ol className={styles.composerSelectedPath}>
                    {compositionPreview.blueprint.remainingSteps.map((step, index) => (
                      <li key={step.blockId}>
                        <b>{String(index + 1).padStart(2, "0")}</b>
                        <div><strong>{adaptiveBlockCatalogById.get(step.blockId)?.title ?? step.blockId}</strong><small>{step.reasonCode.replaceAll("-", " ")}</small></div>
                      </li>
                    ))}
                  </ol>
                  <div className={styles.composerDelayNote}>
                    <span>Formula representation</span>
                    <strong>{formulaStep > 0 ? `Delayed until step ${formulaStep + 1}` : formulaStep === 0 ? "Used immediately" : "Not selected for this path"}</strong>
                    <small>Relationship is experienced before symbolic application.</small>
                  </div>
                </>
              ) : (
                <div className={styles.composerWaiting}>
                  <i /><i /><i />
                  <strong>Choosing only from verified components…</strong>
                  <small>Candidate filtering and blueprint validation remain deterministic.</small>
                </div>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
