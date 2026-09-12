import { DeterministicEvaluation } from "./changeEvidence.schema.js";
import { SynthesisOutput } from "./synthesis.schema.js";

export type ReviewState = "ANALYSIS_GENERATED" | "REVIEWED_BY_USER" | "USER_EDITED" | "ACCEPTED_FOR_CAB" | "DISCARDED" | "SENT_BACK" | "ADDITIONAL_EVIDENCE_REQUESTED" | "STALE_ANALYSIS" | "REANALYZE_REQUESTED";
export type FailureCode = "PROVIDER_TIMEOUT" | "MALFORMED_RESPONSE" | "NO_RELEVANT_HISTORY" | "GROUNDING_FAILURE" | "PARTIAL_ANALYSIS" | "STALE_OR_CHANGED_PACKAGE";
export type ReviewAction = "review" | "edit" | "comment" | "accept_for_cab" | "discard" | "send_back" | "request_additional_evidence" | "retry_reanalyze";

export interface ReviewEvent { action: ReviewAction | "failure" | "stale_detected"; at: string; reviewerNote?: string; }
export interface ReviewSession {
  sessionId: string;
  analysisId: string;
  immutableAnalysis: { synthesis: SynthesisOutput; deterministic: DeterministicEvaluation };
  sourceFingerprint: string;
  currentState: ReviewState;
  reviewerComments: string[];
  reviewerEdits: Array<{ targetId: string; text: string }>;
  failure?: { code: FailureCode; message: string; retryable: boolean };
  events: ReviewEvent[];
}

const now = () => new Date().toISOString();
const decisionActions = new Set<ReviewAction>(["accept_for_cab", "discard", "send_back", "request_additional_evidence"]);

export function createReviewSession(sessionId: string, analysisId: string, synthesis: SynthesisOutput, deterministic: DeterministicEvaluation, sourceFingerprint: string): ReviewSession {
  return { sessionId, analysisId, immutableAnalysis: { synthesis, deterministic }, sourceFingerprint, currentState: "ANALYSIS_GENERATED", reviewerComments: [], reviewerEdits: [], events: [] };
}

export function applyReviewAction(session: ReviewSession, action: ReviewAction, currentFingerprint: string, note?: string, edit?: { targetId: string; text: string }): ReviewSession {
  const next: ReviewSession = { ...session, reviewerComments: [...session.reviewerComments], reviewerEdits: [...session.reviewerEdits], events: [...session.events] };
  if (decisionActions.has(action) && currentFingerprint !== session.sourceFingerprint) {
    next.currentState = "STALE_ANALYSIS"; next.failure = { code: "STALE_OR_CHANGED_PACKAGE", message: "The change package changed after this analysis was generated. Re-analyze before taking a review action.", retryable: true }; next.events.push({ action: "stale_detected", at: now() }); return next;
  }
  if (action === "review") next.currentState = "REVIEWED_BY_USER";
  if (action === "edit") { next.currentState = "USER_EDITED"; if (edit) next.reviewerEdits.push(edit); }
  if (action === "comment" && note) next.reviewerComments.push(note);
  if (action === "accept_for_cab") next.currentState = "ACCEPTED_FOR_CAB";
  if (action === "discard") next.currentState = "DISCARDED";
  if (action === "send_back") next.currentState = "SENT_BACK";
  if (action === "request_additional_evidence") next.currentState = "ADDITIONAL_EVIDENCE_REQUESTED";
  if (action === "retry_reanalyze") { next.currentState = "REANALYZE_REQUESTED"; next.failure = undefined; }
  next.events.push({ action, at: now(), reviewerNote: note });
  return next;
}

export function recordAnalysisFailure(session: ReviewSession, code: FailureCode, message: string, retryable = true): ReviewSession {
  return { ...session, failure: { code, message, retryable }, events: [...session.events, { action: "failure", at: now(), reviewerNote: message }] };
}

export function isAcceptedForCab(session: ReviewSession): boolean { return session.currentState === "ACCEPTED_FOR_CAB"; }
export function isChangeApproved(_session: ReviewSession): false { return false; }
