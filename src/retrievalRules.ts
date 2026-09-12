import { HistoricalChangeRecord, RetrievalMatchReason, RetrievalQuery, RetrievedEvidence, RetrievalResult } from "./retrieval.schema.js";

export const RETRIEVAL_RULES = {
  systemOverlapPoints: 3,
  changeTypeMatchPoints: 2,
  technologyMatchPoints: 3,
  dependencyMatchPoints: 3,
  failureModeMatchPoints: 4,
  minimumScore: 5,
  defaultTopK: 3
} as const;

const norm = (value: string) => value.trim().toLowerCase();
const overlap = (left: string[], right: string[]) => {
  const rightSet = new Set(right.map(norm));
  return left.filter(value => rightSet.has(norm(value)));
};

function scoreRecord(query: RetrievalQuery, record: HistoricalChangeRecord): RetrievedEvidence {
  const reasons: RetrievalMatchReason[] = [];
  const add = (type: RetrievalMatchReason["type"], values: string[], points: number) => {
    if (values.length) reasons.push({ type, matchedValues: values, points });
  };
  add("system", overlap(query.systems, record.systems), RETRIEVAL_RULES.systemOverlapPoints);
  add("changeType", query.changeType && record.changeTypes.map(norm).includes(norm(query.changeType)) ? [query.changeType] : [], RETRIEVAL_RULES.changeTypeMatchPoints);
  add("technology", overlap(query.technologies, record.technologies), RETRIEVAL_RULES.technologyMatchPoints);
  add("dependency", overlap(query.dependencies, record.dependencies), RETRIEVAL_RULES.dependencyMatchPoints);
  add("failureMode", overlap(query.failureModes, record.failureModes), RETRIEVAL_RULES.failureModeMatchPoints);
  return { record, score: reasons.reduce((sum, reason) => sum + reason.points, 0), matchReasons: reasons };
}

export function retrieveHistoricalEvidence(query: RetrievalQuery, repository: HistoricalChangeRecord[], topK: number = RETRIEVAL_RULES.defaultTopK): RetrievalResult {
  const scored = repository.map(record => scoreRecord(query, record));
  const suppressed: RetrievalResult["suppressed"] = [];
  const eligible = scored.filter(item => {
    if (item.score < RETRIEVAL_RULES.minimumScore) {
      suppressed.push({ id: item.record.id, reason: "below-threshold" });
      return false;
    }
    return true;
  }).sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id));
  const unique: RetrievedEvidence[] = [];
  const seenGroups = new Map<string, string>();
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
  for (const item of unique.slice(topK)) suppressed.push({ id: item.record.id, reason: "top-k-excluded" });
  return { query, topK, threshold: RETRIEVAL_RULES.minimumScore, items, suppressed };
}
