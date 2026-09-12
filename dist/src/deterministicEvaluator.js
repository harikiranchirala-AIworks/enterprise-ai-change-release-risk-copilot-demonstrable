import { evaluateSeverity } from "./severityRules.js";
import { evaluateAggregate } from "./aggregateReviewRules.js";
export function evaluateChange(change) {
    return evaluateAggregate(change.changeId, evaluateSeverity(change));
}
//# sourceMappingURL=deterministicEvaluator.js.map