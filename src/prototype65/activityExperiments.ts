import { circuitLesson } from "./lessons";
import type { ActivityFamily, ActivityPurpose, P65Goal } from "./types";

export type ActivityExperimentRecord = {
  activityId: string;
  pattern: "compare" | "evidence-reason" | "target-challenge" | "repair-debug";
  activityFamily: ActivityFamily;
  purpose: ActivityPurpose;
  learnerPurposes: P65Goal[];
  concept: string;
  learnerAction: string;
  evidenceCollected: string;
  feltNatural: "test";
  interruptedLesson: "test";
  betterThanConventionalQuestion: "test";
  problemsDiscovered: string;
  decision: "keep" | "change" | "remove" | "evaluate";
};

function record(activityId: string, pattern: ActivityExperimentRecord["pattern"]): ActivityExperimentRecord {
  const activity = circuitLesson.activities.find((candidate) => candidate.id === activityId);
  if (!activity) throw new Error(`Unknown P6.5 activity experiment: ${activityId}`);
  return {
    activityId,
    pattern,
    activityFamily: activity.family,
    purpose: activity.purpose,
    learnerPurposes: activity.eligibleGoals,
    concept: activity.evidenceContract.concept,
    learnerAction: activity.evidenceContract.learnerAction,
    evidenceCollected: activity.evidenceContract.evidenceProduced,
    feltNatural: "test",
    interruptedLesson: "test",
    betterThanConventionalQuestion: "test",
    problemsDiscovered: "Pending structured learner evaluation.",
    decision: "evaluate",
  };
}

/** A deliberately small candidate set for deciding which patterns deserve to become primitives. */
export const activityExperimentRecords: ActivityExperimentRecord[] = [
  record("c-compare", "compare"),
  record("c-lab", "evidence-reason"),
  record("c-target", "target-challenge"),
  record("c-repair", "repair-debug"),
];
