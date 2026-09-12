import { describe, expect, it } from "vitest";
import { historicalRepository } from "../src/historicalRepository.js";
import { retrieveHistoricalEvidence } from "../src/retrievalRules.js";

const middlewareQuery = { systems: ["CRM", "API Gateway"], changeType: "planned", technologies: ["CRM middleware", "certificate"], dependencies: ["API Gateway"], failureModes: ["expired certificate chain", "API timeout"] };

describe("explainable historical retrieval", () => {
  it("loads the synthetic historical repository", () => expect(historicalRepository.length).toBe(8));
  it("returns top-k results with explicit match reasons", () => {
    const result = retrieveHistoricalEvidence(middlewareQuery, historicalRepository, 2);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].record.id).toBe("HIST-002");
    expect(result.items[0].matchReasons.map(r => r.type)).toEqual(["system", "changeType", "technology", "dependency", "failureMode"]);
    expect(result.items[0].matchReasons.find(r => r.type === "failureMode")?.matchedValues).toContain("expired certificate chain");
  });
  it("suppresses a superficially similar incident with different failure mode and dependency", () => {
    const query = { systems: ["CRM"], changeType: "planned", technologies: ["CRM middleware"], dependencies: ["API Gateway"], failureModes: ["expired certificate chain"] };
    const result = retrieveHistoricalEvidence(query, historicalRepository, 3);
    expect(result.items.map(x => x.record.id)).not.toContain("HIST-005");
    expect(result.suppressed).toContainEqual({ id: "HIST-005", reason: "below-threshold" });
  });
  it("suppresses exact and near duplicates by canonical group", () => {
    const result = retrieveHistoricalEvidence(middlewareQuery, historicalRepository, 5);
    expect(result.items.map(x => x.record.id)).not.toContain("HIST-002-DUP");
    expect(result.suppressed).toContainEqual({ id: "HIST-002-DUP", reason: "near-duplicate", relatedTo: "HIST-002" });
  });
  it("does not retrieve unrelated history when no rule threshold is met", () => {
    const query = { systems: ["Order Management"], changeType: "emergency", technologies: ["Kubernetes"], dependencies: ["Vendor X"], failureModes: ["quota exhaustion"] };
    expect(retrieveHistoricalEvidence(query, historicalRepository).items).toEqual([]);
  });
  it("qualifies an exact title match without using Change ID similarity", () => {
    const repository = [{ id: "HIST-TITLE", title: "Salesforce Production Bug fixes", summary: "Prior change.", systems: [], changeTypes: ["planned"], technologies: [], dependencies: [], failureModes: [], outcome: "success" as const, sourceSection: "Demo", canonicalGroupId: "HIST-TITLE" }];
    const result = retrieveHistoricalEvidence({ title: "Salesforce Production Bug fixes", systems: [], changeType: "planned", technologies: [], dependencies: [], failureModes: [] }, repository);
    expect(result.items[0].score).toBe(5); expect(result.items[0].matchReasons.find(r => r.type === "text")?.matchedValues).toEqual(["exact-title"]);
  });
});
