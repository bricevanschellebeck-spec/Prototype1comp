"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import { MORE_RESISTANCE_MORE_CURRENT } from "./curriculum";
import type { BlockOutcome, LearningBlock } from "./domain";
import styles from "./prototype2.module.css";

type BlockProps = {
  block: LearningBlock;
  onComplete: (outcome: BlockOutcome) => void;
};

function outcomeFor(
  block: LearningBlock,
  evidence: Partial<Omit<BlockOutcome, "blockId" | "objectiveIds" | "completed">> = {},
): BlockOutcome {
  return {
    blockId: block.id,
    objectiveIds: block.objectiveIds,
    completed: true,
    attempts: evidence.attempts ?? 1,
    hintUsed: evidence.hintUsed ?? false,
    misconceptionIds: evidence.misconceptionIds ?? [],
    ...(evidence.correct === undefined ? {} : { correct: evidence.correct }),
  };
}

function BlockHeader({ block, prompt }: { block: LearningBlock; prompt: string }) {
  return (
    <header className={styles.blockHeader}>
      <div>
        <span>{block.purpose} · {block.estimatedMinutes} min</span>
        <h2>{block.title}</h2>
      </div>
      <p>{prompt}</p>
    </header>
  );
}

function ContinueButton({ onClick, label = "Continue through the path" }: { onClick: () => void; label?: string }) {
  return (
    <button className={styles.continueButton} type="button" onClick={onClick}>
      <span>{label}</span><b aria-hidden="true">→</b>
    </button>
  );
}

function CircuitSvg({ closed, voltage = 9, current = 1.5 }: { closed: boolean; voltage?: number; current?: number }) {
  const speed = `${Math.max(0.7, 2.8 - current * 0.45)}s`;
  const powered = closed && voltage > 0;
  return (
    <svg className={styles.circuitSvg} viewBox="0 0 720 310" role="img" aria-label={closed ? "A complete circuit with current flowing" : "An open circuit with no current"}>
      <path className={styles.wire} d="M115 70H280m145 0h181v180H115V70" />
      <line className={styles.batteryLong} x1="84" y1="132" x2="146" y2="132" />
      <line className={styles.batteryShort} x1="99" y1="172" x2="131" y2="172" />
      <path className={styles.wire} d="M115 70v62m0 40v78" />
      <circle className={styles.switchContact} cx="292" cy="70" r="8" />
      <circle className={styles.switchContact} cx="413" cy="70" r="8" />
      <line className={styles.switchLever} x1="292" y1="70" x2="413" y2={closed ? "70" : "27"} />
      <circle className={styles.bulbGlow} cx="520" cy="250" r="34" style={{ opacity: powered ? 0.72 : 0.04 }} />
      <circle className={styles.bulb} cx="520" cy="250" r="22" />
      <path className={styles.filament} d="m508 250 12-10 12 10-12 10z" />
      {powered ? <path className={styles.flow} style={{ animationDuration: speed }} d="M175 250h220" /> : null}
      <text x="73" y="115">{voltage} V</text>
      <text x="336" y="118">switch</text>
      <text x="478" y="298">lamp</text>
    </svg>
  );
}

function ResistanceCircuitSvg({
  voltage,
  resistance,
  current,
}: {
  voltage: number;
  resistance: number;
  current: number;
}) {
  const speed = `${Math.max(0.65, Math.min(2.8, 2.65 - current * 0.42))}s`;
  return (
    <svg className={styles.resistanceCircuitSvg} viewBox="0 0 760 340" role="img" aria-label={`${voltage} volt circuit with ${resistance} ohms resistance and ${current.toFixed(2)} amps current`}>
      <path className={styles.wire} d="M125 76h170m180 0h155v205H125V76" />
      <line className={styles.batteryLong} x1="94" y1="140" x2="156" y2="140" />
      <line className={styles.batteryShort} x1="109" y1="180" x2="141" y2="180" />
      <path className={styles.wire} d="M125 76v64m0 40v101" />
      <path className={styles.resistor} d="M295 76l20-25 25 50 25-50 25 50 25-50 25 50 35-25" />
      <circle className={styles.bulbGlow} cx="540" cy="281" r="34" style={{ opacity: Math.max(0.12, Math.min(0.78, current / 3.2)) }} />
      <circle className={styles.bulb} cx="540" cy="281" r="22" />
      <path className={styles.filament} d="m528 281 12-10 12 10-12 10z" />
      <path className={styles.flow} style={{ animationDuration: speed }} d="M205 281h210" />
      <text x="79" y="120">{voltage} V</text>
      <text x="335" y="132">{resistance} Ω</text>
      <text x="250" y="320">current {current.toFixed(2)} A</text>
    </svg>
  );
}

