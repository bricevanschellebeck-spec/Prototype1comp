import { referenceContributionsForOutcome } from "./evidence";
import type { SceneState } from "./Scenes";
import type {
  EvidenceEvent,
  GoldLesson,
  LivingReference,
  LivingReferenceSection,
  P65Activity,
  P65Depth,
  P65Goal,
  ReferenceContribution,
  ReferenceLearnerEvidence,
} from "./types";

const statusRank: Record<ReferenceContribution["status"], number> = {
  introduced: 1,
  explored: 2,
  practised: 3,
  demonstrated: 4,
};

export function emptyLivingReference(lesson: GoldLesson): LivingReference {
  return { subjectId: lesson.id, subject: lesson.subject, sections: [] };
}

function measurementsFor(activity: P65Activity, scene: SceneState): ReferenceLearnerEvidence["measurements"] {
  if (activity.interaction === "observe-voltage") {
    const resistance = activity.circuitRuntime?.fixed?.resistance ?? scene.circuits.resistance;
    return scene.circuits.voltageObservations.map((voltage) => ({ input: `${voltage} V · ${resistance} Ω`, output: `${(voltage / resistance).toFixed(2)} A` }));
  }
  if (activity.interaction === "resistance-lab") {
    return scene.circuits.measurements.map((resistance) => ({ input: `${resistance} Ω · ${scene.circuits.voltage} V`, output: `${(scene.circuits.voltage / resistance).toFixed(2)} A` }));
  }
  if (activity.interaction === "target-current") return [{ input: "9 V · 6 Ω", output: "1.50 A" }];
  if (activity.interaction === "transfer-current") return [{ input: "12 V · 6 Ω", output: "2.00 A" }];
  return [];
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function uniqueRepresentations(items: NonNullable<ReferenceContribution["representations"]>) {
  const byKey = new Map(items.map((item) => [`${item.kind}:${item.label}`, item]));
  return [...byKey.values()];
}

export function validateReferenceContribution(lesson: GoldLesson, contribution: ReferenceContribution): string[] {
  const issues: string[] = [];
  if (!lesson.referenceStructure.some((section) => section.id === contribution.sectionId)) issues.push(`Unknown reference section ${contribution.sectionId}.`);
  for (const factId of contribution.supportingFactIds) if (!lesson.trustedKnowledge.factIds.includes(factId)) issues.push(`Unknown supporting fact ${factId}.`);
  for (const relationshipId of contribution.supportingRelationshipIds) if (!lesson.trustedKnowledge.relationshipIds.includes(relationshipId)) issues.push(`Unknown supporting relationship ${relationshipId}.`);
  if (!contribution.supportingFactIds.length && !contribution.supportingRelationshipIds.length) issues.push(`Reference item ${contribution.id} has no trusted support.`);
  return issues;
}

export function addReferenceKnowledge(options: {
  reference: LivingReference;
  lesson: GoldLesson;
  activity: P65Activity;
  event: EvidenceEvent;
  goal: P65Goal;
  depth: P65Depth;
  hasPriorGap?: boolean;
  scene: SceneState;
}): { reference: LivingReference; addedSectionIds: string[] } {
  const { reference, lesson, activity, event, goal, depth, hasPriorGap = false, scene } = options;
  const contributions = referenceContributionsForOutcome(activity, event, goal, depth, hasPriorGap);
  const valid = contributions.filter((item) => validateReferenceContribution(lesson, item).length === 0);
  const byId = new Map(reference.sections.map((section) => [section.id, section]));
  const addedSectionIds: string[] = [];

  for (const contribution of valid) {
    const definition = lesson.referenceStructure.find((section) => section.id === contribution.sectionId);
    if (!definition) continue;
    const previous = byId.get(definition.id);
    const canonicalKnowledge = previous?.canonicalKnowledge ?? [];
    const alreadyKnown = canonicalKnowledge.some((item) => item.id === contribution.id);
    const learnerEvidence = previous?.learnerEvidence ?? [];
    const evidenceId = `${activity.id}:${event.detail}`;
    const shouldAttachEvidence = contribution.status !== "introduced" || contribution.kind === "evidence" || contribution.representations?.some((item) => ["measurement", "graph", "timeline"].includes(item.kind));
    const nextEvidence = shouldAttachEvidence && !learnerEvidence.some((item) => item.id === evidenceId)
      ? [...learnerEvidence, { id: evidenceId, activityId: activity.id, result: event.result, detail: event.detail, measurements: measurementsFor(activity, scene) }]
      : learnerEvidence;
    const next: LivingReferenceSection = {
      ...definition,
      status: previous && statusRank[previous.status] > statusRank[contribution.status] ? previous.status : contribution.status,
      canonicalKnowledge: alreadyKnown ? canonicalKnowledge : [...canonicalKnowledge, contribution],
      learnerEvidence: nextEvidence,
      representations: uniqueRepresentations([...(previous?.representations ?? []), ...(contribution.representations ?? [])]),
      relationships: unique([...(previous?.relationships ?? []), ...(contribution.relationships ?? [])]),
      supportingFactIds: unique([...(previous?.supportingFactIds ?? []), ...contribution.supportingFactIds]),
      supportingRelationshipIds: unique([...(previous?.supportingRelationshipIds ?? []), ...contribution.supportingRelationshipIds]),
    };
    byId.set(definition.id, next);
    if (!previous) addedSectionIds.push(definition.id);
  }

  return {
    reference: { ...reference, sections: [...byId.values()].sort((a, b) => a.order - b.order) },
    addedSectionIds,
  };
}

export function referenceAvailable(goal: P65Goal, activity: P65Activity | undefined, evidence: EvidenceEvent[]) {
  if (goal !== "test" || !activity || activity.evidenceChannel !== "diagnostic") return true;
  return evidence.some((event) => event.activityId === activity.id);
}
