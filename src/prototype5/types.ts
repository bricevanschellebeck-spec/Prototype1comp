export type ModelProfile = "fast" | "quality";
export type LearningGoal = "explore" | "understand" | "revise" | "test";
export type DepthMinutes = 5 | 15 | 30;

export type SourceDocument = {
  schemaVersion: "p5-source-1";
  id: string;
  title: string;
  subject: string;
  language: "en";
  sections: Array<{ id: string; heading: string; text: string }>;
  tables: Array<{
    id: string;
    title: string;
    description: string;
    columns: Array<{ id: string; label: string; unit?: string; valueType: "number" | "text" }>;
    rows: Array<{ id: string; values: Record<string, string | number> }>;
  }>;
};

export type SourceCitation =
  | { kind: "text"; sectionId: string; quote: string }
  | { kind: "table"; tableId: string; rowIds: string[]; columnIds: string[] };

export type SourceAnalysisDraft = {
  schemaVersion: "p5-analysis-1";
  sourceDocumentId: string;
  modelId: string;
  sourceDerived: {
    concepts: Array<{ tempId: string; name: string; citations: SourceCitation[] }>;
    facts: Array<{ tempId: string; statement: string; citations: SourceCitation[] }>;
    relationships: Array<{
      tempId: string;
      fromConceptId: string;
      type: "causes" | "increases" | "decreases" | "part-of" | "sequence" | "compares" | "depends-on";
      toConceptId: string;
      supportingFactIds: string[];
      citations: SourceCitation[];
    }>;
  };
  pedagogical: {
    objectives: Array<{ tempId: string; statement: string; supportingFactIds: string[] }>;
    proposedPrerequisites: Array<{
      objectiveId: string;
      prerequisiteConceptId: string;
      confidence: "low" | "medium" | "high";
      rationale: string;
    }>;
    suggestedMisconceptions: Array<{ tempId: string; description: string; relatedObjectiveIds: string[] }>;
  };
};

export type AnalysisResult = {
  status: "accepted" | "failed";
  profile: ModelProfile;
  providerId: "ollama";
  modelId: string;
  latencyMs: number;
  correctionAttempted: boolean;
  draft?: SourceAnalysisDraft;
  validationErrors: string[];
  failureReason?: string;
  rawMetrics: { received: boolean; parsed: boolean; schemaValid: boolean; semanticValid: boolean };
};

export type ReviewKind = "concept" | "fact" | "relationship" | "objective" | "prerequisite" | "misconception";
export type ReviewCandidate = {
  id: string;
  model: ModelProfile;
  modelId: string;
  kind: ReviewKind;
  label: string;
  citations: SourceCitation[];
  payload: unknown;
};
export type ComparisonGroup = {
  id: string;
  kind: ReviewKind;
  status: "agreement" | "fast-only" | "quality-only" | "conflict";
  candidates: ReviewCandidate[];
};

export type ApprovedLearningSpec = {
  schemaVersion: "p5-approved-spec-1";
  sourceDocumentId: string;
  concepts: Array<{ id: string; name: string; citations: SourceCitation[] }>;
  facts: Array<{ id: string; statement: string; citations: SourceCitation[] }>;
  relationships: Array<{
    id: string;
    fromConceptId: string;
    type: SourceAnalysisDraft["sourceDerived"]["relationships"][number]["type"];
    toConceptId: string;
    supportingFactIds: string[];
    citations: SourceCitation[];
  }>;
  objectives: Array<{ id: string; statement: string; supportingFactIds: string[] }>;
  prerequisites: Array<{ objectiveId: string; prerequisiteConceptId: string; confidence: "low" | "medium" | "high"; rationale: string }>;
  misconceptions: Array<{ id: string; description: string; relatedObjectiveIds: string[] }>;
  approvalReceipt: Array<{ comparisonGroupId: string; candidateId: string }>;
};

