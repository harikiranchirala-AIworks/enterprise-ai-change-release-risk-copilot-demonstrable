export type RetrievalMatchType = "system" | "changeType" | "technology" | "dependency" | "failureMode" | "text";

export interface HistoricalChangeRecord {
  id: string;
  sourceRecordId?: string;
  completedAt?: string;
  textTerms?: string[];
  title: string;
  summary: string;
  systems: string[];
  changeTypes: string[];
  technologies: string[];
  dependencies: string[];
  failureModes: string[];
  outcome: "success" | "failed" | "incident" | "unknown";
  sourceSection: string;
  canonicalGroupId: string;
}

export interface RetrievalQuery {
  title?: string;
  systems: string[];
  changeType: string;
  technologies: string[];
  dependencies: string[];
  failureModes: string[];
  currentChangeId?: string;
  plannedStartDate?: string;
  textTerms?: string[];
}

export interface RetrievalMatchReason {
  type: RetrievalMatchType;
  matchedValues: string[];
  points: number;
}

export interface RetrievedEvidence {
  record: HistoricalChangeRecord;
  score: number;
  matchReasons: RetrievalMatchReason[];
}

export interface SameChangeReference {
  record: HistoricalChangeRecord;
  reason: "same-change-reference";
}

export interface RetrievalResult {
  query: RetrievalQuery;
  topK: number;
  threshold: number;
  items: RetrievedEvidence[];
  sameChangeReferences: SameChangeReference[];
  suppressed: Array<{ id: string; reason: "below-threshold" | "top-k-excluded" | "duplicate" | "near-duplicate" | "not-historical"; relatedTo?: string }>;
}
