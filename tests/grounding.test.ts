import { describe, expect, it } from "vitest";
import change from "../fixtures/change-004.json" with { type: "json" };
import { evaluateChange } from "../src/deterministicEvaluator.js";
import { buildSynthesisEnvelope } from "../src/synthesisPrompt.js";
import { runSynthesis } from "../src/providerRoute.js";
import { validateGroundedSynthesis } from "../src/groundingValidator.js";
import { ChangeEvidence } from "../src/changeEvidence.schema.js";

const current = change as ChangeEvidence;
const deterministic = evaluateChange(current);
const envelope = buildSynthesisEnvelope({ currentEvidence: current, deterministicFindings: deterministic.observations, retrievedHistoricalEvidence: [] });
const good = { riskObservations: [{ id:"OBS-1", statement:"The Billing dependency is identified, but its validation is not documented.", severity:"E2", evidenceIds:["RULE:DEP-001"], reasoningType:"deterministic", confidence:"High" }], missingEvidence: [{ statement:"Billing dependency validation is missing.", evidenceIds:["RULE:DEP-001"] }], cabQuestions:[{ question:"Is Billing dependency validation documented?", evidenceIds:["RULE:DEP-001"] }], rollbackReadiness:"Evidence sufficient for discussion", humanReview:[], evidenceTrace:[{ observationId:"OBS-1", evidenceIds:["RULE:DEP-001"] }] };

describe("bounded synthesis and grounding", () => {
  it("accepts a structured, grounded response", () => expect(validateGroundedSynthesis(good, envelope, deterministic).status).toBe("accepted"));
  for (const statement of [
    "This change will cause an outage.",
    "The Payment Gateway dependency is missing.",
    "The vendor caused a previous incident.",
    "This change has high risk because customers will be impacted.",
    "Approve this change.",
    "Reject this change."
  ]) it(`fails closed for hostile claim: ${statement}`, () => {
    const hostile = { ...good, riskObservations: [{ ...good.riskObservations[0], statement }] };
    expect(validateGroundedSynthesis(hostile, envelope, deterministic).status).toBe("failed-closed");
  });
  it("fails closed for unknown evidence IDs", () => {
    const hostile = { ...good, riskObservations: [{ ...good.riskObservations[0], evidenceIds:["RULE:INVENTED"] }] };
    expect(validateGroundedSynthesis(hostile, envelope, deterministic).status).toBe("failed-closed");
  });
  it("fails closed for malformed provider output", async () => {
    const result = await runSynthesis(envelope, deterministic, { generate: async () => "not-json-object" });
    expect(result.status).toBe("failed-closed");
  });
  it("fails closed when the provider is unavailable", async () => {
    const result = await runSynthesis(envelope, deterministic, { generate: async () => { throw new Error("network unavailable"); } });
    expect(result.status).toBe("failed-closed");
  });
  it("fails closed on provider timeout", async () => {
    const result = await runSynthesis(envelope, deterministic, { generate: async (_e, signal) => await new Promise((_resolve, reject) => signal.addEventListener("abort", () => { const error = new Error("aborted"); error.name = "AbortError"; reject(error); })) }, 1);
    expect(result.errors[0]).toContain("timed out");
  });
  it("does not expose a final approval decision in the output contract", () => {
    expect(JSON.stringify(good)).not.toMatch(/approved|rejected|approval|rejection/i);
  });
});
