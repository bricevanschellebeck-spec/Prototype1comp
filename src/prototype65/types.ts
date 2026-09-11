export type P65SubjectId = "circuits" | "history";
export type P65Goal = "curious" | "understand" | "revise" | "test";
export type P65Depth = "quick" | "learn" | "deep";

export type ActivityFamily = "discover" | "predict-test" | "manipulate-build" | "compare-connect" | "recall-identify" | "apply-solve" | "evidence-reason" | "repair-debug" | "create-demonstrate";
export type ActivityPurpose = "casual" | "focus";
export type ActivityStageRole = "foundation" | "diagnostic" | "explore" | "representation" | "application" | "transfer" | "extension";
export type FreedomLevel = "guided-learning" | "guided-challenge" | "playground";
export type EvidenceChannel = "natural" | "diagnostic" | "self-report";
export type UnderstandingState = "supported" | "uncertain" | "misconception-evidence" | "strong-evidence";
export type AdaptationScale = "micro" | "medium" | "major";
export type GuidanceLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type RepresentationKind = "live-system" | "comparison" | "learner-data" | "timeline" | "cause-network" | "source-evidence";
export type SceneTransition = "preserve" | "reveal" | "attach" | "compare" | "constrain" | "expand";
export type InformationReveal = "immediate" | "after-action" | "after-struggle";
export type ObjectKnowledgeState = "active" | "known" | "future";

export type LearningObjectDetail = {
  id: string;
  label: string;
  definition: string;
  unit?: string;
  mechanism?: string;
  advanced?: string;
};

export type ActivityInformation = {
  activeObjectIds: string[];
  introducedObjectIds: string[];
  revealedAfterActionObjectIds?: string[];
  contextualTargetObjectId?: string;
  contextualExplanation?: string;
  contextualReveal?: InformationReveal;
  contextualRevealByGoal?: Partial<Record<P65Goal, InformationReveal>>;
  evidenceVisibility?: "available" | "withhold-until-commit";
};

export type ActivityEvidenceContract = {
  concept: string;
  learnerAction: string;
  evidenceProduced: string;
  reasonableInference: string;
  excludedInference: string;
  adaptationResponse: string;
};

export type CircuitActivityRuntime = {
  initial?: {
    voltage?: number;
    resistance?: number;
  };
  fixed?: {
    closed?: boolean;
    voltage?: number;
    resistance?: number;
  };
  selectableVoltages?: number[];
  selectableResistances?: number[];
  targetCurrent?: number;
};

export type ReferenceContribution = {
  id: string;
  sectionId: string;
  kind: "component" | "definition" | "relationship" | "formula" | "evidence" | "example" | "summary" | "application";
  title: string;
  body: string;
  status: "introduced" | "explored" | "practised" | "demonstrated";
  relationships?: string[];
  representations?: Array<{ kind: "diagram" | "graph" | "table" | "formula" | "timeline" | "map" | "measurement"; label: string }>;
  supportingFactIds: string[];
  supportingRelationshipIds: string[];
};

export type ReferenceSectionDefinition = {
  id: string;
  conceptId: string;
  title: string;
  order: number;
};

export type ReferenceLearnerEvidence = {
  id: string;
  activityId: string;
  result: EvidenceEvent["result"];
  detail: string;
  measurements: Array<{ input: string; output: string }>;
};

export type LivingReferenceSection = ReferenceSectionDefinition & {
  status: ReferenceContribution["status"];
  canonicalKnowledge: ReferenceContribution[];
  learnerEvidence: ReferenceLearnerEvidence[];
  representations: NonNullable<ReferenceContribution["representations"]>;
  relationships: string[];
  supportingFactIds: string[];
  supportingRelationshipIds: string[];
};

export type LivingReference = {
  subjectId: P65SubjectId;
  subject: string;
  sections: LivingReferenceSection[];
};

export type P65Activity = {
  id: string;
  title: string;
  prompt: string;
  goalPrompts?: Partial<Record<P65Goal, string>>;
  family: ActivityFamily;
  purpose: ActivityPurpose;
  freedom: FreedomLevel;
  interaction: "close-circuit" | "observe-voltage" | "predict-current" | "resistance-lab" | "compare-resistance" | "repair-circuit" | "target-current" | "transfer-current" | "circuit-playground" | "inspect-timeline" | "connect-causes" | "source-evidence" | "build-cause-chain" | "history-playground";
  stageRole: ActivityStageRole;
  technicalLevel: 1 | 2 | 3;
  prerequisiteActivityIds: string[];
  representation: RepresentationKind;
  sceneTransition: SceneTransition;
  adaptationOptions: AdaptationDecision["kind"][];
  conceptIds: string[];
  evidenceChannel: EvidenceChannel;
  evidenceContract: ActivityEvidenceContract;
  circuitRuntime?: CircuitActivityRuntime;
  information: ActivityInformation;
  referenceContributions: ReferenceContribution[];
  eligibleGoals: P65Goal[];
  minimumDepth: P65Depth;
};

export type GoldLesson = {
  id: P65SubjectId;
  subject: string;
  title: string;
  question: string;
  sceneId: "circuit-continuum" | "history-continuum";
  sceneObjects: string[];
  initialObjectIds: string[];
  objectDetails: LearningObjectDetail[];
  palette: "electric" | "archive";
  concepts: Array<{ id: string; label: string }>;
  referenceStructure: ReferenceSectionDefinition[];
  trustedKnowledge: { factIds: string[]; relationshipIds: string[] };
  activities: P65Activity[];
  initialReference: ReferenceContribution[];
  sideBranches: Array<{ id: string; label: string; question: string; answer: string; conceptId: string }>;
};

export type EvidenceEvent = {
  activityId: string;
  conceptIds: string[];
  channel: EvidenceChannel;
  result: "observed" | "supported" | "uncertain" | "misconception" | "strong";
  attempts: number;
  guidanceLevel: GuidanceLevel;
  detail: string;
};

export type ConceptEvidence = {
  conceptId: string;
  state: UnderstandingState;
  observations: string[];
};

export type AdaptationDecision = {
  scale: AdaptationScale;
  kind: "highlight" | "cue" | "comparison" | "constrain-controls" | "change-activity" | "insert-side-branch" | "skip-repetition";
  message: string;
  insertActivityId?: string;
};

export type P65Session = {
  goal: P65Goal;
  depth: P65Depth;
  subjectId: P65SubjectId;
  activityIds: string[];
  completedActivityIds: string[];
  evidence: EvidenceEvent[];
  referenceIds: string[];
};

/** Static P6.5 gold lessons implement this contract; a future AI designer can target it without generating UI code. */
export type P65LearningExperienceBlueprint = {
  subjectId: P65SubjectId;
  persistentSceneId: GoldLesson["sceneId"];
  sceneObjectIds: string[];
  goal: P65Goal;
  depth: P65Depth;
  activities: Array<Pick<P65Activity, "id" | "family" | "purpose" | "freedom" | "stageRole" | "technicalLevel" | "prerequisiteActivityIds" | "representation" | "sceneTransition" | "conceptIds" | "evidenceChannel" | "evidenceContract" | "adaptationOptions" | "information" | "referenceContributions">>;
  sideBranchIds: string[];
};
