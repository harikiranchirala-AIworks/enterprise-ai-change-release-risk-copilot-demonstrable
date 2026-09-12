export const RETRIEVAL_RULES = {
    systemOverlapPoints: 3,
    changeTypeMatchPoints: 2,
    technologyMatchPoints: 3,
    dependencyMatchPoints: 3,
    failureModeMatchPoints: 4,
    minimumScore: 5,
    defaultTopK: 3
};
const norm = (value) => value.trim().toLowerCase();
const overlap = (left, right) => {
    const rightSet = new Set(right.map(norm));
    return left.filter(value => rightSet.has(norm(value)));
};
function scoreRecord(query, record) {
    const reasons = [];
    const add = (type, values, points) => {
        if (values.length)
            reasons.push({ type, matchedValues: values, points });
    };
    add("system", overlap(query.systems, record.systems), RETRIEVAL_RULES.systemOverlapPoints);
    add("changeType", query.changeType && record.changeTypes.map(norm).includes(norm(query.changeType)) ? [query.changeType] : [], RETRIEVAL_RULES.changeTypeMatchPoints);
    add("technology", overlap(query.technologies, record.technologies), RETRIEVAL_RULES.technologyMatchPoints);
    add("dependency", overlap(query.dependencies, record.dependencies), RETRIEVAL_RULES.dependencyMatchPoints);
    add("failureMode", overlap(query.failureModes, record.failureModes), RETRIEVAL_RULES.failureModeMatchPoints);
    return { record, score: reasons.reduce((sum, reason) => sum + reason.points, 0), matchReasons: reasons };
}
export function retrieveHistoricalEvidence(query, repository, topK = RETRIEVAL_RULES.defaultTopK) {
    const scored = repository.map(record => scoreRecord(query, record));
    const suppressed = [];
    const eligible = scored.filter(item => {
        if (item.score < RETRIEVAL_RULES.minimumScore) {
            suppressed.push({ id: item.record.id, reason: "below-threshold" });
            return false;
        }
        return true;
    }).sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id));
    const unique = [];
    const seenGroups = new Map();
    for (const item of eligible) {
        const prior = seenGroups.get(item.record.canonicalGroupId);
        if (prior) {
            suppressed.push({ id: item.record.id, reason: "near-duplicate", relatedTo: prior });
            continue;
        }
        seenGroups.set(item.record.canonicalGroupId, item.record.id);
        unique.push(item);
    }
    const items = unique.slice(0, topK);
    for (const item of unique.slice(topK))
        suppressed.push({ id: item.record.id, reason: "top-k-excluded" });
    return { query, topK, threshold: RETRIEVAL_RULES.minimumScore, items, suppressed };
}
//# sourceMappingURL=retrievalRules.js.map