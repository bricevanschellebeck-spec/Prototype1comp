"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  CIRCUIT_FOUNDATION_OBJECTIVE_ID,
  OHMS_LAW_TOPIC_ID,
  RESISTANCE_OBJECTIVE_ID,
  topicSpec,
} from "@/src/data/curriculum";
import type {
  ComposeResponse,
  CompositionRequest,
} from "@/src/domain/contracts";
import { LessonRenderer } from "@/src/components/LessonRenderer";
import { blockCatalog } from "@/src/data/blockCatalog";
import { composeLocally } from "@/src/lib/localComposer";
import { validateBlueprint } from "@/src/lib/validateBlueprint";

type Stage = "discover" | "setup" | "lesson";
type SetupStep = "intent" | "depth";
type Goal = "understand" | "revise" | "explore" | "test";
type TimeChoice = 5 | 15 | 30;
type FieldId =
  | "space"
  | "electricity"
  | "mathematics"
  | "biology"
  | "history"
  | "engineering"
  | "computing"
  | "physics";

const curiositySubjects = [
  { title: "Flight", question: "Why do planes stay in the air?", marker: "forces · shape" },
  { title: "Deep Space", question: "Could humans live on Mars?", marker: "space · survival" },
  { title: "Oceans", question: "What moves an ocean current?", marker: "climate · motion" },
  { title: "Engines", question: "How does fuel become motion?", marker: "energy · machines" },
  { title: "The Human Mind", question: "Why do memories change?", marker: "mind · behaviour" },
  { title: "Artificial Intelligence", question: "How does a machine learn patterns?", marker: "data · computing" },
];

const academicSubjects = [
  { title: "Mathematics", question: "How can an equation describe change?", code: "MTH" },
  { title: "Physics", question: "What makes motion change?", code: "PHY" },
  { title: "Biology", question: "How does a cell stay alive?", code: "BIO" },
  { title: "Chemistry", question: "Why do atoms form bonds?", code: "CHM" },
  { title: "Computer Science", question: "How does an algorithm solve a problem?", code: "CSC" },
  { title: "History", question: "Why do societies change?", code: "HIS" },
  { title: "Geography", question: "How does place shape human life?", code: "GEO" },
  { title: "Economics", question: "Why do prices rise and fall?", code: "ECO" },
];

const discoverySectionIds = ["knowledge-eye", "curiosity-trails", "academic-map"];

const goalOptions: Array<{
  id: Goal;
  label: string;
  symbol: string;
}> = [
  {
    id: "explore",
    label: "I'm curious",
    symbol: "↗",
  },
  {
    id: "understand",
    label: "I need to understand this",
    symbol: "○",
  },
  {
    id: "revise",
    label: "I'm revising",
    symbol: "↻",
  },
  {
    id: "test",
    label: "I have a test",
    symbol: "✓",
  },
];

const timeOptions: Array<{
  value: TimeChoice;
  label: string;
}> = [
  { value: 5, label: "Quick look" },
  { value: 15, label: "Learn it" },
  { value: 30, label: "Go deep" },
];

function BrandMark() {
  return (
    <div className="brand-mark" aria-label="Curiosity Lab prototype">
      <svg viewBox="0 0 38 38" role="img" aria-hidden="true">
        <circle cx="19" cy="19" r="16" />
        <path d="M10 19h6m6 0h6M19 10v6m0 6v6" />
        <circle cx="19" cy="19" r="3" />
      </svg>
      <span>Curiosity Lab</span>
      <small>prototype</small>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </svg>
  );
}

