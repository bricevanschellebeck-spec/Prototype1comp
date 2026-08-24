export type ObjectiveStatus = "unseen" | "developing" | "secure";

export type BlockPurpose =
  | "introduce"
  | "explore"
  | "check"
  | "remediate"
  | "apply";

export type SelectionRole =
  | "core"
  | "remediation"
  | "guided-practice"
  | "retry";

export type BlockContent =
  | { kind: "complete-circuit"; voltage: number }
  | { kind: "voltage-discovery"; voltage: number }
  | {
      kind: "resistance-diagnostic";
      voltage: number;
      initialResistance: number;
      targetResistance: number;
    }
  | { kind: "misconception-visual" }
  | {
      kind: "guided-resistance";
      voltage: number;
      resistanceValues: number[];
    }
  | {
      kind: "equivalent-retry";
      voltage: number;
      firstResistance: number;
      secondResistance: number;
    }
  | {
      kind: "relationship-graph";
      voltage: number;
      resistanceValues: number[];
    }
  | {
      kind: "target-current";
      voltage: number;
      targetCurrent: number;
      resistanceOptions: number[];
    }
  | {
      kind: "circuit-design";
      voltage: number;
      targetCurrent: number;
      resistanceOptions: number[];
    };

export type LearningBlock = {
  id: string;
  title: string;
  objectiveIds: string[];
  prerequisiteObjectiveIds: string[];
  difficulty: 1 | 2 | 3;
  purpose: BlockPurpose;
  selectionRole: SelectionRole;
  interactionType: string;
  modality: string[];
  misconceptionsAddressed: string[];
  estimatedMinutes: number;
  priority: number;
  content: BlockContent;
};

export type BlockOutcome = {
  blockId: string;
  objectiveIds: string[];
  completed: boolean;
  correct?: boolean;
  attempts: number;
  hintUsed: boolean;
  misconceptionIds: string[];
};

export type LearnerState = {
  objectiveStatus: Record<string, ObjectiveStatus>;
  activeMisconceptionIds: string[];
  completedBlockIds: string[];
  recentInteractionTypes: string[];
  lastOutcome?: BlockOutcome;
};

export type CandidateEvaluation = {
  blockId: string;
  title: string;
  eligible: boolean;
  score: number;
  reasonCodes: string[];
};

export type NextBlockDecision = {
  status: "selected" | "complete" | "blocked";
  selectedBlockId: string | null;
  targetObjectiveId: string | null;
  candidates: CandidateEvaluation[];
  reasonCodes: string[];
};

export type PathStep = {
  blockId: string;
  decision: NextBlockDecision;
  outcome?: BlockOutcome;
};
