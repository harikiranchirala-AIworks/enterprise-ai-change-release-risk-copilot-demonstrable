const banned = /\b(will cause|will fail|likely to fail|high risk|safe|unsafe|approved|approve|rejected|reject|outage will|caused an outage)\b/i;
const tokenise = (text) => new Set(text.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(t => t.length > 3));
const hasSupport = (statement, evidence) => {
    const claim = tokenise(statement);
    const source = tokenise(evidence);
    let overlap = 0;
    for (const token of claim)
        if (source.has(token))
            overlap++;
    return overlap >= 2 && overlap / Math.max(claim.size, 1) >= 0.6;
};
function isRecord(value) { return !!value && typeof value === "object" && !Array.isArray(value); }
function stringArray(value) { return Array.isArray(value) && value.every(x => typeof x === "string"); }
export function validateGroundedSynthesis(raw, envelope, deterministic) {
    const errors = [];
    if (!isRecord(raw))
        return { status: "failed-closed", errors: ["Response is not an object."] };
    const required = ["riskObservations", "missingEvidence", "cabQuestions", "rollbackReadiness", "humanReview", "evidenceTrace"];
    for (const key of Object.keys(raw))
        if (!required.includes(key))
            errors.push(`Unexpected response field: ${key}.`);
    for (const key of required)
        if (!(key in raw))
            errors.push(`Missing required field: ${key}.`);
    if (errors.length)
        return { status: "failed-closed", errors };
    if (!Array.isArray(raw.riskObservations) || !Array.isArray(raw.missingEvidence) || !Array.isArray(raw.cabQuestions) || !Array.isArray(raw.humanReview) || !Array.isArray(raw.evidenceTrace))
        return { status: "failed-closed", errors: ["One or more response arrays are malformed."] };
    if (!["Evidence sufficient for discussion", "Additional evidence required", "Significant rollback information missing"].includes(String(raw.rollbackReadiness)))
        errors.push("Invalid rollbackReadiness.");
    const evidenceText = new Map();
    const current = JSON.stringify(envelope.currentEvidence);
    evidenceText.set("CURRENT:changeEvidence", current);
    for (const finding of envelope.deterministicFindings)
        evidenceText.set(`RULE:${finding.code}`, `${finding.statement} ${finding.title} ${finding.evidencePaths.join(" ")}`);
    for (const item of envelope.retrievedHistoricalEvidence)
        evidenceText.set(`HIST:${item.record.id}`, `${item.record.title} ${item.record.summary} ${item.record.systems.join(" ")} ${item.record.dependencies.join(" ")} ${item.record.failureModes.join(" ")}`);
    const validEvidence = (ids, statement, field) => {
        if (!stringArray(ids) || ids.length === 0) {
            errors.push(`${field} must contain at least one evidence ID.`);
            return;
        }
        if (typeof statement !== "string" || !statement.trim()) {
            errors.push(`${field} statement must be non-empty.`);
            return;
        }
        if (banned.test(statement))
            errors.push(`${field} contains forbidden decision or unsupported-failure language.`);
        for (const id of ids) {
            const source = evidenceText.get(id);
            if (!source)
                errors.push(`${field} references unknown evidence ID: ${id}.`);
            else if (!hasSupport(statement, source))
                errors.push(`${field} is not lexically supported by its cited evidence: ${id}.`);
        }
    };
    for (const item of raw.riskObservations) {
        if (!isRecord(item)) {
            errors.push("Malformed risk observation.");
            continue;
        }
        if (!stringArray(item.evidenceIds) || !["E0", "E1", "E2", "E3"].includes(String(item.severity)))
            errors.push("Risk observation has invalid severity or evidence IDs.");
        validEvidence(item.evidenceIds, item.statement, "riskObservation");
    }
    for (const item of raw.missingEvidence)
        if (isRecord(item))
            validEvidence(item.evidenceIds, item.statement, "missingEvidence");
        else
            errors.push("Malformed missingEvidence item.");
    for (const item of raw.cabQuestions)
        if (isRecord(item))
            validEvidence(item.evidenceIds, item.question, "cabQuestion");
        else
            errors.push("Malformed cabQuestion item.");
    for (const item of raw.humanReview)
        if (isRecord(item))
            validEvidence(item.evidenceIds, item.statement, "humanReview");
        else
            errors.push("Malformed humanReview item.");
    const tracedObservationIds = new Set(raw.evidenceTrace.filter(isRecord).map(item => item.observationId).filter((id) => typeof id === "string"));
    for (const item of raw.riskObservations)
        if (isRecord(item) && typeof item.id === "string" && !tracedObservationIds.has(item.id))
            errors.push(`Material observation ${item.id} is missing an evidence trace.`);
    const output = raw;
    if (errors.length)
        return { status: "failed-closed", errors };
    return { status: "accepted", output, errors: [] };
}
export function groundingEvidenceIds(envelope) {
    return ["CURRENT:changeEvidence", ...envelope.deterministicFindings.map((f) => `RULE:${f.code}`), ...envelope.retrievedHistoricalEvidence.map((h) => `HIST:${h.record.id}`)];
}
//# sourceMappingURL=groundingValidator.js.map