export function ComposerLab() {
  const [stage, setStage] = useState<Stage>("discover");
  const [setupStep, setSetupStep] = useState<SetupStep>("intent");
  const [setupTransitioning, setSetupTransitioning] = useState(false);
  const [question, setQuestion] = useState("");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [timeChoice, setTimeChoice] = useState<TimeChoice>(15);
  const [result, setResult] = useState<ComposeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [selectedField, setSelectedField] = useState<FieldId | null>(null);
  const discoveryPageRef = useRef<HTMLDivElement | null>(null);
  const wheelLockedRef = useRef(false);
  const wheelUnlockTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const page = discoveryPageRef.current;
    if (stage !== "discover" || !page) return;
    const discoveryPage = page;

    function scheduleWheelUnlock(delay: number) {
      if (wheelUnlockTimerRef.current !== null) {
        window.clearTimeout(wheelUnlockTimerRef.current);
      }
      wheelUnlockTimerRef.current = window.setTimeout(() => {
        wheelLockedRef.current = false;
        wheelUnlockTimerRef.current = null;
      }, delay);
    }

    function handleSectionWheel(event: WheelEvent) {
      if (!window.matchMedia("(min-width: 621px)").matches) return;
      if (Math.abs(event.deltaY) < 8) return;

      event.preventDefault();
      if (wheelLockedRef.current) {
        scheduleWheelUnlock(650);
        return;
      }

      const pageTop = discoveryPage.getBoundingClientRect().top;
      let currentIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      discoverySectionIds.forEach((sectionId, index) => {
        const section = document.getElementById(sectionId);
        if (!section) return;
        const distance = Math.abs(section.getBoundingClientRect().top - pageTop);
        if (distance < closestDistance) {
          closestDistance = distance;
          currentIndex = index;
        }
      });

      const direction = event.deltaY > 0 ? 1 : -1;
      const nextIndex = Math.min(
        discoverySectionIds.length - 1,
        Math.max(0, currentIndex + direction),
      );
      if (nextIndex === currentIndex) return;

      const target = document.getElementById(discoverySectionIds[nextIndex]);
      if (!target) return;

      wheelLockedRef.current = true;
      const targetTop =
        target.getBoundingClientRect().top - pageTop + discoveryPage.scrollTop;
      discoveryPage.scrollTo({ top: targetTop, behavior: "smooth" });
      scheduleWheelUnlock(850);
    }

    discoveryPage.addEventListener("wheel", handleSectionWheel, { passive: false });
    return () => {
      discoveryPage.removeEventListener("wheel", handleSectionWheel);
      if (wheelUnlockTimerRef.current !== null) {
        window.clearTimeout(wheelUnlockTimerRef.current);
        wheelUnlockTimerRef.current = null;
      }
      wheelLockedRef.current = false;
    };
  }, [stage]);

  function openSetup(nextQuestion: string) {
    const cleanedQuestion = nextQuestion.trim() || "How do electric circuits work?";
    setQuestion(cleanedQuestion);
    setGoal(null);
    setSetupStep("intent");
    setSetupTransitioning(false);
    setStage("setup");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    launchSetup(question);
  }

  function launchSetup(nextQuestion: string) {
    if (isLaunching) return;
    setIsLaunching(true);
    window.setTimeout(() => {
      openSetup(nextQuestion);
      setIsLaunching(false);
    }, 380);
  }

  function selectField(field: FieldId, exampleQuestion: string) {
    setSelectedField(field);
    setQuestion(exampleQuestion);
  }

  function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function previewSubject(exampleQuestion: string) {
    setSelectedField(null);
    setQuestion(exampleQuestion);
    scrollToSection("knowledge-eye");
  }

  function chooseIntent(nextGoal: Goal) {
    if (setupTransitioning) return;
    setGoal(nextGoal);
    setSetupTransitioning(true);
    window.setTimeout(() => {
      setSetupStep("depth");
      setSetupTransitioning(false);
    }, 260);
  }

  function chooseDepth(nextTimeChoice: TimeChoice) {
    if (setupTransitioning) return;
    setTimeChoice(nextTimeChoice);
    setSetupTransitioning(true);
    window.setTimeout(() => buildLearningPath(nextTimeChoice), 320);
  }

  function returnToSetup() {
    setGoal(null);
    setSetupStep("intent");
    setSetupTransitioning(false);
    setStage("setup");
  }

  function stepBackFromSetup() {
    if (setupTransitioning) return;
    if (setupStep === "depth") {
      setSetupStep("intent");
      return;
    }
    setStage("discover");
  }

  function buildRequest(selectedTimeChoice = timeChoice): CompositionRequest {
    const developing = goal === "revise" || goal === "test";
    const prototypeMinutes = selectedTimeChoice === 5 ? 8 : 9;

    return {
      topicId: OHMS_LAW_TOPIC_ID,
      requiredObjectiveIds: [
        CIRCUIT_FOUNDATION_OBJECTIVE_ID,
        RESISTANCE_OBJECTIVE_ID,
      ],
      learnerSnapshot: {
        priorKnowledge: developing ? "developing" : "beginner",
        knownMisconceptions: [],
        recentlyEffectiveInteractions: [],
      },
      constraints: {
        targetMinutes: prototypeMinutes,
        maximumSteps: 5,
        unavailableBlockIds: [],
        accessibilityNeeds: [],
      },
    };
  }

  async function buildLearningPath(selectedTimeChoice = timeChoice) {
    setStage("lesson");
    setLoading(true);
    setError(null);
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const request = buildRequest(selectedTimeChoice);
      const blueprint = composeLocally(request);
      const validation = validateBlueprint(blueprint, blockCatalog, {
        topicId: request.topicId,
        requiredObjectiveIds: request.requiredObjectiveIds,
        targetMinutes: request.constraints.targetMinutes,
        maximumSteps: request.constraints.maximumSteps,
        unavailableBlockIds: request.constraints.unavailableBlockIds,
      });

      if (!validation.valid || !validation.blueprint) {
        throw new Error(validation.errors.join(" "));
      }

      await new Promise((resolve) => window.setTimeout(resolve, 420));
      const payload: ComposeResponse = {
        blueprint: validation.blueprint,
        validation: {
          valid: true,
          errors: [],
          estimatedMinutes: validation.estimatedMinutes,
        },
        source: "local-fallback",
        note: "Static Prototype 1: a verified local blueprint demonstrates how the future AI composer will arrange registered learning blocks.",
      };
      setResult(payload);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to compose the lesson.",
      );
    } finally {
      setLoading(false);
    }
  }

  function resetExperience() {
    setResult(null);
    setError(null);
    setQuestion("");
    setGoal(null);
    setSetupStep("intent");
    setSetupTransitioning(false);
    setSelectedField(null);
    setStage("discover");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (stage === "discover") {
    return (
      <div
        ref={discoveryPageRef}
        className={`curiosity-page stage-enter${isLaunching ? " launching" : ""}`}
      >
        <header className="site-header">
          <BrandMark />
          <div className="header-note">
            <span className="live-dot" aria-hidden="true" />
            One live learning path
          </div>
        </header>

        <main className="field-main">
          <section id="knowledge-eye" className="curiosity-field" aria-labelledby="curiosity-heading">
            <svg className="eye-outline" viewBox="0 0 1200 620" aria-hidden="true">
              <path d="M34 310C197 102 389 34 600 34s403 68 566 276C1003 518 811 586 600 586S197 518 34 310Z" />
              <path d="M34 310C206 229 394 198 600 198s394 31 566 112" />
            </svg>
            <div className="field-ring ring-one" aria-hidden="true" />
            <div className="field-ring ring-two" aria-hidden="true" />

            <div className="curiosity-core">
              <span className="eyebrow">Eight fields · one starting point</span>
              <h1 id="curiosity-heading">What are you curious about?</h1>
              <p>Ask a question. We will rearrange trusted learning pieces around it.</p>

              <form className="curiosity-search" onSubmit={submitQuestion}>
                <SearchIcon />
                <label className="sr-only" htmlFor="curiosity-question">
                  What do you want to understand?
                </label>
                <input
                  id="curiosity-question"
                  type="text"
                  value={question}
                  onChange={(event) => {
                    setQuestion(event.target.value);
                    setSelectedField(null);
                  }}
                  placeholder="Ask about anything…"
                  autoComplete="off"
                />
                <button type="submit" aria-label="Continue with this question">
                  <span>Explore</span>
                  <span aria-hidden="true">→</span>
                </button>
              </form>

              <span className="prototype-hint">
                <i aria-hidden="true" /> Electric circuits is the working prototype
              </span>
            </div>

            <div className="sector-menu" aria-label="Knowledge fields">
              <button
                className="knowledge-fragment fragment-space"
                type="button"
                aria-pressed={selectedField === "space"}
                onClick={() => selectField("space", "Why don’t planets fall?")}
              >
                <div className="sector-content">
              <svg viewBox="0 0 100 76" aria-hidden="true">
                <ellipse className="orbit-path" cx="50" cy="38" rx="42" ry="14" />
                <circle className="planet" cx="50" cy="38" r="13" />
                <circle className="moon" cx="88" cy="38" r="4" />
              </svg>
              <span>Space</span>
              <strong>Why don’t planets fall?</strong>
              <small>Choose this field</small>
                </div>
              </button>

            <button
              className="knowledge-fragment fragment-circuit live-fragment"
              type="button"
              onClick={() => launchSetup("How do electric circuits work?")}
            >
              <div className="sector-content">
              <svg viewBox="0 0 150 78" aria-hidden="true">
                <path className="mini-wire" d="M12 22h40m46 0h39v42H12V46" />
                <path className="mini-resistor" d="m52 22 8-10 10 20 10-20 10 20 8-10" />
                <path className="mini-current" d="M38 64h54" />
                <path className="mini-arrow" d="m91 64-10-7v14Z" />
                <circle className="mini-bulb" cx="137" cy="64" r="9" />
                <path className="mini-battery" d="M5 33h14M8 42h8" />
              </svg>
              <span>Electricity</span>
              <strong>How do circuits work?</strong>
              <small>Try the live path →</small>
              </div>
            </button>

            <button
              className="knowledge-fragment fragment-maths"
              type="button"
              aria-pressed={selectedField === "mathematics"}
              onClick={() => selectField("mathematics", "How does y = x² shape a curve?")}
            >
              <div className="sector-content">
              <svg viewBox="0 0 112 72" aria-hidden="true">
                <path className="axis" d="M9 61h96M22 67V7" />
                <path className="math-curve" d="M26 57c17 0 27-5 36-17 8-11 14-24 35-28" />
                <circle className="curve-point" cx="62" cy="40" r="4" />
              </svg>
              <span>Mathematics</span>
              <strong>y = x²</strong>
              <small>Choose this field</small>
              </div>
            </button>

            <button
              className="knowledge-fragment fragment-biology"
              type="button"
              aria-pressed={selectedField === "biology"}
              onClick={() => selectField("biology", "How does DNA store information?")}
            >
              <div className="sector-content">
              <svg viewBox="0 0 82 92" aria-hidden="true">
                <path className="dna-strand strand-one" d="M18 5c54 18 4 65 48 82" />
                <path className="dna-strand strand-two" d="M64 5C10 23 60 70 16 87" />
                <path className="dna-rungs" d="m25 13 32 1M18 29l45 1M24 46h34M19 62l44 1M25 79l31 1" />
              </svg>
              <span>Biology</span>
              <strong>How does DNA store information?</strong>
              <small>Choose this field</small>
              </div>
            </button>

            <button
              className="knowledge-fragment fragment-history"
              type="button"
              aria-pressed={selectedField === "history"}
              onClick={() => selectField("history", "What connects 1776, 1969, and today?")}
            >
              <div className="sector-content">
              <div className="mini-timeline" aria-hidden="true">
                <i /><i /><i />
              </div>
              <span>History</span>
              <strong>1776 · 1969 · today</strong>
              <small>Choose this field</small>
              </div>
            </button>

            <button
              className="knowledge-fragment fragment-engineering"
              type="button"
              aria-pressed={selectedField === "engineering"}
              onClick={() => selectField("engineering", "What makes an engine move?")}
            >
              <div className="sector-content">
              <svg viewBox="0 0 90 82" aria-hidden="true">
                <path className="gear gear-large" d="M45 14v-8m0 70v-8M14 41H6m70 0h8M23 19l-6-6m50 50-6-6m0-38 6-6M17 69l6-6" />
                <circle className="gear-ring" cx="45" cy="41" r="25" />
                <circle className="gear-core" cx="45" cy="41" r="9" />
              </svg>
              <span>Engineering</span>
              <strong>What makes an engine move?</strong>
              <small>Choose this field</small>
              </div>
            </button>

            <button
              className="knowledge-fragment fragment-computing"
              type="button"
              aria-pressed={selectedField === "computing"}
              onClick={() => selectField("computing", "How does Wi-Fi carry information?")}
            >
              <div className="sector-content">
              <div className="binary-stream" aria-hidden="true">
                <span>01101</span><span>10110</span><span>00101</span>
              </div>
              <span>Computing</span>
              <strong>How does Wi-Fi carry information?</strong>
              <small>Choose this field</small>
              </div>
            </button>

            <button
              className="knowledge-fragment fragment-physics"
              type="button"
              aria-pressed={selectedField === "physics"}
              onClick={() => selectField("physics", "What makes motion change?")}
            >
              <div className="sector-content">
              <svg viewBox="0 0 120 74" aria-hidden="true">
                <rect className="force-cube" x="65" y="31" width="29" height="29" rx="3" />
                <path className="force-arrow" d="M10 45h47m-12-11 12 11-12 11" />
              </svg>
              <span>Physics</span>
              <strong>What makes motion change?</strong>
              <small>Choose this field</small>
              </div>
            </button>
            </div>

            <button
              className="scroll-cue"
              type="button"
              onClick={() => scrollToSection("curiosity-trails")}
            >
              <span>More ways in</span>
              <i aria-hidden="true">↓</i>
            </button>
          </section>

          <section id="curiosity-trails" className="topic-screen curiosity-trails">
            <div className="topic-screen-shell">
              <header className="topic-screen-heading">
                <div>
                  <span className="screen-index">02</span>
                  <span className="eyebrow">Interesting subjects</span>
                </div>
                <h2>Follow a question simply because it pulls you in.</h2>
                <p>
                  Curiosity does not always begin inside a school subject. These
                  are broader doorways into science, technology, people, and the world.
                </p>
              </header>

              <div className="curiosity-subject-grid">
                {curiositySubjects.map((subject, index) => (
                  <button
                    type="button"
                    key={subject.title}
                    onClick={() => previewSubject(subject.question)}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <small>{subject.marker}</small>
                    <strong>{subject.title}</strong>
                    <p>{subject.question}</p>
                    <i aria-hidden="true">↗</i>
                  </button>
                ))}
              </div>

              <button
                className="next-screen-button"
                type="button"
                onClick={() => scrollToSection("academic-map")}
              >
                See academic fields <span aria-hidden="true">↓</span>
              </button>
            </div>
          </section>

          <section id="academic-map" className="topic-screen academic-map">
            <div className="topic-screen-shell">
              <header className="topic-screen-heading compact-topic-heading">
                <div>
                  <span className="screen-index">03</span>
                  <span className="eyebrow">Academic foundations</span>
                </div>
                <h2>A broader map of what you could understand.</h2>
                <p>
                  These fields will eventually share the same trusted-block system.
                  For now, selecting one brings its question back to the prototype eye.
                </p>
              </header>

              <div className="academic-subject-list">
                {academicSubjects.map((subject) => (
                  <button
                    type="button"
                    key={subject.title}
                    onClick={() => previewSubject(subject.question)}
                  >
                    <span>{subject.code}</span>
                    <strong>{subject.title}</strong>
                    <p>{subject.question}</p>
                    <i aria-hidden="true">→</i>
                  </button>
                ))}
              </div>

              <button
                className="next-screen-button return-eye-button"
                type="button"
                onClick={() => scrollToSection("knowledge-eye")}
              >
                Return to the knowledge eye <span aria-hidden="true">↑</span>
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (stage === "setup") {
    return (
      <div
        className={`setup-page focused-setup setup-${setupStep} stage-enter${
          setupTransitioning ? " setup-transitioning" : ""
        }`}
      >
        <header className="site-header compact-header">
          <BrandMark />
          <button className="text-button" type="button" onClick={stepBackFromSetup}>
            {setupStep === "depth" ? "← Previous choice" : "← Back to the eye"}
          </button>
        </header>

        <main className="focused-setup-shell">
          <div className="setup-step-dots" aria-label={`Setup step ${setupStep === "intent" ? 1 : 2} of 2`}>
            <span className={setupStep === "intent" ? "active" : "complete"} />
            <span className={setupStep === "depth" ? "active" : ""} />
          </div>

          {setupStep === "intent" ? (
            <section className="setup-scene setup-intent-scene" key="intent">
              <h1>What brings you here?</h1>
              <div className="intent-choice-grid">
                {goalOptions.map((option, index) => (
                  <button
                    type="button"
                    key={option.id}
                    aria-pressed={goal === option.id}
                    onClick={() => chooseIntent(option.id)}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <i aria-hidden="true">{option.symbol}</i>
                    <strong>{option.label}</strong>
                    <small aria-hidden="true">→</small>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <section className="setup-scene setup-depth-scene" key="depth">
              <h1>How deep should we go?</h1>
              <div className="depth-choice-grid">
                {timeOptions.map((option, index) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => chooseDepth(option.value)}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{option.label}</strong>
                    <i aria-hidden="true">→</i>
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="setup-atmosphere" aria-hidden="true">
            <span /><span /><span />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`lesson-page stage-enter${result?.validation.valid ? " lesson-ready" : ""}`}>
      <div className="lesson-kinetic-field" aria-hidden="true">
        <span className="field-orbit field-orbit-one" />
        <span className="field-orbit field-orbit-two" />
        <i className="field-charge field-charge-one" />
        <i className="field-charge field-charge-two" />
        <i className="field-charge field-charge-three" />
      </div>
      <header className="site-header lesson-header">
        <BrandMark />
        <button className="text-button" type="button" onClick={resetExperience}>
          Start another question
        </button>
      </header>

      <main className="lesson-shell">
        <section className="lesson-opening">
          <div className="lesson-title-wrap">
            <span className="eyebrow">Your assembled learning path</span>
            <h1>{topicSpec.title}</h1>
            <p>{topicSpec.essentialQuestion}</p>
          </div>
          <div className="lesson-context" aria-label="Selected lesson context">
            <div><span>Goal</span><strong>{goalOptions.find((item) => item.id === goal)?.label ?? "Understand"}</strong></div>
            <div><span>Depth</span><strong>{timeOptions.find((item) => item.value === timeChoice)?.label}</strong></div>
            <button type="button" onClick={returnToSetup}>Adjust</button>
          </div>
        </section>

        {loading ? (
          <section className="assembling-state" aria-live="polite">
            <div className="assembly-orbit" aria-hidden="true"><span /><span /><span /></div>
            <span className="eyebrow">Composer working</span>
            <h2>Choosing the clearest path through the trusted blocks…</h2>
            <div className="assembly-lines" aria-hidden="true"><i /><i /><i /><i /></div>
          </section>
        ) : null}

        {error ? (
          <section className="lesson-error" role="alert">
            <h2>The path could not be assembled.</h2>
            <p>{error}</p>
            <button type="button" onClick={returnToSetup}>Return to setup</button>
          </section>
        ) : null}

        {result?.validation.valid ? (
          <>
            <section className="path-summary">
              <div className="path-status">
                <span className="status-pulse" aria-hidden="true" />
                <span><strong>Path validated</strong><small>{result.validation.estimatedMinutes} minute prototype sequence</small></span>
              </div>
              <ol>
                {result.blueprint.steps.map((step, index) => (
                  <li key={step.stepId}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{step.purpose}</strong>
                  </li>
                ))}
              </ol>
            </section>

            <LessonRenderer
              blueprint={result.blueprint}
              lessonTitle={topicSpec.title}
              goalLabel={goalOptions.find((item) => item.id === goal)?.label ?? "Understand"}
              depthLabel={timeOptions.find((item) => item.value === timeChoice)?.label ?? "Learn it"}
              onAdjust={returnToSetup}
            />

            <details className="composer-inspector">
              <summary>
                <span>Behind this path</span>
                <small>See the constrained blueprint the renderer received</small>
              </summary>
              <div className="inspector-content">
                <div>
                  <span className="section-label">Composition source</span>
                  <strong>{result.source === "ai" ? "AI composer" : "Local safe composer"}</strong>
                  <p>{result.note}</p>
                </div>
                <pre>{JSON.stringify(result.blueprint, null, 2)}</pre>
              </div>
            </details>
          </>
        ) : null}
      </main>
    </div>
  );
}
