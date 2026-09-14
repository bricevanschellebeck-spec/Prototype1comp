import type { P6DesignRequest } from "./types";

export const evaluationProfiles: P6DesignRequest[] = [
  { schemaVersion: "p6-design-request-1", sourcePackageId: "circuits-resistance-approved-v1", goal: "explore", depthMinutes: 5, learnerLevel: "intro-secondary" },
  { schemaVersion: "p6-design-request-1", sourcePackageId: "circuits-resistance-approved-v1", goal: "understand", depthMinutes: 15, learnerLevel: "intro-secondary" },
  { schemaVersion: "p6-design-request-1", sourcePackageId: "circuits-resistance-approved-v1", goal: "revise", depthMinutes: 15, learnerLevel: "intro-secondary" },
  { schemaVersion: "p6-design-request-1", sourcePackageId: "circuits-resistance-approved-v1", goal: "test", depthMinutes: 15, learnerLevel: "intro-secondary" },
];

type SignatureStage = {
  stageId: string;
  role: string;
  availability: string;
  objectiveIds?: string[];
  primitive: { kind: string };
};

export type StructuralSignature = {
  primitiveOrder: string[];
  stageRoles: string[];
  supportAlternatives: string[];
  finalApplicationType: string;
  delayedFacts: string[];
  omittedFacts: string[];
};

export function structuralSignatureObject(stages: SignatureStage[], initial: string[], final: string, delayed: string[], omitted: string[]): StructuralSignature {
  const byId = new Map(stages.map((stage) => [stage.stageId, stage]));
  const initialStages = initial.map((stageId) => byId.get(stageId)).filter(Boolean) as SignatureStage[];
  return {
    primitiveOrder: initialStages.map((stage) => stage.primitive.kind),
    stageRoles: initialStages.map((stage) => stage.role),
    supportAlternatives: stages
      .filter((stage) => stage.availability === "support-only")
      .map((stage) => `${stage.role}:${stage.primitive.kind}:${[...(stage.objectiveIds ?? [])].sort().join("+")}`)
      .sort(),
    finalApplicationType: byId.get(final)?.primitive.kind || final,
    delayedFacts: [...delayed].sort(),
    omittedFacts: [...omitted].sort(),
  };
}

export function structuralSignature(stages: SignatureStage[], initial: string[], final: string, delayed: string[], omitted: string[]) {
  return JSON.stringify(structuralSignatureObject(stages, initial, final, delayed, omitted));
}

export function compareStructuralSignatures(left: StructuralSignature, right: StructuralSignature) {
  const same = (a: string[], b: string[]) => JSON.stringify(a) === JSON.stringify(b);
  const dimensions = {
    primitiveOrder: same(left.primitiveOrder, right.primitiveOrder),
    stageRoles: same(left.stageRoles, right.stageRoles),
    supportAlternatives: same(left.supportAlternatives, right.supportAlternatives),
    finalApplicationType: left.finalApplicationType === right.finalApplicationType,
    delayedFacts: same(left.delayedFacts, right.delayedFacts),
    omittedFacts: same(left.omittedFacts, right.omittedFacts),
  };
  return {
    ...dimensions,
    differingDimensions: Object.values(dimensions).filter((value) => !value).length,
    meaningfullyDifferent: Object.values(dimensions).some((value) => !value),
  };
}

export function summarizeWithinGoal(signatures: StructuralSignature[]) {
  if (!signatures.length) return { acceptedRuns: 0, distinctStructures: 0, modalConsistencyPercent: 0 };
  const counts = new Map<string, number>();
  for (const signature of signatures) {
    const serialized = JSON.stringify(signature);
    counts.set(serialized, (counts.get(serialized) ?? 0) + 1);
  }
  return {
    acceptedRuns: signatures.length,
    distinctStructures: counts.size,
    modalConsistencyPercent: Math.round(Math.max(...counts.values()) / signatures.length * 100),
  };
}
