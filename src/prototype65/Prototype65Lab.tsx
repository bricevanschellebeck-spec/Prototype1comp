"use client";

import { useMemo, useRef, useState } from "react";
import { ActivityDock } from "./ActivityDock";
import { ContextAssistant } from "./ContextAssistant";
import { chooseSmallestAdaptation, deriveUnderstanding } from "./evidence";
import { activityPath, findActivity, goldLessons } from "./lessons";
import { PersistentLearningScene, type SceneState } from "./Scenes";
import { sceneForActivity } from "./runtime";
import { BeforeTextbook, ReferenceDrawer } from "./ReferenceDrawer";
import { addReferenceKnowledge, emptyLivingReference, referenceAvailable } from "./reference";
import type { AdaptationDecision, EvidenceEvent, GoldLesson, LivingReference, P65Depth, P65Goal } from "./types";
import styles from "./prototype65.module.css";

type Screen = "subject" | "goal" | "depth" | "workspace";
const goalOptions: Array<{ id: P65Goal; label: string; note: string }> = [
  { id: "curious", label: "I’m curious", note: "discover and wander" },
  { id: "understand", label: "I want to understand", note: "experience, explain, apply" },
  { id: "revise", label: "I’m revising", note: "diagnose and strengthen" },
  { id: "test", label: "I have a test", note: "demonstrate and transfer" },
];
const depthOptions: Array<{ id: P65Depth; label: string; note: string }> = [
  { id: "quick", label: "Quick look", note: "the core idea" },
  { id: "learn", label: "Learn it", note: "a complete experience" },
  { id: "deep", label: "Go deep", note: "connections and transfer" },
];
const demoProfiles: Array<{ goal: P65Goal; depth: P65Depth; label: string }> = [
  { goal: "curious", depth: "quick", label: "Curious · Quick look" },
  { goal: "understand", depth: "learn", label: "Understand · Learn it" },
  { goal: "revise", depth: "learn", label: "Revise · Learn it" },
  { goal: "test", depth: "deep", label: "Test · Go deep" },
];

function initialScene(): SceneState {
  return { circuits: { closed: false, voltage: 9, resistance: 4, measurements: [], voltageObservations: [], comparisonVisible: false, assessmentEvidenceRevealed: false, guidanceLevel: 0 }, history: { revealedEvents: 0, causeConnected: false, sourceSelected: false, chainBuilt: false, sourceSupportVisible: false, guidanceLevel: 0 } };
}

function Brand() { return <div className={styles.brand}><span>✦</span><strong>Curiosity Lab</strong><small>P6.5</small></div>; }

