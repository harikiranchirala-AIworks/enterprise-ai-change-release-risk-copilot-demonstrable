const now = () => new Date().toISOString();
const decisionActions = new Set(["accept_for_cab", "discard", "send_back", "request_additional_evidence"]);
export function createReviewSession(sessionId, analysisId, synthesis, deterministic, sourceFingerprint) {
    return { sessionId, analysisId, immutableAnalysis: { synthesis, deterministic }, sourceFingerprint, currentState: "ANALYSIS_GENERATED", reviewerComments: [], reviewerEdits: [], events: [] };
}
export function applyReviewAction(session, action, currentFingerprint, note, edit) {
    const next = { ...session, reviewerComments: [...session.reviewerComments], reviewerEdits: [...session.reviewerEdits], events: [...session.events] };
    if (decisionActions.has(action) && currentFingerprint !== session.sourceFingerprint) {
        next.currentState = "STALE_ANALYSIS";
        next.failure = { code: "STALE_OR_CHANGED_PACKAGE", message: "The change package changed after this analysis was generated. Re-analyze before taking a review action.", retryable: true };
        next.events.push({ action: "stale_detected", at: now() });
        return next;
    }
    if (action === "review")
        next.currentState = "REVIEWED_BY_USER";
    if (action === "edit") {
        next.currentState = "USER_EDITED";
        if (edit)
            next.reviewerEdits.push(edit);
    }
    if (action === "comment" && note)
        next.reviewerComments.push(note);
    if (action === "accept_for_cab")
        next.currentState = "ACCEPTED_FOR_CAB";
    if (action === "discard")
        next.currentState = "DISCARDED";
    if (action === "send_back")
        next.currentState = "SENT_BACK";
    if (action === "request_additional_evidence")
        next.currentState = "ADDITIONAL_EVIDENCE_REQUESTED";
    if (action === "retry_reanalyze") {
        next.currentState = "REANALYZE_REQUESTED";
        next.failure = undefined;
    }
    next.events.push({ action, at: now(), reviewerNote: note });
    return next;
}
export function recordAnalysisFailure(session, code, message, retryable = true) {
    return { ...session, failure: { code, message, retryable }, events: [...session.events, { action: "failure", at: now(), reviewerNote: message }] };
}
export function isAcceptedForCab(session) { return session.currentState === "ACCEPTED_FOR_CAB"; }
export function isChangeApproved(_session) { return false; }
//# sourceMappingURL=reviewWorkflow.js.map