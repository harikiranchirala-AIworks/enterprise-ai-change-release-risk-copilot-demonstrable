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
  it("accepts the same CAB-facing notation as the current change upload", async () => {
    const XLSX = await import("xlsx"); const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet([{ "Change ID": "CHNG-HIST-001", Type: "Normal", Title: "Webserver configuration changes", Environment: "Production", Priority: "1 - Critical", State: "Open", "Assigned to": "Fictional Owner", "Planned start date": "20-09-2026", "Planned end date": "21-09-2026", Impact: "1 - High", "Additional comments": "Fictional historical record" }]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Changes"); const bytes = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const parsed = parseHistoricalEvidence({ name: "cab-history.xlsx", data: bytes });
    expect(parsed.records[0]).toMatchObject({ id: "CHNG-HIST-001", title: "Webserver configuration changes", changeTypes: ["planned"], outcome: "incident" });
    expect(parsed.records[0].sourceSection).toBe("Historical Change CHNG-HIST-001");
  });
  it("fails closed for missing fields and invalid outcomes", () => {
    expect(() => parseHistoricalEvidence({ name: "history.json", data: JSON.stringify([{ id: "H" }]) })).toThrow(/missing/);
    const base = { id: "H", title: "Test", summary: "Test", systems: ["CRM"], changeTypes: ["planned"], technologies: ["middleware"], dependencies: [], failureModes: [], outcome: "banana", sourceSection: "Demo", canonicalGroupId: "H" };
    expect(() => parseHistoricalEvidence({ name: "history.json", data: JSON.stringify(base) })).toThrow(/unsupported outcome/);
  });
  it("allows duplicate source Change IDs with unique internal evidence IDs", () => {
    const rows = [{ "Change ID": "CHNG1182118", Title: "First historical row", State: "Open" }, { "Change ID": "CHNG1182118", Title: "Second historical row", State: "Open" }];
    const parsed = parseHistoricalEvidence({ name: "history.json", data: JSON.stringify(rows) });
    expect(parsed.records.map(record => record.id)).toEqual(["CHNG1182118", "CHNG1182118-HIST-ROW-3"]);
    expect(parsed.records[1].sourceRecordId).toBe("CHNG1182118");
    expect(parsed.records[1].canonicalGroupId).toBe("CHNG1182118-HIST-ROW-3");
  });
});
