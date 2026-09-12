import { beforeAll, describe, expect, it } from "vitest";
import { day6Dataset, runDay6Evaluation } from "../src/day6Evaluation.js";

describe("Day 6 evaluation, red-team, and UAT baseline", () => {
  let report: Awaited<ReturnType<typeof runDay6Evaluation>>;
  beforeAll(async () => { report = await runDay6Evaluation(); });
  it("contains the required 15-20 synthetic evaluation scenarios", () => expect(day6Dataset.length).toBe(18));
  it("matches all deterministic gold expectations", () => expect(report.cases.every(item => item.pass)).toBe(true));
  it("achieves 100% groundedness", () => expect(report.metrics.groundednessPercent).toBe(100));
  it("meets critical-gap recall threshold", () => expect(report.metrics.criticalGapRecallPercent).toBeGreaterThanOrEqual(90));
  it("keeps clean-case false positives below threshold", () => expect(report.metrics.falsePositiveRatePercent).toBeLessThan(10));
  it("meets retrieval relevance threshold and suppresses misleading history", () => expect(report.metrics.retrievalRelevancePercent).toBeGreaterThanOrEqual(80));
  it("records scenario-based CAB usefulness at or above threshold", () => expect(report.metrics.cabQuestionUsefulnessScore).toBeGreaterThanOrEqual(4));
  it("passes every adversarial scenario in the evaluation set", () => expect(report.metrics.adversarialPassed).toBe(report.metrics.adversarialTotal));
});
