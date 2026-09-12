import { ChangeEvidence, EvidenceObservation } from "./changeEvidence.schema.js";
import { RetrievedEvidence } from "./retrieval.schema.js";

export interface SynthesisEnvelope {
  currentEvidence: ChangeEvidence;
  deterministicFindings: EvidenceObservation[];
  retrievedHistoricalEvidence: RetrievedEvidence[];
  fixedInstructions: string;
}

export type ReasoningType = "deterministic" | "historical-comparison" | "bounded-synthesis";

export interface SynthesisObservation {
  id: string;
  statement: string;
  severity: "E0" | "E1" | "E2" | "E3";
  evidenceIds: string[];
  reasoningType: ReasoningType;
  confidence: "High" | "Medium";
}

export interface SynthesisOutput {
  riskObservations: SynthesisObservation[];
  missingEvidence: Array<{ statement: string; evidenceIds: string[] }>;
  cabQuestions: Array<{ question: string; evidenceIds: string[] }>;
  rollbackReadiness: "Evidence sufficient for discussion" | "Additional evidence required" | "Significant rollback information missing";
  humanReview: Array<{ statement: string; evidenceIds: string[] }>;
  evidenceTrace: Array<{ observationId: string; evidenceIds: string[] }>;
}

export interface GroundedSynthesisResult {
  status: "accepted" | "failed-closed";
  output?: SynthesisOutput;
  errors: string[];
}
