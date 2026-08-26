"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type FieldId =
  | "space"
  | "electricity"
  | "mathematics"
  | "biology"
  | "history"
  | "engineering"
  | "computing"
  | "physics";

const discoverySectionIds = ["p4-knowledge-eye", "p4-curiosity-trails", "p4-academic-map"];

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

export function CuriosityBrand() {
  return (
    <div className="brand-mark" aria-label="Curiosity Lab Prototype 4">
      <svg viewBox="0 0 38 38" role="img" aria-hidden="true">
        <circle cx="19" cy="19" r="16" />
        <path d="M10 19h6m6 0h6M19 10v6m0 6v6" />
        <circle cx="19" cy="19" r="3" />
      </svg>
      <span>Curiosity Lab</span>
      <small>prototype 4</small>
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

type DiscoveryHomeProps = {
  onContinue: (question: string) => void;
};

export function DiscoveryHome({ onContinue }: DiscoveryHomeProps) {
  const [question, setQuestion] = useState("");
  const [selectedField, setSelectedField] = useState<FieldId | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const wheelLockedRef = useRef(false);
  const unlockTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    function scheduleUnlock(delay: number) {
      if (unlockTimerRef.current !== null) window.clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = window.setTimeout(() => {
        wheelLockedRef.current = false;
        unlockTimerRef.current = null;
      }, delay);
    }

    function handleWheel(event: WheelEvent) {
      if (!window.matchMedia("(min-width: 621px)").matches || Math.abs(event.deltaY) < 8) return;
      event.preventDefault();
      if (wheelLockedRef.current) {
        scheduleUnlock(650);
        return;
      }

      const pageTop = page!.getBoundingClientRect().top;
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
      const nextIndex = Math.min(discoverySectionIds.length - 1, Math.max(0, currentIndex + direction));
      if (nextIndex === currentIndex) return;
      const target = document.getElementById(discoverySectionIds[nextIndex]);
      if (!target) return;

      wheelLockedRef.current = true;
      const targetTop = target.getBoundingClientRect().top - pageTop + page!.scrollTop;
      page!.scrollTo({ top: targetTop, behavior: "smooth" });
      scheduleUnlock(850);
    }

    page.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      page.removeEventListener("wheel", handleWheel);
      if (unlockTimerRef.current !== null) window.clearTimeout(unlockTimerRef.current);
      wheelLockedRef.current = false;
    };
  }, []);

  function launch(nextQuestion: string) {
    if (isLaunching) return;
    setIsLaunching(true);
    window.setTimeout(() => onContinue(nextQuestion.trim() || "How do electric circuits work?"), 380);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    launch(question);
  }

  function selectField(field: FieldId, exampleQuestion: string) {
    setSelectedField(field);
    setQuestion(exampleQuestion);
  }

  function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function previewSubject(exampleQuestion: string) {
    setSelectedField(null);
    setQuestion(exampleQuestion);
    scrollToSection("p4-knowledge-eye");
  }

  return (
    <div ref={pageRef} className={`curiosity-page stage-enter${isLaunching ? " launching" : ""}`}>
      <header className="site-header">
        <CuriosityBrand />
        <div className="header-note"><span className="live-dot" aria-hidden="true" />Two subjects · one composition engine</div>
      </header>

      <main className="field-main">
        <section id="p4-knowledge-eye" className="curiosity-field" aria-labelledby="p4-curiosity-heading">
          <svg className="eye-outline" viewBox="0 0 1200 620" aria-hidden="true">
            <path d="M34 310C197 102 389 34 600 34s403 68 566 276C1003 518 811 586 600 586S197 518 34 310Z" />
            <path d="M34 310C206 229 394 198 600 198s394 31 566 112" />
          </svg>
          <div className="field-ring ring-one" aria-hidden="true" />
          <div className="field-ring ring-two" aria-hidden="true" />

          <div className="curiosity-core">
            <span className="eyebrow">Eight fields · one starting point</span>
            <h1 id="p4-curiosity-heading">What are you curious about?</h1>
            <p>Ask a question. We will rearrange trusted learning pieces around it.</p>
            <form className="curiosity-search" onSubmit={submit}>
              <SearchIcon />
              <label className="sr-only" htmlFor="p4-curiosity-question">What do you want to understand?</label>
              <input
                id="p4-curiosity-question"
                type="text"
                value={question}
                onChange={(event) => { setQuestion(event.target.value); setSelectedField(null); }}
                placeholder="Ask about anything…"
                autoComplete="off"
              />
              <button type="submit" aria-label="Continue with this question"><span>Explore</span><span aria-hidden="true">→</span></button>
            </form>
            <span className="prototype-hint"><i aria-hidden="true" /> Circuits + cell transport · local AI composition prototype</span>
          </div>

          <div className="sector-menu" aria-label="Knowledge fields">
            <button className="knowledge-fragment fragment-space" type="button" aria-pressed={selectedField === "space"} onClick={() => selectField("space", "Why don’t planets fall?")}>
              <div className="sector-content"><svg viewBox="0 0 100 76" aria-hidden="true"><ellipse className="orbit-path" cx="50" cy="38" rx="42" ry="14" /><circle className="planet" cx="50" cy="38" r="13" /><circle className="moon" cx="88" cy="38" r="4" /></svg><span>Space</span><strong>Why don’t planets fall?</strong><small>Choose this field</small></div>
            </button>
            <button className="knowledge-fragment fragment-circuit live-fragment" type="button" onClick={() => launch("How do electric circuits work?")}>
              <div className="sector-content"><svg viewBox="0 0 150 78" aria-hidden="true"><path className="mini-wire" d="M12 22h40m46 0h39v42H12V46" /><path className="mini-resistor" d="m52 22 8-10 10 20 10-20 10 20 8-10" /><path className="mini-current" d="M38 64h54" /><path className="mini-arrow" d="m91 64-10-7v14Z" /><circle className="mini-bulb" cx="137" cy="64" r="9" /><path className="mini-battery" d="M5 33h14M8 42h8" /></svg><span>Electricity</span><strong>How do circuits work?</strong><small>Try the live path →</small></div>
            </button>
            <button className="knowledge-fragment fragment-maths" type="button" aria-pressed={selectedField === "mathematics"} onClick={() => selectField("mathematics", "How does y = x² shape a curve?")}>
              <div className="sector-content"><svg viewBox="0 0 112 72" aria-hidden="true"><path className="axis" d="M9 61h96M22 67V7" /><path className="math-curve" d="M26 57c17 0 27-5 36-17 8-11 14-24 35-28" /><circle className="curve-point" cx="62" cy="40" r="4" /></svg><span>Mathematics</span><strong>y = x²</strong><small>Choose this field</small></div>
            </button>
            <button className="knowledge-fragment fragment-biology" type="button" aria-pressed={selectedField === "biology"} onClick={() => selectField("biology", "How does a cell stay alive?")}>
              <div className="sector-content"><svg viewBox="0 0 82 92" aria-hidden="true"><path className="dna-strand strand-one" d="M18 5c54 18 4 65 48 82" /><path className="dna-strand strand-two" d="M64 5C10 23 60 70 16 87" /><path className="dna-rungs" d="m25 13 32 1M18 29l45 1M24 46h34M19 62l44 1M25 79l31 1" /></svg><span>Biology</span><strong>How does a cell stay alive?</strong><small>Choose this field</small></div>
            </button>
            <button className="knowledge-fragment fragment-history" type="button" aria-pressed={selectedField === "history"} onClick={() => selectField("history", "What connects 1776, 1969, and today?")}>
              <div className="sector-content"><div className="mini-timeline" aria-hidden="true"><i /><i /><i /></div><span>History</span><strong>1776 · 1969 · today</strong><small>Choose this field</small></div>
            </button>
            <button className="knowledge-fragment fragment-engineering" type="button" aria-pressed={selectedField === "engineering"} onClick={() => selectField("engineering", "What makes an engine move?")}>
              <div className="sector-content"><svg viewBox="0 0 90 82" aria-hidden="true"><path className="gear gear-large" d="M45 14v-8m0 70v-8M14 41H6m70 0h8M23 19l-6-6m50 50-6-6m0-38 6-6M17 69l6-6" /><circle className="gear-ring" cx="45" cy="41" r="25" /><circle className="gear-core" cx="45" cy="41" r="9" /></svg><span>Engineering</span><strong>What makes an engine move?</strong><small>Choose this field</small></div>
            </button>
            <button className="knowledge-fragment fragment-computing" type="button" aria-pressed={selectedField === "computing"} onClick={() => selectField("computing", "How does Wi-Fi carry information?")}>
              <div className="sector-content"><div className="binary-stream" aria-hidden="true"><span>01101</span><span>10110</span><span>00101</span></div><span>Computing</span><strong>How does Wi-Fi carry information?</strong><small>Choose this field</small></div>
            </button>
            <button className="knowledge-fragment fragment-physics" type="button" aria-pressed={selectedField === "physics"} onClick={() => selectField("physics", "What makes motion change?")}>
              <div className="sector-content"><svg viewBox="0 0 120 74" aria-hidden="true"><rect className="force-cube" x="65" y="31" width="29" height="29" rx="3" /><path className="force-arrow" d="M10 45h47m-12-11 12 11-12 11" /></svg><span>Physics</span><strong>What makes motion change?</strong><small>Choose this field</small></div>
            </button>
          </div>

          <button className="scroll-cue" type="button" onClick={() => scrollToSection("p4-curiosity-trails")}><span>More ways in</span><i aria-hidden="true">↓</i></button>
        </section>

        <section id="p4-curiosity-trails" className="topic-screen curiosity-trails">
          <div className="topic-screen-shell">
            <header className="topic-screen-heading"><div><span className="screen-index">02</span><span className="eyebrow">Interesting subjects</span></div><h2>Follow a question simply because it pulls you in.</h2><p>Curiosity does not always begin inside a school subject. These are broader doorways into science, technology, people, and the world.</p></header>
            <div className="curiosity-subject-grid">
              {curiositySubjects.map((subject, index) => <button type="button" key={subject.title} onClick={() => previewSubject(subject.question)}><span>{String(index + 1).padStart(2, "0")}</span><small>{subject.marker}</small><strong>{subject.title}</strong><p>{subject.question}</p><i aria-hidden="true">↗</i></button>)}
            </div>
            <button className="next-screen-button" type="button" onClick={() => scrollToSection("p4-academic-map")}>See academic fields <span aria-hidden="true">↓</span></button>
          </div>
        </section>

        <section id="p4-academic-map" className="topic-screen academic-map">
          <div className="topic-screen-shell">
            <header className="topic-screen-heading compact-topic-heading"><div><span className="screen-index">03</span><span className="eyebrow">Academic foundations</span></div><h2>A broader map of what you could understand.</h2><p>Prototype 4 uses one trusted-block system for two very different subjects. Choose a question, then continue from the eye.</p></header>
            <div className="academic-subject-list">
              {academicSubjects.map((subject) => <button type="button" key={subject.title} onClick={() => previewSubject(subject.question)}><span>{subject.code}</span><strong>{subject.title}</strong><p>{subject.question}</p><i aria-hidden="true">→</i></button>)}
            </div>
            <button className="next-screen-button return-eye-button" type="button" onClick={() => scrollToSection("p4-knowledge-eye")}>Return to the knowledge eye <span aria-hidden="true">↑</span></button>
          </div>
        </section>
      </main>
    </div>
  );
}