export type PrimitiveId = "prediction" | "parameter-experiment" | "comparison" | "data-plot" | "classification" | "step-sequence" | "evidence-reveal" | "target-challenge";
export type BlockRole = "evidence" | "explore" | "represent" | "support" | "apply" | "transfer";

export type FactoryConfig =
  | { kind: "prediction"; relationshipId: string }
  | { kind: "parameter-experiment"; tableId: string; inputColumnId: string; outputColumnId: string }
  | { kind: "data-plot"; tableId: string; xColumnId: string; yColumnId: string }
  | { kind: "comparison"; tableId: string; rowIds: string[]; columnIds: string[] }
  | { kind: "classification"; categoryConceptIds: string[]; itemFactIds: string[] }
  | { kind: "step-sequence"; relationshipIds: string[] }
  | { kind: "evidence-reveal"; factIds: string[] }
  | { kind: "target-challenge"; tableId: string; heldOutRowId: string; predictionColumnId: string };

export type RepresentationProposal = {
  tempId: string;
  primitiveId: PrimitiveId;
  role: BlockRole;
  supportingFactIds: string[];
  relationshipIds: string[];
  factoryConfig: FactoryConfig;
};

export type RepresentationPlanDraft = {
  schemaVersion: "p5-representations-1";
  sourceDocumentId: string;
  objectivePlans: Array<{
    objectiveId: string;
    representationGap: boolean;
    gapReason?: string;
    proposals: RepresentationProposal[];
  }>;
};

export type PlanningResult = {
  status: "accepted" | "failed";
  profile: ModelProfile;
  providerId: "ollama";
  modelId: string;
  latencyMs: number;
  correctionAttempted: boolean;
  draft?: RepresentationPlanDraft;
  validationErrors: string[];
  failureReason?: string;
};

export type BlockOutcome = {
  blockId: string;
  result: "correct" | "incorrect" | "completed";
  attempts: number;
  hintUsed: boolean;
  misconceptionIds: string[];
};

export type CompiledBlock = {
  id: string;
  title: string;
  prompt: string;
  primitiveId: PrimitiveId;
  role: BlockRole;
  objectiveIds: string[];
  supportingFactIds: string[];
  relationshipIds: string[];
  sourceCitations: SourceCitation[];
  estimatedMinutes: number;
  possibleMisconceptionIds: string[];
  render: FactoryConfig;
};

export type CompiledLessonManifest = {
  schemaVersion: "p5-compiled-lesson-1";
  id: string;
  sourceDocumentId: string;
  title: string;
  subject: string;
  concepts: ApprovedLearningSpec["concepts"];
  facts: ApprovedLearningSpec["facts"];
  relationships: ApprovedLearningSpec["relationships"];
  objectives: ApprovedLearningSpec["objectives"];
  misconceptions: ApprovedLearningSpec["misconceptions"];
  blocks: CompiledBlock[];
  fallbackPath: string[];
  provenanceReceipt: Array<{ blockId: string; factIds: string[]; citations: SourceCitation[] }>;
};

export type ReasonCode = "elicit-existing-model" | "test-through-manipulation" | "offer-alternate-representation" | "respond-to-misconception" | "provide-guided-retry" | "connect-evidence-to-concept" | "increase-challenge" | "confirm-transfer";
export type P5Blueprint = {
  blueprintVersion: "p5-1";
  lessonId: string;
  remainingSteps: Array<{ blockId: string; reasonCode: ReasonCode }>;
};
export type P5ComposeResponse = {
  blueprint: P5Blueprint;
  source: "ollama" | "deterministic-fallback";
  model: string | null;
  latencyMs: number;
  legalCandidateIds: string[];
  validationErrors: string[];
  fallbackReason?: string;
};

export type PrimitiveFactoryDescription = {
  primitiveId: PrimitiveId;
  purpose: string;
  allowedConfigKind: FactoryConfig["kind"];
};