function CompleteCircuitBlock({ block, onComplete }: BlockProps) {
  const [closed, setClosed] = useState(false);
  if (block.content.kind !== "complete-circuit") return null;
  return (
    <article className={styles.block}>
      <BlockHeader block={block} prompt="Start with the object. Find the break in the path and close it." />
      <div className={styles.modelPanel}>
        <CircuitSvg closed={closed} voltage={block.content.voltage} />
        <button className={styles.objectControl} type="button" onClick={() => setClosed((value) => !value)}>
          <small>Switch</small><strong>{closed ? "Open circuit" : "Close the gap"}</strong>
        </button>
      </div>
      <div className={`${styles.observation} ${closed ? styles.visible : ""}`} aria-live="polite">
        <span>What changed</span>
        <strong>A complete path lets charge move through every component.</strong>
        <p>The lamp did not need more electricity. It needed an unbroken route back to the battery.</p>
      </div>
      {closed ? <ContinueButton onClick={() => onComplete(outcomeFor(block))} /> : null}
    </article>
  );
}

function VoltageDiscoveryBlock({ block, onComplete }: BlockProps) {
  const [batteryPresent, setBatteryPresent] = useState(true);
  const [compared, setCompared] = useState(false);
  if (block.content.kind !== "voltage-discovery") return null;
  function toggleBattery() {
    setBatteryPresent((present) => {
      if (present) setCompared(true);
      return !present;
    });
  }
  return (
    <article className={styles.block}>
      <BlockHeader block={block} prompt="Remove one object. Watch what changes." />
      <div className={styles.conceptLearningLab}>
        <aside className={styles.conceptStack} aria-label="Circuit concepts">
          <article className={batteryPresent ? styles.conceptActive : ""}>
            <span>Voltage</span>
            <strong>{batteryPresent ? `${block.content.voltage} V` : "0 V"}</strong>
            <small>Electrical push supplied by the battery.</small>
          </article>
          <article>
            <span>Current</span>
            <strong>{batteryPresent ? "Flowing" : "Stopped"}</strong>
            <small>Movement of charge around the circuit.</small>
          </article>
          <article>
            <span>Path</span>
            <strong>Closed</strong>
            <small>The loop stays complete in both cases.</small>
          </article>
        </aside>
        <div className={styles.modelPanel}>
          <CircuitSvg closed voltage={batteryPresent ? block.content.voltage : 0} current={batteryPresent ? 1.5 : 0} />
          <button className={styles.objectControl} type="button" onClick={toggleBattery}>
            <small>Source</small><strong>{batteryPresent ? "Remove battery" : "Restore battery"}</strong>
          </button>
        </div>
      </div>
      {compared ? (
        <div className={styles.conceptConclusion}>
          <span>What the comparison revealed</span>
          <strong>The path stayed closed. Removing voltage stopped the current.</strong>
        </div>
      ) : null}
      {compared ? <ContinueButton onClick={() => onComplete(outcomeFor(block))} /> : null}
    </article>
  );
}

type Prediction = "increase" | "decrease" | "same";

