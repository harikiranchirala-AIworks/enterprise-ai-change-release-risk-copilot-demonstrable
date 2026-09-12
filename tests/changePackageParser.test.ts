import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseChangePackage } from "../src/changePackageParser.js";

const root = join(process.cwd(), "fixtures");
describe("operator change-package parser", () => {
  it("maps CSV template to ChangeEvidence", () => {
    const parsed = parseChangePackage({ name: "demo.csv", data: readFileSync(join(root, "demo-change-package.csv"), "utf8") });
    expect(parsed.sourceType).toBe("csv"); expect(parsed.change.changeId).toBe("CHG-DEMO-001"); expect(parsed.change.rollback.steps).toHaveLength(2);
  });
  it("maps JSON template to ChangeEvidence", () => {
    const parsed = parseChangePackage({ name: "demo.json", data: readFileSync(join(root, "demo-change-package.json"), "utf8") });
    expect(parsed.sourceType).toBe("json"); expect(parsed.change.systems).toContain("CRM"); expect(parsed.change.validation.postChecks).toHaveLength(2);
  });
  it("maps Excel workbook bytes to ChangeEvidence", async () => {
    const XLSX = await import("xlsx"); const workbook = XLSX.utils.book_new(); const sheet = XLSX.utils.json_to_sheet([{ "Change ID": "CHG-XLSX-001", Title: "Certificate renewal", Environment: "production", Systems: "API Gateway", "Rollback Steps": "Restore previous certificate", "Rollback Trigger": "Handshake failures", "Validation Steps": "TLS smoke test", "Success Criteria": "All endpoints respond", "Business Impact": "No service impact", "Security Review": "Provided", "Change Owner": "Platform Team" }]); XLSX.utils.book_append_sheet(workbook, sheet, "Change Package");
    const bytes = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }); const parsed = parseChangePackage({ name: "demo.xlsx", data: bytes });
    expect(parsed.sourceType).toBe("xlsx"); expect(parsed.change.changeId).toBe("CHG-XLSX-001");
  });
  it("fails closed for invalid input", () => { expect(() => parseChangePackage({ name: "bad.txt", data: "x" })).toThrow(/Unsupported file type/); });
  it("accepts multiple rows and normalizes type and future dates", () => {
    const csv = ["Change ID,Title,Environment,Type,Planned Start Date,Planned End Date,Priority", "CHG-1,Standard patch,production,Standard,20-09-2026 01:00:00,20-09-2026 02:00:00,3 - Moderate", "CHG-2,Emergency fix,production,Emergency,21-09-2026 01:00:00,21-09-2026 02:00:00,1 - Critical"].join("\n");
    const parsed = parseChangePackage({ name: "batch.csv", data: csv, now: new Date("2026-09-12T00:00:00Z") });
    expect(parsed.rows).toBe(2); expect(parsed.changes.map(change => change.changeType)).toEqual(["standard", "emergency"]); expect(parsed.changes[1].riskClassification).toBe("critical");
  });
  it("rejects past starts and an end before the start", () => {
    const csv = "Change ID,Title,Environment,Planned Start Date,Planned End Date\nCHG-1,Invalid,production,10-09-2026,09-09-2026";
    const parsed = parseChangePackage({ name: "invalid-date.csv", data: csv, now: new Date("2026-09-12T00:00:00Z") });
    expect(parsed.records[0].status).toBe("Input Validation Failed"); expect(parsed.records[0].validationErrors.join(" ")).toMatch(/must be greater|earlier than|after the planned start/);
  });
});
