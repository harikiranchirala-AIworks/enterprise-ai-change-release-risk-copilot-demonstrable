import * as XLSX from "xlsx";
import { ChangeEvidence } from "./changeEvidence.schema.js";
import { mapChangePackageRow, validateChangePackageRow, ChangePackageRow } from "./changePackageMapper.js";

export interface ParsedChangeRecord { change: ChangeEvidence; validationErrors: string[]; status: "Ready" | "Input Validation Failed"; }
export interface ParsedChangePackage { sourceType: "csv" | "json" | "xlsx"; rows: number; records: ParsedChangeRecord[]; changes: ChangeEvidence[]; change: ChangeEvidence; warnings: string[]; }

const supported = ["Change ID", "Title", "Environment", "Systems", "Dependencies", "Rollback Steps", "Rollback Trigger", "Rollback Owner", "Validation Steps", "Success Criteria", "Business Impact", "Security Review", "Change Owner", "Assigned to", "Planned Start Date", "Planned start date", "Planned End Date", "Planned end date", "Type", "Change Type", "Priority", "Change Priority", "Impact", "Impact_1", "Outage Required", "Risk Classification", "Owner Risk Rating"];

function rowsFromWorkbook(data: ArrayBuffer | string): ChangePackageRow[] {
  const workbook = XLSX.read(data, { type: typeof data === "string" ? "string" : "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("The workbook does not contain a sheet.");
  return XLSX.utils.sheet_to_json<ChangePackageRow>(sheet, { defval: "", raw: false });
}

function rowsFromJson(value: unknown): ChangePackageRow[] {
  if (Array.isArray(value)) return value as ChangePackageRow[];
  if (value && typeof value === "object" && "change" in value) return [((value as { change: unknown }).change) as ChangePackageRow];
  if (value && typeof value === "object") return [value as ChangePackageRow];
  throw new Error("JSON must contain one change object or an array with one change object.");
}

export function parseChangePackage(input: { name: string; data: ArrayBuffer | string; now?: Date }): ParsedChangePackage {
  const extension = input.name.toLowerCase().split(".").pop();
  let sourceType: ParsedChangePackage["sourceType"];
  let rows: ChangePackageRow[];
  if (extension === "json") { sourceType = "json"; rows = rowsFromJson(typeof input.data === "string" ? JSON.parse(input.data) : JSON.parse(new TextDecoder().decode(input.data))); }
  else if (extension === "csv") { sourceType = "csv"; rows = rowsFromWorkbook(typeof input.data === "string" ? input.data : new TextDecoder().decode(input.data)); }
  else if (extension === "xlsx" || extension === "xls") { sourceType = "xlsx"; rows = rowsFromWorkbook(input.data); }
  else throw new Error("Unsupported file type. Upload CSV, JSON, or Excel (.xlsx/.xls).");
  if (!rows.length) throw new Error("The file does not contain any change rows.");
  const records = rows.map((row, index) => { const change = mapChangePackageRow(row); const validationErrors = validateChangePackageRow(row, index + 2, input.now); return { change, validationErrors, status: validationErrors.length ? "Input Validation Failed" as const : "Ready" as const }; });
  const warnings = [...new Set(rows.flatMap(row => Object.keys(row).filter(key => !supported.includes(key)).map(key => `Ignored unsupported column: ${key}.`)))];
  const changes = records.map(record => record.change);
  return { sourceType, rows: rows.length, records, changes, change: changes[0], warnings };
}