export function Prototype65Lab() {
  const [screen, setScreen] = useState<Screen>("subject");
  const [lesson, setLesson] = useState<GoldLesson>(goldLessons[0]);
  const [goal, setGoal] = useState<P65Goal>("understand");
  const [depth, setDepth] = useState<P65Depth>("learn");
  const [activityIds, setActivityIds] = useState<string[]>([]);
  const [activityIndex, setActivityIndex] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [evidence, setEvidence] = useState<EvidenceEvent[]>([]);
  const [reference, setReference] = useState<LivingReference>(() => emptyLivingReference(goldLessons[0]));
  const [referenceNotice, setReferenceNotice] = useState("");
  const referenceNoticeTimer = useRef<number | undefined>(undefined);
  const [scene, setScene] = useState<SceneState>(initialScene);
  const [adaptation, setAdaptation] = useState<AdaptationDecision | null>(null);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [beforeOpen, setBeforeOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [transitioning, setTransitioning] = useState(false);

  const activity = findActivity(lesson, activityIds[activityIndex] || "");
  const activeScene = sceneForActivity(scene, activity);
  const understanding = useMemo(() => deriveUnderstanding(lesson, evidence), [lesson, evidence]);
  const isComplete = screen === "workspace" && !activity;
  const canOpenReference = referenceAvailable(goal, activity, evidence);

  function advanceScreen(next: Screen) {
    setTransitioning(true); window.setTimeout(() => { setScreen(next); setTransitioning(false); }, 280);
  }
  function begin(nextDepth: P65Depth, nextGoal = goal) {
    setGoal(nextGoal); setDepth(nextDepth);
    const path = activityPath(lesson, nextGoal, nextDepth);
    const nextScene = initialScene();
    if (lesson.id === "circuits" && path[0]?.interaction !== "close-circuit") nextScene.circuits.closed = true;
    setActivityIds(path.map((item) => item.id)); setActivityIndex(0); setCompleted([]); setEvidence([]); setReference(emptyLivingReference(lesson)); setReferenceNotice(""); setScene(nextScene); setAdaptation(null); setAssistantMessage("");
    advanceScreen("workspace");
  }
  function record(outcome: EvidenceEvent) {
    if (!activity) return;
    const decision = chooseSmallestAdaptation(activity, outcome, goal);
    setEvidence((before) => [...before, outcome]);
    setCompleted((before) => before.includes(activity.id) ? before : [...before, activity.id]);
    const hasPriorGap = evidence.some((item) => item.result === "misconception" && item.conceptIds.some((conceptId) => activity.conceptIds.includes(conceptId)));
    const referenceUpdate = addReferenceKnowledge({ reference, lesson, activity, event: outcome, goal, depth, hasPriorGap, scene: activeScene });
    setReference(referenceUpdate.reference);
    if (referenceUpdate.addedSectionIds.length) {
      setReferenceNotice(`Added to My lesson · ${referenceUpdate.addedSectionIds.length} new ${referenceUpdate.addedSectionIds.length === 1 ? "section" : "sections"}`);
      if (referenceNoticeTimer.current) window.clearTimeout(referenceNoticeTimer.current);
      referenceNoticeTimer.current = window.setTimeout(() => setReferenceNotice(""), 2200);
    }
    if (activity.interaction === "observe-voltage") setScene((before) => ({ ...before, circuits: { ...before.circuits, voltage: 9 } }));
    setAdaptation(decision);
    if (outcome.result === "misconception") {
      if (activity.interaction === "predict-current") {
        setScene((before) => ({ ...before, circuits: { ...before.circuits, comparisonVisible: true } }));
        if (goal !== "curious") setActivityIds((before) => {
          const prefix = before.slice(0, activityIndex + 1);
          const unfinishedWithoutSupport = before.slice(activityIndex + 1).filter((id) => id !== "c-compare");
          return [...prefix, "c-compare", ...unfinishedWithoutSupport];
        });
      }
      if (activity.interaction === "connect-causes") {
        setScene((before) => ({ ...before, history: { ...before.history, sourceSupportVisible: true } }));
        if (!activityIds.includes("h-source")) setActivityIds((before) => [...before.slice(0, activityIndex + 1), "h-source", ...before.slice(activityIndex + 1)]);
      }
    }
    if (outcome.result === "strong" && activity.id === "c-predict" && goal === "revise" && activityIds[activityIndex + 1] === "c-compare") {
      setActivityIds((before) => before.filter((id, index) => id !== "c-compare" || index <= activityIndex));
      setAdaptation({ scale: "micro", kind: "skip-repetition", message: "The prediction was secure, so the basic experiment remains available in history but is not required." });
    }
    window.setTimeout(() => setActivityIndex((index) => index + 1), 720);
  }
  function assistant(kind: "confused" | "why" | "alternate") {
    if (!activity) return;
    if (kind === "confused") {
      setAssistantMessage("I’ve reduced the scene and highlighted the object that matters. Try the smallest change first.");
      setAdaptation({ scale: "micro", kind: "highlight", message: "Learner requested help; reduce complexity and highlight the active object." });
      setScene((before) => ({ ...before, circuits: { ...before.circuits, guidanceLevel: Math.max(2, before.circuits.guidanceLevel) }, history: { ...before.history, guidanceLevel: Math.max(2, before.history.guidanceLevel) } }));
    } else if (kind === "why") setAssistantMessage(lesson.id === "circuits" ? "Watch which quantity stays fixed, then compare the one you changed with the current." : "Follow the connection from pressure, to a decision, to its consequence.");
    else {
      setAssistantMessage(lesson.id === "circuits" ? "I’ve added a side-by-side circuit comparison instead of another paragraph." : "I’ve kept the timeline and added direct source evidence beside it.");
      setAdaptation({ scale: "medium", kind: lesson.id === "circuits" ? "comparison" : "change-activity", message: "Representation changed at the learner's request." });
      setScene((before) => ({ ...before, circuits: { ...before.circuits, comparisonVisible: true }, history: { ...before.history, sourceSupportVisible: true } }));
    }
  }
  function reset() { setScreen("subject"); setActivityIds([]); setActivityIndex(0); setCompleted([]); setEvidence([]); setReference(emptyLivingReference(lesson)); setReferenceNotice(""); setScene(initialScene()); }

  if (screen !== "workspace") return <main className={`${styles.setup} ${transitioning ? styles.leaving : ""}`}>
    <header><Brand/><span>Gold-standard learning experiences · no AI required</span></header>
    <div className={styles.setupSteps}><i data-active={screen === "subject"}/><i data-active={screen === "goal"}/><i data-active={screen === "depth"}/></div>
    {screen === "subject" ? <section className={styles.subjectChoice}><small>01 · CHOOSE AN ENVIRONMENT</small><h1>What should become explorable?</h1><div>{goldLessons.map((item) => <button key={item.id} data-palette={item.palette} onClick={() => { setLesson(item); advanceScreen("goal"); }}><span>{item.subject}</span><strong>{item.title}</strong><p>{item.question}</p><figure aria-hidden="true">{item.id === "circuits" ? <><i/><i/><i/></> : <><b>1957</b><i/><b>1961</b><i/><b>1969</b></>}</figure><em>Enter the scene →</em></button>)}</div></section> : null}
    {screen === "goal" ? <section className={styles.optionScreen}><button className={styles.backButton} onClick={() => advanceScreen("subject")}>← Environments</button><small>02 · PURPOSE CHANGES THE EXPERIENCE</small><h1>What brings you here?</h1><div className={styles.goalOptions}>{goalOptions.map((option,index) => <button key={option.id} onClick={() => { setGoal(option.id); advanceScreen("depth"); }}><span>{String(index+1).padStart(2,"0")}</span><strong>{option.label}</strong><small>{option.note}</small><i>→</i></button>)}</div></section> : null}
    {screen === "depth" ? <section className={styles.optionScreen}><button className={styles.backButton} onClick={() => advanceScreen("goal")}>← Purpose</button><small>03 · CHOOSE THE DEPTH</small><h1>How deep should we go?</h1><div className={styles.depthOptions}>{depthOptions.map((option,index) => <button key={option.id} onClick={() => begin(option.id)}><span>{String(index+1).padStart(2,"0")}</span><strong>{option.label}</strong><small>{option.note}</small><i>→</i></button>)}</div></section> : null}
  </main>;

  return <main className={`${styles.workspace} ${styles[lesson.palette]}`}>
    <header className={styles.workspaceHeader}><div><Brand/><span>{lesson.subject} · {goal} · {depth}</span></div><nav><select aria-label="Switch demo profile" value={demoProfiles.some((profile) => profile.goal === goal && profile.depth === depth) ? `${goal}:${depth}` : ""} onChange={(event) => { const profile = demoProfiles.find((candidate) => `${candidate.goal}:${candidate.depth}` === event.target.value); if (profile) begin(profile.depth, profile.goal); }}><option value="" disabled>Switch demo mode</option>{demoProfiles.map((profile) => <option key={`${profile.goal}:${profile.depth}`} value={`${profile.goal}:${profile.depth}`}>{profile.label}</option>)}</select>{isComplete ? <button onClick={() => setBeforeOpen(true)}>Fixed textbook demo</button> : null}<button className={styles.referenceButton} data-new={Boolean(referenceNotice)} disabled={!canOpenReference} title={canOpenReference ? "Open the reference built from this lesson" : "Reference opens after this assessment response"} onClick={() => setReferenceOpen(true)}>My lesson <b>{reference.sections.length}</b>{!canOpenReference ? <small>locked</small> : null}</button><button onClick={reset}>Start again</button></nav></header>
    <section className={styles.canvasArea}>
      <div className={styles.sceneArea}><PersistentLearningScene subjectId={lesson.id} lesson={lesson} goal={goal} depth={depth} state={activeScene} activeActivity={activity} adaptation={adaptation} completedActivityIds={completed}/>
        <div className={styles.evidenceTrail}><small>{goal === "curious" ? "WHAT YOU DISCOVERED" : goal === "revise" ? "WHAT YOU REFRESHED" : goal === "test" ? "YOUR RESPONSES" : "WHAT YOU HAVE BUILT"}</small>{evidence.slice(-4).map((item) => <span key={`${item.activityId}-${item.detail}`} data-result={item.result}>{item.detail}</span>)}</div>
        {referenceNotice ? <div className={styles.referenceNotice} role="status">{referenceNotice}</div> : null}
        <aside className={styles.learningRail}>{isComplete ? <div className={styles.conclusion}><small>YOUR LEARNING JOURNEY</small><h1>{goal === "test" ? "Your readiness evidence is ready." : goal === "revise" ? "You refreshed what needed attention." : goal === "curious" ? "You found the idea through the object." : "You built an explanation—not just a score."}</h1><section><span>{goal === "test" ? "What the check covered" : "What you discovered"}</span>{reference.sections.map((section) => <p key={section.id}>{section.title}</p>)}</section><section><span>Evidence of understanding</span>{understanding.filter((item) => item.observations.length).map((item) => <p key={item.conceptId} data-state={item.state}>{lesson.concepts.find((concept) => concept.id === item.conceptId)?.label} · {item.state}</p>)}</section><section><span>What you did</span><p>{completed.map((id) => findActivity(lesson,id)?.family.replaceAll("-"," ")).filter(Boolean).join(" · ")}</p></section><button onClick={() => setReferenceOpen(true)}>Open the lesson you built →</button></div> : activity ? <ActivityDock key={activity.id} activity={activity} goal={goal} depth={depth} scene={activeScene} setScene={setScene} onFinish={record}/> : null}</aside>
        <div className={styles.activityPosition}><span>{Math.min(activityIndex + 1, activityIds.length)} / {activityIds.length}</span><div>{activityIds.map((id,index) => <i key={id} data-state={index < activityIndex ? "complete" : index === activityIndex ? "active" : "future"}/>)}</div></div>
      </div>
    </section>
    <ContextAssistant lesson={lesson} activity={activity} message={assistantMessage} branchOpen={branchOpen} onConfused={() => assistant("confused")} onWhy={() => assistant("why")} onAlternate={() => assistant("alternate")} onBranch={() => setBranchOpen(true)} onCloseBranch={() => setBranchOpen(false)}/>
    <ReferenceDrawer lesson={lesson} goal={goal} reference={reference} evidence={evidence} open={referenceOpen && canOpenReference} onClose={() => setReferenceOpen(false)}/><BeforeTextbook lesson={lesson} open={beforeOpen} onClose={() => setBeforeOpen(false)}/>
  </main>;
}
