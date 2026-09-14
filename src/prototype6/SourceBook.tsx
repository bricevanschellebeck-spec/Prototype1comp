"use client";

import { useEffect, useRef, useState } from "react";
import { P6Dialog } from "./P6Dialog";
import bookStyles from "./sourceBook.module.css";

type SourceControls = {
  designerLabel: string;
  designing: boolean;
  elapsed: number;
  ready: boolean;
  error: string;
  onBuild: () => void;
  onReview: () => void;
  onRetry: () => void;
};

function StaticCircuitDiagram() {
  return <svg className={bookStyles.bookCircuit} viewBox="0 0 760 300" role="img" aria-label="A static closed circuit with a 9 volt battery, resistor, and lamp">
    <path className={bookStyles.bookWire} d="M128 67h190m236 0h92v160H128V67"/>
    <path className={bookStyles.bookResistor} d="m318 67 25-26 28 52 30-52 29 52 30-52 29 52 65-26"/>
    <path className={bookStyles.bookWire} d="M128 67v62m0 49v49"/>
    <line className={bookStyles.bookBatteryLong} x1="88" y1="129" x2="168" y2="129"/>
    <line className={bookStyles.bookBatteryShort} x1="104" y1="178" x2="151" y2="178"/>
    <circle className={bookStyles.bookLamp} cx="555" cy="227" r="31"/>
    <path className={bookStyles.bookFilament} d="m539 227 16-15 17 15-17 15z"/>
    <path className={bookStyles.bookCurrentArrow} d="M215 227h92m-15-12 15 12-15 12"/>
    <g className={bookStyles.bookDirectLabel}><path d="M77 93 111 122"/><text x="20" y="78"><tspan>VOLTAGE</tspan><tspan x="20" dy="19">9 V battery</tspan></text></g>
    <g className={bookStyles.bookDirectLabel}><path d="M463 119 444 86"/><text x="438" y="143"><tspan>RESISTANCE</tspan><tspan x="438" dy="19">opposes flow</tspan></text></g>
    <g className={bookStyles.bookDirectLabel}><path d="M323 264 306 237"/><text x="325" y="279"><tspan>CURRENT</tspan><tspan dx="7">charge moving</tspan></text></g>
    <text className={bookStyles.bookLampLabel} x="585" y="270">lamp</text>
  </svg>;
}

function StaticGraph() {
  return <svg className={bookStyles.bookGraph} viewBox="0 0 480 205" role="img" aria-label="A static graph showing current falling as resistance increases">
    <path className={bookStyles.graphAxis} d="M52 18v150h394M52 168l-7-8m7 8-7 8M446 168l-8-7m8 7-8 7"/>
    <path className={bookStyles.graphCurve} d="M80 43C130 73 166 97 218 116c65 24 134 31 202 37"/>
    {[[88,51],[137,78],[216,111],[326,137],[410,150]].map(([x,y]) => <circle key={x} cx={x} cy={y} r="6"/>)}
    <text x="10" y="22">current</text><text x="369" y="195">resistance</text><text className={bookStyles.graphNote} x="252" y="55">fixed 9 V</text>
  </svg>;
}

