import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseHistoricalEvidence } from "../src/historicalEvidenceParser.js";

const root = join(process.cwd(), "fixtures");

describe("historical evidence repository parser", () => {
  it("loads fictional historical CSV records and delimited lists", () => {
    const parsed = parseHistoricalEvidence({ name: "history.csv", data: readFileSync(join(root, "demo-historical-evidence.csv"), "utf8") });
    expect(parsed.sourceType).toBe("csv"); expect(parsed.rows).toBe(3);
    expect(parsed.records[1].systems).toEqual(["CRM", "API Gateway"]); expect(parsed.records[1].failureModes).toContain("API timeout");
  });
  it("loads JSON arrays and allows empty optional lists", () => {
    const parsed = parseHistoricalEvidence({ name: "history.json", data: readFileSync(join(root, "demo-historical-evidence.json"), "utf8") });
    expect(parsed.records[0].dependencies).toEqual(["API Gateway"]); expect(parsed.records[0].failureModes).toEqual([]);
  });
  it("loads Excel workbook bytes", async () => {
    const XLSX = await import("xlsx"); const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet([{ id: "HIST-XLSX-001", title: "Patch succeeded", summary: "Patch completed.", systems: "Linux", changeTypes: "standard", technologies: "Linux", dependencies: "", failureModes: "", outcome: "success", sourceSection: "Demo", canonicalGroupId: "LINUX-PATCH" }]);
    XLSX.utils.book_append_sheet(workbook, sheet, "History"); const bytes = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const parsed = parseHistoricalEvidence({ name: "history.xlsx", data: bytes }); expect(parsed.sourceType).toBe("xlsx"); expect(parsed.records[0].id).toBe("HIST-XLSX-001");
  });
  it("fails closed for missing fields, invalid outcomes, and duplicate IDs", () => {
    expect(() => parseHistoricalEvidence({ name: "history.json", data: JSON.stringify([{ id: "H", title: "Missing" }]) })).toThrow(/missing/);
    const base = { id: "H", title: "Test", summary: "Test", systems: ["CRM"], changeTypes: ["planned"], technologies: ["middleware"], dependencies: [], failureModes: [], outcome: "unknown", sourceSection: "Demo", canonicalGroupId: "H" };
    expect(() => parseHistoricalEvidence({ name: "history.json", data: JSON.stringify(base) })).toThrow(/unsupported outcome/);
    expect(() => parseHistoricalEvidence({ name: "history.json", data: JSON.stringify([{ ...base, outcome: "success" }, { ...base, outcome: "success" }]) })).toThrow(/unique/);
  });
});
