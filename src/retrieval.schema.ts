export type RetrievalMatchType = "system" | "changeType" | "technology" | "dependency" | "failureMode";

export interface HistoricalChangeRecord {
  id: string;
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
  systems: string[];
  changeType: string;
  technologies: string[];
  dependencies: string[];
  failureModes: string[];
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

export interface RetrievalResult {
  query: RetrievalQuery;
  topK: number;
  threshold: number;
  items: RetrievedEvidence[];
  suppressed: Array<{ id: string; reason: "below-threshold" | "top-k-excluded" | "duplicate" | "near-duplicate"; relatedTo?: string }>;
}
