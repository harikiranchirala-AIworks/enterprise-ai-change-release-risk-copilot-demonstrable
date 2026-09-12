import { ChangeEvidence, DeterministicEvaluation } from "./changeEvidence.schema.js";
import { evaluateSeverity } from "./severityRules.js";
import { evaluateAggregate } from "./aggregateReviewRules.js";

export function evaluateChange(change: ChangeEvidence): DeterministicEvaluation {
  return evaluateAggregate(change.changeId, evaluateSeverity(change));
}