function ResistanceDiagnosticBlock({ block, onComplete }: BlockProps) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [resistance, setResistance] = useState(4);
  const [tested, setTested] = useState(false);
  if (block.content.kind !== "resistance-diagnostic") return null;
  const { voltage, initialResistance, targetResistance } = block.content;
  const initialCurrent = voltage / initialResistance;
  const targetCurrent = voltage / targetResistance;

  function choosePrediction(nextPrediction: Prediction) {
    if (resolved) return;
    const nextAttempts = attempts + 1;
    const isCorrect = nextPrediction === "decrease";
    setPrediction(nextPrediction);
    setAttempts(nextAttempts);
    setCorrect(isCorrect);
    if (isCorrect || nextAttempts >= 2) setResolved(true);
  }

  function changeResistance(nextResistance: number) {
    setResistance(nextResistance);
    if (nextResistance === targetResistance) setTested(true);
  }

  const needsSupport = !correct || attempts > 1 || hintUsed;
  const liveCurrent = voltage / resistance;
  return (
    <article className={styles.block}>
      <BlockHeader block={block} prompt="Change resistance. Watch current respond." />
      <div className={styles.relationshipLab}>
        <aside className={styles.conceptStack} aria-label="Live circuit quantities">
          <article>
            <span>Voltage</span><strong>{voltage} V · fixed</strong>
            <small>The battery&apos;s electrical push.</small>
          </article>
          <article className={styles.conceptActive}>
            <span>Resistance</span><strong>{resistance} Ω</strong>
            <small>Opposition to charge flow.</small>
          </article>
          <article>
            <span>Current</span><strong>{liveCurrent.toFixed(2)} A</strong>
            <small>Charge passing each second.</small>
          </article>
          <section className={styles.embeddedPrediction}>
            <span>Before changing it</span>
            <small>Current will…</small>
            <div>
            {(["increase", "decrease", "same"] as Prediction[]).map((option) => (
              <button key={option} type="button" aria-label={`Predict current ${option}`} className={prediction === option ? styles.selected : ""} disabled={resolved} onClick={() => choosePrediction(option)}>
                {option === "increase" ? "↑" : option === "decrease" ? "↓" : "="}
              </button>
            ))}
            </div>
            {attempts > 0 && !resolved ? <em>Try one more direction.</em> : null}
            <button className={styles.hintLink} type="button" disabled={resolved} onClick={() => setHintUsed(true)}>Show a hint</button>
            {hintUsed ? <p>More opposition makes the same push less effective.</p> : null}
          </section>
        </aside>
        <section className={`${styles.circuitExperiment} ${resolved ? styles.unlocked : ""}`}>
          <ResistanceCircuitSvg voltage={voltage} resistance={resistance} current={liveCurrent} />
          <div className={styles.attachedSlider}>
            <label htmlFor={`${block.id}-slider`}><span>Resistor</span><strong>{resistance} Ω</strong></label>
            <input
              id={`${block.id}-slider`}
              type="range"
              min={initialResistance}
              max={targetResistance}
              value={resistance}
              disabled={!resolved}
              onChange={(event) => changeResistance(Number(event.target.value))}
            />
            <small>{resolved ? `Move to ${targetResistance} Ω` : "Make a tiny prediction first"}</small>
          </div>
          {tested ? <div className={styles.circuitNotice}><span>Observed</span><strong>{initialResistance} Ω → {targetResistance} Ω</strong><small>{initialCurrent.toFixed(2)} A → {targetCurrent.toFixed(2)} A</small></div> : null}
        </section>
      </div>
      {tested ? (
        <div className={styles.conceptConclusion}><span>Relationship</span><strong>More resistance · less current</strong></div>
      ) : null}
      {tested ? (
        <ContinueButton
          label="Let the engine choose what comes next"
          onClick={() => onComplete(outcomeFor(block, {
            correct,
            attempts,
            hintUsed,
            misconceptionIds: needsSupport ? [MORE_RESISTANCE_MORE_CURRENT] : [],
          }))}
        />
      ) : null}
    </article>
  );
}