export function SourcePages({ modal = false, controls }: { modal?: boolean; controls?: SourceControls }) {
  const [page, setPage] = useState<1 | 2>(1);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => { stageRef.current?.focus(); }, []);
  function turn(nextPage: 1 | 2) { if (nextPage === page) return; setDirection(nextPage > page ? "next" : "previous"); setPage(nextPage); }

  return <div ref={stageRef} className={`${bookStyles.paperStage} ${modal ? bookStyles.modalPaperStage : ""}`} tabIndex={-1} onKeyDown={(event) => { if (event.key === "ArrowRight") turn(2); if (event.key === "ArrowLeft") turn(1); }}>
    <article key={page} className={`${bookStyles.textbookPage} ${direction === "next" ? bookStyles.pageEnterNext : bookStyles.pageEnterPrevious} ${modal ? bookStyles.modalPage : ""}`}>
      {page === 1 ? <>
        <header className={bookStyles.pageHeader}><div><span>Electric circuits · Resistance</span><h1>How resistance affects current</h1><p>A resistor changes how much current can move through a circuit.</p></div><strong>Page 1 / 2</strong></header>
        <div className={bookStyles.pageOneBody}>
          <figure className={bookStyles.bookFigure}><StaticCircuitDiagram/><figcaption><b>Figure 1.</b> A closed circuit with a battery, resistor, and lamp.</figcaption></figure>
          <aside className={bookStyles.directDefinitions}><section><b>Voltage</b><p>Push from the battery.</p></section><section><b>Current</b><p>Charge moving each second.</p></section><section><b>Resistance</b><p>Opposition to flow.</p></section></aside>
        </div>
        <section className={bookStyles.relationshipComparison}><div><small>Resistance</small><strong>4 Ω</strong><span>Current</span><b>2.25 A</b></div><i aria-hidden="true">→</i><div><small>Resistance</small><strong>8 Ω</strong><span>Current</span><b>1.13 A</b></div><p><span>More resistance</span><i>→</i><strong>less current</strong></p></section>
        <footer className={bookStyles.pageNavigation}><span>Same information. Already arranged.</span><button type="button" onClick={() => turn(2)}>Next page <b>→</b></button></footer>
      </> : <>
        <header className={bookStyles.pageHeader}><div><span>Using the relationship</span><h1>From a pattern to a rule</h1><p>The equation describes the same change shown by the circuit.</p></div><strong>Page 2 / 2</strong></header>
        <div className={bookStyles.pageTwoTop}>
          <section className={bookStyles.formulaPanel}><span>Current = voltage ÷ resistance</span><h2>I = V ÷ R</h2><dl><div><dt>I</dt><dd>current</dd></div><div><dt>V</dt><dd>voltage</dd></div><div><dt>R</dt><dd>resistance</dd></div></dl></section>
          <figure className={bookStyles.staticGraphPanel}><StaticGraph/><figcaption><b>Figure 2.</b> At fixed voltage, current falls as resistance rises.</figcaption></figure>
        </div>
        <section className={bookStyles.workedExample}><div><span>Worked example</span><p>A 9 V battery is connected to a 6 Ω resistor.</p></div><strong>9 V ÷ 6 Ω = 1.5 A</strong></section>
        <section className={bookStyles.predictionQuestion}><span>Predict</span><p>If resistance doubles while voltage stays fixed, what happens to current?</p><small>The printed page can ask—but it cannot rearrange itself around your answer.</small></section>
        <footer className={bookStyles.pageNavigation}>
          <button className={bookStyles.previousPage} type="button" onClick={() => turn(1)}>← Previous</button>
          {controls ? <div className={bookStyles.designReadout} data-ready={controls.ready} data-error={Boolean(controls.error)}><small>{controls.error ? "AI design needs attention" : controls.designing ? `${controls.designerLabel} is designing · ${controls.elapsed}s` : controls.ready ? "Autonomous design validated" : "Waiting for the assembler"}</small><span>Same trusted knowledge. A different experience.</span></div> : <div><small>Textbook reference</small><span>Your lesson remains open underneath.</span></div>}
          {controls ? <div className={bookStyles.actionGroup}>{controls.error ? <button type="button" className={bookStyles.reviewButton} onClick={controls.onRetry}>Retry</button> : <button type="button" className={bookStyles.reviewButton} disabled={!controls.ready} onClick={controls.onReview}>Review AI decisions</button>}<button type="button" className={bookStyles.buildPathButton} disabled={!controls.ready} onClick={controls.onBuild}>{controls.designing ? "Designing…" : "Build my interactive lesson"}<b>→</b></button></div> : null}
        </footer>
        {controls?.error ? <p className={bookStyles.designError} role="alert">{controls.error}</p> : null}
      </>}
    </article>
  </div>;
}

export function SourceBook(props: SourceControls & { onBack: () => void }) {
  return <main className={bookStyles.sourceStage}>
    <header className={bookStyles.siteHeader}>
      <div className={bookStyles.brand}><i aria-hidden="true">+</i><strong>Curiosity Lab</strong><span>Prototype 6</span></div>
      <div className={bookStyles.fixedLessonBadge}><span>Before autonomous assembly</span><strong>One fixed arrangement for every learner</strong></div>
      <button type="button" onClick={props.onBack}>← Change setup</button>
    </header>
    <SourcePages controls={props}/>
  </main>;
}

export function SourcePopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <P6Dialog open={open} onClose={onClose} title="Trusted textbook source" wide><SourcePages modal/></P6Dialog>;
}
