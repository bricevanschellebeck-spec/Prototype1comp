import type { GoldLesson, P65Activity, P65Depth, P65Goal, ObjectKnowledgeState } from "./types";

export type InformationDensity = "glance" | "guided" | "deep";

export function informationDensity(goal: P65Goal, depth: P65Depth, guidanceLevel: number): InformationDensity {
  if (guidanceLevel >= 3) return depth === "deep" ? "deep" : "guided";
  if (goal === "test" || goal === "revise" || depth === "quick") return "glance";
  if (depth === "deep") return "deep";
  return "guided";
}

export function introducedObjectIds(lesson: GoldLesson, activity: P65Activity | undefined, completedActivityIds: string[], actionObserved = false) {
  const introduced = new Set(lesson.initialObjectIds);
  for (const completedId of completedActivityIds) {
    const completed = lesson.activities.find((candidate) => candidate.id === completedId);
    completed?.information.introducedObjectIds.forEach((id) => introduced.add(id));
    completed?.information.revealedAfterActionObjectIds?.forEach((id) => introduced.add(id));
  }
  activity?.information.introducedObjectIds.forEach((id) => introduced.add(id));
  if (actionObserved) activity?.information.revealedAfterActionObjectIds?.forEach((id) => introduced.add(id));
  return introduced;
}

export function objectKnowledgeState(objectId: string, lesson: GoldLesson, activity: P65Activity | undefined, completedActivityIds: string[], actionObserved = false): ObjectKnowledgeState {
  if (activity?.information.activeObjectIds.includes(objectId)) return "active";
  return introducedObjectIds(lesson, activity, completedActivityIds, actionObserved).has(objectId) ? "known" : "future";
}

export function shouldRevealContext(activity: P65Activity | undefined, options: { goal: P65Goal; actionObserved: boolean; guidanceLevel: number }) {
  if (!activity?.information.contextualExplanation) return false;
  const reveal = activity.information.contextualRevealByGoal?.[options.goal] ?? activity.information.contextualReveal ?? "immediate";
  if (reveal === "after-action" && !options.actionObserved) return false;
  if (reveal === "after-struggle" && options.guidanceLevel < 1) return false;
  if ((options.goal === "test" || options.goal === "revise") && options.guidanceLevel < 1 && reveal !== "after-action") return false;
  return true;
}

export function detailParts(density: InformationDensity, detail: GoldLesson["objectDetails"][number]) {
  const parts = [{ label: "Definition", text: detail.definition }];
  if (density !== "glance" && detail.unit) parts.push({ label: "Unit", text: detail.unit });
  if (density === "deep" && detail.mechanism) parts.push({ label: "How it works", text: detail.mechanism });
  if (density === "deep" && detail.advanced) parts.push({ label: "Go deeper", text: detail.advanced });
  return parts;
}