function MisconceptionVisualBlock({ block, onComplete }: BlockProps) {
  const [revealed, setRevealed] = useState(false);
  if (block.content.kind !== "misconception-visual") return null;
  return (
    <article className={styles.block}>
      <BlockHeader block={block} prompt="The engine inserted a different representation before asking again." />
      <div className={styles.lanes}>
        <button type="button" className={revealed ? styles.activeLane : ""} onClick={() => setRevealed(true)}>
          <span>Same voltage</span>
          <strong>Easy path</strong>
          <div>{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</div>
          <small>Low resistance · more charge passes each second</small>
        </button>
        <button type="button" className={revealed ? styles.activeLane : ""} onClick={() => setRevealed(true)}>
          <span>Same voltage</span>
          <strong>Harder path</strong>
          <div>{Array.from({ length: 4 }, (_, index) => <i key={index} />)}</div>
          <small>High resistance · less charge passes each second</small>
        </button>
      </div>
      {revealed ? (
        <div className={`${styles.observation} ${styles.visible}`}>
          <span>Keep the cause and response separate</span>
          <strong>Resistance does not add current. It opposes the movement that voltage produces.</strong>
          <p>With the same battery, increasing opposition means fewer coulombs of charge pass each second: current decreases.</p>
        </div>
      ) : null}
      {revealed ? <ContinueButton onClick={() => onComplete(outcomeFor(block))} label="Try it with real values" /> : null}
    </article>
  );
}

function GuidedResistanceBlock({ block, onComplete }: BlockProps) {
  const [visited, setVisited] = useState<number[]>([]);
  const [resistance, setResistance] = useState<number | null>(null);
  if (block.content.kind !== "guided-resistance") return null;
  const { voltage, resistanceValues } = block.content;
  function inspect(value: number) {
    setResistance(value);
    setVisited((values) => [...new Set([...values, value])]);
  }
  const complete = visited.length === resistanceValues.length;
  return (
    <article className={styles.block}>
      <BlockHeader block={block} prompt="Change one thing at a time. The battery remains fixed at 9 V." />
      <div className={styles.guidedLab}>
        <div className={styles.resistorChoices}>
          {resistanceValues.map((value) => (
            <button key={value} type="button" className={resistance === value ? styles.selected : ""} onClick={() => inspect(value)}>
              <strong>{value} Ω</strong><small>{visited.includes(value) ? "observed" : "test"}</small>
            </button>
          ))}
        </div>
        <div className={styles.liveMeter}>
          <span>Current meter</span>
          <strong>{resistance ? (voltage / resistance).toFixed(2) : "—"} A</strong>
          <small>{resistance ? `${voltage} V ÷ ${resistance} Ω` : "Choose a resistor"}</small>
        </div>
        <div className={styles.miniTable}>
          {resistanceValues.map((value) => (
            <div key={value} className={visited.includes(value) ? styles.revealedValue : ""}>
              <span>{value} Ω</span><strong>{visited.includes(value) ? `${(voltage / value).toFixed(2)} A` : "—"}</strong>
            </div>
          ))}
        </div>
      </div>
      {complete ? (
        <div className={`${styles.observation} ${styles.visible}`}>
          <span>Your three observations</span><strong>3 Ω → 3 A · 6 Ω → 1.5 A · 9 Ω → 1 A</strong>
          <p>As resistance rises across the same 9 V battery, current consistently falls.</p>
        </div>
      ) : null}
      {complete ? <ContinueButton onClick={() => onComplete(outcomeFor(block))} label="Retry the idea" /> : null}
    </article>
  );
}

function EquivalentRetryBlock({ block, onComplete }: BlockProps) {
  const [selected, setSelected] = useState<Prediction | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [resistance, setResistance] = useState<number | null>(null);
  const [tested, setTested] = useState(false);
  if (block.content.kind !== "equivalent-retry") return null;
  const { firstResistance, secondResistance, voltage } = block.content;

  function choosePrediction(prediction: Prediction) {
    if (correct) return;
    setSelected(prediction);
    setAttempts((value) => value + 1);
    setCorrect(prediction === "decrease");
  }

  function changeResistance(nextResistance: number) {
    setResistance(nextResistance);
    if (nextResistance === secondResistance) setTested(true);
  }

  const liveResistance = resistance ?? firstResistance;
  const liveCurrent = voltage / liveResistance;
  return (
    <article className={styles.block}>
      <BlockHeader block={block} prompt="Try the same relationship with a new pair of values." />
      <div className={styles.relationshipLab}>
        <aside className={styles.conceptStack} aria-label="Live circuit quantities">
          <article>
            <span>Voltage</span><strong>{voltage} V · fixed</strong>
            <small>The battery keeps the same push.</small>
          </article>
          <article className={styles.conceptActive}>
            <span>Resistance</span><strong>{liveResistance} Ω</strong>
            <small>Move from {firstResistance} Ω to {secondResistance} Ω.</small>
          </article>
          <article>
            <span>Current</span><strong>{liveCurrent.toFixed(2)} A</strong>
            <small>Flow responds as resistance changes.</small>
          </article>
          <section className={styles.embeddedPrediction}>
            <span>Before moving it</span><small>Current will…</small>
            <div>
              {(["increase", "decrease", "same"] as Prediction[]).map((option) => (
                <button key={option} type="button" aria-label={`Predict current ${option}`} className={selected === option ? styles.selected : ""} disabled={correct} onClick={() => choosePrediction(option)}>
                  {option === "increase" ? "↑" : option === "decrease" ? "↓" : "="}
                </button>
              ))}
            </div>
            {attempts > 0 && !correct ? <em>Watch what more opposition should do.</em> : null}
            <button className={styles.hintLink} type="button" disabled={correct} onClick={() => setHintUsed(true)}>Show a hint</button>
            {hintUsed ? <p>With the same voltage, compare {voltage / firstResistance} A with {(voltage / secondResistance).toFixed(2)} A.</p> : null}
          </section>
        </aside>
        <section className={`${styles.circuitExperiment} ${correct ? styles.unlocked : ""}`}>
          <ResistanceCircuitSvg voltage={voltage} resistance={liveResistance} current={liveCurrent} />
          <div className={styles.attachedSlider}>
            <label htmlFor={`${block.id}-slider`}><span>Resistor</span><strong>{liveResistance} Ω</strong></label>
            <input
              id={`${block.id}-slider`}
              type="range"
              min={firstResistance}
              max={secondResistance}
              value={liveResistance}
              disabled={!correct}
              onChange={(event) => changeResistance(Number(event.target.value))}
            />
            <small>{correct ? `Move to ${secondResistance} Ω` : "Make a tiny prediction first"}</small>
          </div>
          {tested ? <div className={styles.circuitNotice}><span>Observed</span><strong>{firstResistance} Ω → {secondResistance} Ω</strong><small>{(voltage / firstResistance).toFixed(2)} A → {(voltage / secondResistance).toFixed(2)} A</small></div> : null}
        </section>
      </div>
      {tested ? <div className={styles.conceptConclusion}><span>Transferred idea</span><strong>More resistance · less current</strong></div> : null}
      {tested ? <ContinueButton onClick={() => onComplete(outcomeFor(block, { correct: true, attempts, hintUsed }))} label="Return to the main path" /> : null}
    </article>
  );
}

function RelationshipGraphBlock({ block, onComplete }: BlockProps) {
  const [focus, setFocus] = useState(4);
  const [changed, setChanged] = useState(false);
  if (block.content.kind !== "relationship-graph") return null;
  const { voltage, resistanceValues } = block.content;
  const points = resistanceValues.map((resistance) => ({ resistance, current: voltage / resistance }));
  const maxCurrent = Math.max(...points.map((point) => point.current));
  const polyline = points.map((point, index) => `${45 + index * 62},${205 - (point.current / maxCurrent) * 155}`).join(" ");
  return (
    <article className={styles.block}>
      <BlockHeader block={block} prompt="Move through the measurements. The graph is another representation of the same circuit." />
      <div className={styles.graphLab}>
        <svg viewBox="0 0 500 250" role="img" aria-label="Current decreases as resistance increases">
          <line x1="42" y1="30" x2="42" y2="210" /><line x1="42" y1="210" x2="465" y2="210" />
          <polyline points={polyline} />
          {points.map((point, index) => (
            <circle key={point.resistance} className={focus === point.resistance ? styles.focusPoint : ""} cx={45 + index * 62} cy={205 - (point.current / maxCurrent) * 155} r="7" />
          ))}
          <text x="195" y="242">Resistance →</text><text x="8" y="25">Current</text>
        </svg>
        <div className={styles.graphControl}>
          <span>Inspect resistance</span>
          <input type="range" min="0" max={resistanceValues.length - 1} value={resistanceValues.indexOf(focus)} onChange={(event) => { setFocus(resistanceValues[Number(event.target.value)]); setChanged(true); }} />
          <strong>{focus} Ω</strong><b>{(voltage / focus).toFixed(2)} A</b>
          <p>Moving right means more resistance. The curve moves downward because current becomes smaller.</p>
        </div>
      </div>
      {changed ? <ContinueButton onClick={() => onComplete(outcomeFor(block))} label="Apply the pattern" /> : null}
    </article>
  );
}

function ChoiceChallenge({ block, onComplete }: BlockProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [correct, setCorrect] = useState(false);
  if (block.content.kind !== "target-current" && block.content.kind !== "circuit-design") return null;
  const { voltage, targetCurrent, resistanceOptions } = block.content;
  const answer = voltage / targetCurrent;
  const liveResistance = selected ?? resistanceOptions[0];
  const liveCurrent = voltage / liveResistance;
  function check() {
    if (selected === null) return;
    setAttempts((value) => value + 1);
    setCorrect(selected === answer);
  }
  return (
    <article className={styles.block}>
      <BlockHeader block={block} prompt={block.content.kind === "circuit-design" ? "Build the target with a new battery." : "Change the resistor until the meter reaches the target."} />
      <div className={styles.relationshipLab}>
        <aside className={styles.conceptStack} aria-label="Circuit target and live values">
          <article>
            <span>Voltage</span><strong>{voltage} V · fixed</strong>
            <small>The battery value cannot change.</small>
          </article>
          <article className={styles.conceptActive}>
            <span>Target current</span><strong>{targetCurrent} A</strong>
            <small>The flow you are trying to create.</small>
          </article>
          <article>
            <span>Actual current</span><strong>{liveCurrent.toFixed(2)} A</strong>
            <small>Changes with the resistor you install.</small>
          </article>
          {hintUsed ? <section className={styles.embeddedPrediction}><span>Relationship</span><p>Required resistance = voltage ÷ target current.</p></section> : null}
        </aside>
        <section className={`${styles.circuitExperiment} ${styles.unlocked}`}>
          <ResistanceCircuitSvg voltage={voltage} resistance={liveResistance} current={liveCurrent} />
          <div className={styles.resistorDock} aria-label="Available resistors">
            <span>Install a resistor</span>
            <div>
              {resistanceOptions.map((resistance) => (
                <button key={resistance} type="button" className={selected === resistance ? styles.selected : ""} onClick={() => { setSelected(resistance); setCorrect(false); }}>
                  {resistance} Ω
                </button>
              ))}
            </div>
            <div className={styles.dockActions}>
              <button type="button" disabled={selected === null} onClick={check}>Test target</button>
              <button type="button" onClick={() => setHintUsed(true)}>Hint</button>
            </div>
          </div>
          {attempts > 0 ? <div className={`${styles.circuitNotice} ${correct ? styles.noticeSuccess : ""}`}><span>{correct ? "Target reached" : "Meter reading"}</span><strong>{liveCurrent.toFixed(2)} A</strong><small>{correct ? `${voltage} V ÷ ${answer} Ω` : `Target: ${targetCurrent} A · try another resistor`}</small></div> : null}
        </section>
      </div>
      {correct ? <ContinueButton onClick={() => onComplete(outcomeFor(block, { correct: true, attempts, hintUsed }))} label={block.content.kind === "circuit-design" ? "Complete the adaptive path" : "Continue to the transfer challenge"} /> : null}
    </article>
  );
}

const blockRegistry: Record<BlockContentKind, ComponentType<BlockProps>> = {
  "complete-circuit": CompleteCircuitBlock,
  "voltage-discovery": VoltageDiscoveryBlock,
  "resistance-diagnostic": ResistanceDiagnosticBlock,
  "misconception-visual": MisconceptionVisualBlock,
  "guided-resistance": GuidedResistanceBlock,
  "equivalent-retry": EquivalentRetryBlock,
  "relationship-graph": RelationshipGraphBlock,
  "target-current": ChoiceChallenge,
  "circuit-design": ChoiceChallenge,
};

type BlockContentKind = LearningBlock["content"]["kind"];

export function AdaptiveBlock({ block, onComplete }: BlockProps) {
  const Component = blockRegistry[block.content.kind];
  return <Component block={block} onComplete={onComplete} />;
}
