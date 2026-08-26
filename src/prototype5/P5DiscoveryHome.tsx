"use client";

import { FormEvent, useState } from "react";

export function P5Brand() {
  return <div className="brand-mark" aria-label="Curiosity Lab Prototype 5"><svg viewBox="0 0 38 38" aria-hidden="true"><circle cx="19" cy="19" r="16"/><path d="M10 19h6m6 0h6M19 10v6m0 6v6"/><circle cx="19" cy="19" r="3"/></svg><span>Curiosity Lab</span><small>prototype 5</small></div>;
}

export function P5DiscoveryHome({ onContinue }: { onContinue: (question: string) => void }) {
  const [question, setQuestion] = useState(""); const [launching, setLaunching] = useState(false);
  function launch(value: string) { if (launching) return; setLaunching(true); window.setTimeout(() => onContinue(value.trim() || "How does concentration affect reaction rate?"), 320); }
  function submit(event: FormEvent) { event.preventDefault(); launch(question); }
  const fragments = [
    ["Space", "Why don't planets fall?", "🪐"], ["Electricity", "How do circuits work?", "↯"], ["Mathematics", "How does a curve change?", "y²"],
    ["Biology", "How does a cell stay alive?", "DNA"], ["History", "Why do societies change?", "1969"], ["Engineering", "What makes an engine move?", "⚙"],
    ["Computing", "How does Wi-Fi carry information?", "01"], ["Chemistry", "How does concentration affect reaction rate?", "H⁺"],
  ];
  return <div className={`curiosity-page stage-enter${launching ? " launching" : ""}`}>
    <header className="site-header"><P5Brand/><div className="header-note"><span className="live-dot"/>Source → review → compiler → composer</div></header>
    <main className="field-main"><section className="curiosity-field" aria-labelledby="p5-eye-title">
      <svg className="eye-outline" viewBox="0 0 1200 620" aria-hidden="true"><path d="M34 310C197 102 389 34 600 34s403 68 566 276C1003 518 811 586 600 586S197 518 34 310Z"/><path d="M34 310C206 229 394 198 600 198s394 31 566 112"/></svg>
      <div className="field-ring ring-one"/><div className="field-ring ring-two"/>
      <div className="curiosity-core"><span className="eyebrow">Trusted sources · new interactive forms</span><h1 id="p5-eye-title">What are you curious about?</h1><p>Ask a question. This prototype shows how knowledge becomes a reviewed, interactive lesson.</p>
        <form className="curiosity-search" onSubmit={submit}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg><input aria-label="What do you want to understand?" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about anything…"/><button type="submit"><span>Explore</span><span>→</span></button></form>
        <span className="prototype-hint"><i/> Prototype 5 · source-grounded lesson compiler</span>
      </div>
      <div className="sector-menu" aria-label="Knowledge fields">{fragments.map(([title, prompt, mark], index) => <button key={title} type="button" className={`knowledge-fragment ${["fragment-space","fragment-circuit","fragment-maths","fragment-biology","fragment-history","fragment-engineering","fragment-computing","fragment-physics"][index]}`} onClick={() => launch(prompt)}><div className="sector-content"><b style={{fontSize: index === 7 ? "1.8rem" : undefined}}>{mark}</b><span>{title}</span><strong>{prompt}</strong><small>{title === "Chemistry" ? "Open trusted source →" : "Use this question →"}</small></div></button>)}</div>
    </section></main>
  </div>;
}
