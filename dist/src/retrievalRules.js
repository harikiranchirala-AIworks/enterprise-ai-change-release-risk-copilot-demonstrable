export const RETRIEVAL_RULES = {
    systemOverlapPoints: 3,
    changeTypeMatchPoints: 2,
    technologyMatchPoints: 3,
    dependencyMatchPoints: 3,
    failureModeMatchPoints: 4,
    textMatchPoints: 1,
    maxTextMatchTerms: 3,
    exactTitleMatchPoints: 3,
    minimumScore: 5,
    defaultTopK: 3
};
const norm = (value) => value.trim().toLowerCase();
const overlap = (left, right) => {
    const rightSet = new Set(right.map(norm));
    return left.filter(value => rightSet.has(norm(value)));
};
const tokenOverlap = (left = [], right = []) => overlap(left, right).slice(0, RETRIEVAL_RULES.maxTextMatchTerms);
const titleKey = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
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
    if (query.title && titleKey(query.title) === titleKey(record.title))
        add("text", ["exact-title"], RETRIEVAL_RULES.exactTitleMatchPoints);
    else
        add("text", tokenOverlap(query.textTerms, record.textTerms), RETRIEVAL_RULES.textMatchPoints);
    const score = reasons.reduce((sum, reason) => sum + reason.points, 0);
    const availablePoints = (query.systems.length ? RETRIEVAL_RULES.systemOverlapPoints : 0) + (query.changeType ? RETRIEVAL_RULES.changeTypeMatchPoints : 0) + (query.technologies.length ? RETRIEVAL_RULES.technologyMatchPoints : 0) + (query.dependencies.length ? RETRIEVAL_RULES.dependencyMatchPoints : 0) + (query.failureModes.length ? RETRIEVAL_RULES.failureModeMatchPoints : 0) + (query.title || query.textTerms?.length ? RETRIEVAL_RULES.exactTitleMatchPoints : 0);
    return { record, score, matchPercent: availablePoints ? Math.round((score / availablePoints) * 100) : 0, matchReasons: reasons };
}
export function retrieveHistoricalEvidence(query, repository, topK = RETRIEVAL_RULES.defaultTopK) {
    const sameChangeReferences = [];
    const scored = repository.filter(record => {
        if (query.currentChangeId && [record.id, record.sourceRecordId].includes(query.currentChangeId)) {
            sameChangeReferences.push({ record, reason: "same-change-reference" });
            return false;
        }
        return true;
    }).map(record => scoreRecord(query, record));
    const suppressed = [];
    const eligible = scored.filter(item => {
        if (query.plannedStartDate && item.record.completedAt && new Date(item.record.completedAt) >= new Date(query.plannedStartDate)) {
            suppressed.push({ id: item.record.id, reason: "not-historical" });
            return false;
        }
        if (item.score < RETRIEVAL_RULES.minimumScore) {
            suppressed.push({ id: item.record.id, reason: "below-threshold" });
            return false;
        }
        return true;
    }).sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id));
    const nearMatches = scored.filter(item => item.score > 0 && item.score < RETRIEVAL_RULES.minimumScore).sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id)).slice(0, topK);
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
    return { query, topK, threshold: RETRIEVAL_RULES.minimumScore, items, nearMatches, sameChangeReferences, suppressed };
}
//# sourceMappingURL=retrievalRules.js.map