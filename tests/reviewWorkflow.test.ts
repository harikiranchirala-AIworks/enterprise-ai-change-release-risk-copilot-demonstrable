import { describe, expect, it } from "vitest";
import { applyReviewAction, createReviewSession, isChangeApproved, recordAnalysisFailure } from "../src/reviewWorkflow.js";
import { SynthesisOutput } from "../src/synthesis.schema.js";
import { DeterministicEvaluation } from "../src/changeEvidence.schema.js";

const synthesis = { riskObservations: [], missingEvidence: [], cabQuestions: [], rollbackReadiness: "Evidence sufficient for discussion", humanReview: [], evidenceTrace: [] } as SynthesisOutput;
const deterministic = { changeId: "CHG-001", observations: [], aggregateReviewState: "AR0", aggregateFlags: [], aggregateReason: "No evidence gaps were identified by deterministic checks." } as DeterministicEvaluation;
const make = () => createReviewSession("S", "A", synthesis, deterministic, "v1");

describe("human review workflow", () => {
  it("supports review, edit, comment, and accept-for-CAB", () => {
    let s = applyReviewAction(make(), "review", "v1"); s = applyReviewAction(s, "edit", "v1", undefined, { targetId: "OBS-1", text: "Clarified wording" }); s = applyReviewAction(s, "comment", "v1", "Please confirm owner."); s = applyReviewAction(s, "accept_for_cab", "v1");
    expect(s.currentState).toBe("ACCEPTED_FOR_CAB"); expect(s.reviewerEdits).toHaveLength(1); expect(s.reviewerComments).toEqual(["Please confirm owner."]); expect(isChangeApproved(s)).toBe(false);
  });
  it("supports send-back, discard, and additional evidence actions", () => { expect(applyReviewAction(make(), "send_back", "v1").currentState).toBe("SENT_BACK"); expect(applyReviewAction(make(), "discard", "v1").currentState).toBe("DISCARDED"); expect(applyReviewAction(make(), "request_additional_evidence", "v1").currentState).toBe("ADDITIONAL_EVIDENCE_REQUESTED"); });
  it("blocks decision actions on a changed package", () => { const s = applyReviewAction(make(), "accept_for_cab", "v2"); expect(s.currentState).toBe("STALE_ANALYSIS"); expect(s.failure?.code).toBe("STALE_OR_CHANGED_PACKAGE"); });
  it("supports retry and re-analysis after stale detection", () => { let s = applyReviewAction(make(), "accept_for_cab", "v2"); s = applyReviewAction(s, "retry_reanalyze", "v2"); expect(s.currentState).toBe("REANALYZE_REQUESTED"); expect(s.failure).toBeUndefined(); });
  it.each([["PROVIDER_TIMEOUT"], ["MALFORMED_RESPONSE"], ["NO_RELEVANT_HISTORY"], ["GROUNDING_FAILURE"], ["PARTIAL_ANALYSIS"]] as const)("records explicit %s failure", code => expect(recordAnalysisFailure(make(), code, "Action required.").failure?.code).toBe(code));
});
