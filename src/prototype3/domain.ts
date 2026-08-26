export type ObjectiveStatus = "unseen" | "developing" | "secure";

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

export type WorkspaceMeasurement = {
  resistance: number;
  current: number;
};
