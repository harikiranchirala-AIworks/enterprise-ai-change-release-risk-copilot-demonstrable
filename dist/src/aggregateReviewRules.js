const rank = { AR0: 0, AR1: 1, AR2: 2, AR3: 3 };
const maxState = (a, b) => rank[a] >= rank[b] ? a : b;
export function evaluateAggregate(changeId, observations) {
    let state = "AR0";
    const flags = [];
    const e3 = observations.filter(o => o.severity === "E3");
    const e2 = observations.filter(o => o.severity === "E2");
    const e1 = observations.filter(o => o.severity === "E1");
    if (e1.length)
        state = "AR1";
    if (e2.length)
        state = "AR2";
    if (e3.length)
        state = "AR3";
    if (e2.length >= 2)
        flags.push("Multiple Material Evidence Gaps");
    const rollbackCodes = new Set(e2.map(o => o.code));
    if (rollbackCodes.has("RB-002") && rollbackCodes.has("RB-003")) {
        state = maxState(state, "AR3");
        flags.push("Critical rollback-governance interaction");
    }
    const criticalDomains = new Set(["Rollback / Recovery", "Security", "Data", "Business Impact", "Dependencies"]);
    if (e2.length >= 3 && e2.filter(o => criticalDomains.has(o.domain)).length >= 3) {
        state = maxState(state, "AR3");
        flags.push("Critical-domain concentration");
    }
    if (e1.length >= 3) {
        state = maxState(state, "AR2");
        flags.push("Multiple minor gaps across mandatory evidence");
    }
    const reason = state === "AR0" ? "No evidence gaps were identified by deterministic checks." : state === "AR1" ? "Minor clarification gaps were identified; the package remains broadly reviewable." : state === "AR2" ? "Additional evidence is required for a well-supported CAB review." : "Mandatory human review is required because critical evidence is absent or interacting material gaps remove a critical control.";
    return { changeId, observations, aggregateReviewState: state, aggregateFlags: flags, aggregateReason: reason };
}
//# sourceMappingURL=aggregateReviewRules.js.map