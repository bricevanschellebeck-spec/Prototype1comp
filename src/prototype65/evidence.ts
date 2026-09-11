import type { AdaptationDecision, ConceptEvidence, EvidenceEvent, GoldLesson, P65Activity, P65Depth, P65Goal, ReferenceContribution } from "./types";

export function deriveUnderstanding(lesson: GoldLesson, events: EvidenceEvent[]): ConceptEvidence[] {
  return lesson.concepts.map((concept) => {
    const relevant = events.filter((event) => event.conceptIds.includes(concept.id));
    const observations = relevant.map((event) => event.detail);
    let state: ConceptEvidence["state"] = "uncertain";
    if (relevant.some((event) => event.result === "misconception")) state = "misconception-evidence";
    if (relevant.some((event) => event.result === "supported")) state = "supported";
    if (relevant.some((event) => event.result === "strong")) state = "strong-evidence";
    return { conceptId: concept.id, state, observations };
  });
}

export function chooseSmallestAdaptation(activity: P65Activity, event: EvidenceEvent, goal: P65Goal = "understand"): AdaptationDecision | null {
  if (event.result === "strong") return { scale: "micro", kind: "skip-repetition", message: "Strong evidence detected. Basic repetition can stay collapsed." };
  if (event.result === "uncertain") return { scale: "micro", kind: "cue", message: "A small cue is enough: keep the unchanged quantity in view." };
  if (event.result !== "misconception") return null;
  if (goal === "curious") return { scale: "micro", kind: "cue", message: "Keep exploration moving and offer one optional clue instead of turning curiosity into remediation." };
  if (activity.interaction === "predict-current") return { scale: "medium", kind: "comparison", message: "Prediction evidence was inconsistent. Add a same-voltage circuit comparison before continuing.", insertActivityId: "c-compare" };
  if (activity.interaction === "connect-causes") return { scale: "medium", kind: "change-activity", message: "The causal link is uncertain. Keep the timeline and reveal a direct source clue before retrying.", insertActivityId: "h-source" };
  return { scale: "micro", kind: "highlight", message: "Highlight the relevant object before adding more explanation." };
}

export function referenceContributionsForOutcome(activity: P65Activity, event: EvidenceEvent, goal: P65Goal, depth: P65Depth, hasPriorGap = false): ReferenceContribution[] {
  const entries = activity.referenceContributions;
  if (goal === "understand") return entries;
  if (goal === "curious") {
    if (depth === "deep") return entries.filter((entry) => entry.kind !== "formula" || activity.stageRole === "application");
    return entries.filter((entry) => entry.kind === "relationship" || entry.kind === "definition").slice(0, 1);
  }
  if (goal === "revise") {
    if (hasPriorGap) return entries;
    if (event.result === "strong") return entries.filter((entry) => ["formula", "evidence", "summary"].includes(entry.kind));
    return entries;
  }
  // Test reference is populated only after the diagnostic or challenge has produced evidence.
  return activity.evidenceChannel === "diagnostic" || activity.purpose === "focus" ? entries : [];
}

export const learningDesignQualityRules = [
  "Objects carry the main explanation; text remains contextual.",
  "Discovery precedes formal naming when the learner can observe the relationship.",
  "Every activity has a learning family, evidence purpose, and freedom level.",
  "Completed evidence remains available and unfinished work alone may change.",
  "Use the smallest adaptation likely to help.",
  "Do not repeat the same failed activity without changing representation or guidance.",
  "Essential instructions are visible without hover.",
  "Conventional questions are used only when they are the appropriate representation.",
  "The learner can always identify the currently possible action.",
  "The reference grows from discovered and demonstrated knowledge.",
  "Preserve a meaningful scene object instead of replacing the whole page.",
  "Prefer meaningful visual consequences to isolated red or green feedback.",
  "Do not force a simulation onto knowledge better represented by a timeline, map, source, or relationship.",
  "Use diagnostic probes only when normal interaction leaves understanding uncertain.",
  "Never infer permanent intelligence, personality, ability, or learning-style labels.",
  "Let a side branch return to the exact learning context it interrupted.",
  "Reveal information when it becomes meaningful, not merely because its object exists.",
  "Keep identification visible, attach contextual explanation to the active object, and make deeper detail optional.",
  "Adapt information density around the relevant concept rather than increasing text everywhere.",
  "Purpose determines how an experience teaches; depth determines how far it goes.",
  "Revision and test modes collect diagnostic evidence before revealing targeted support.",
  "Reference growth follows the learner purpose instead of preloading the complete topic.",
  "Instruction, rendered state, calculation, and recorded evidence share one authoritative activity state.",
  "Temporarily withhold evidence that would reveal an assessment answer until the learner commits.",
  "An activity exists because doing something improves understanding or produces useful evidence—not to fill a quiz slot.",
  "One action is evidence about a concept, never proof of complete mastery.",
  "Comparison, repair, and target activities transform the persistent scene instead of opening a detached quiz page.",
] as const;
