import * as XLSX from "xlsx";
import { HistoricalChangeRecord } from "./retrieval.schema.js";

export interface ParsedHistoricalEvidence {
  sourceType: "csv" | "json" | "xlsx";
  rows: number;
  records: HistoricalChangeRecord[];
  warnings: string[];
}

const required = ["id", "title", "summary", "systems", "changeTypes", "technologies", "outcome", "sourceSection", "canonicalGroupId"];
const outcomes = new Set(["success", "failed", "incident"]);
const text = (value: unknown) => String(value ?? "").trim();
const list = (value: unknown) => Array.isArray(value) ? value.map(text).filter(Boolean) : text(value).split(/[;,|]/).map(item => item.trim()).filter(Boolean);

function rowsFromWorkbook(data: ArrayBuffer | string): Record<string, unknown>[] {
  const workbook = XLSX.read(data, { type: typeof data === "string" ? "string" : "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("The workbook does not contain a sheet.");
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
}

function rowsFromJson(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value as Record<string, unknown>[];
  if (value && typeof value === "object" && Array.isArray((value as { records?: unknown }).records)) return (value as { records: Record<string, unknown>[] }).records;
  if (value && typeof value === "object" && Array.isArray((value as { history?: unknown }).history)) return (value as { history: Record<string, unknown>[] }).history;
  if (value && typeof value === "object") return [value as Record<string, unknown>];
  throw new Error("Historical JSON must contain an array of records or one historical record.");
}

function normalizeRow(row: Record<string, unknown>, rowNumber: number): HistoricalChangeRecord {
  const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim(), value]));
  const missing = required.filter(field => !text(normalized[field]));
  if (missing.length) throw new Error(`Historical row ${rowNumber} is missing: ${missing.join(", ")}.`);
  const outcome = text(normalized.outcome).toLowerCase();
  if (!outcomes.has(outcome)) throw new Error(`Historical row ${rowNumber} has unsupported outcome "${text(normalized.outcome)}". Use success, failed, or incident.`);
  return {
    id: text(normalized.id), title: text(normalized.title), summary: text(normalized.summary),
    systems: list(normalized.systems), changeTypes: list(normalized.changeTypes), technologies: list(normalized.technologies),
    dependencies: list(normalized.dependencies), failureModes: list(normalized.failureModes), outcome: outcome as HistoricalChangeRecord["outcome"],
    sourceSection: text(normalized.sourceSection), canonicalGroupId: text(normalized.canonicalGroupId)
  };
}

export function parseHistoricalEvidence(input: { name: string; data: ArrayBuffer | string }): ParsedHistoricalEvidence {
  const extension = input.name.toLowerCase().split(".").pop();
  let sourceType: ParsedHistoricalEvidence["sourceType"];
  let rows: Record<string, unknown>[];
  if (extension === "json") { sourceType = "json"; rows = rowsFromJson(typeof input.data === "string" ? JSON.parse(input.data) : JSON.parse(new TextDecoder().decode(input.data))); }
  else if (extension === "csv") { sourceType = "csv"; rows = rowsFromWorkbook(typeof input.data === "string" ? input.data : new TextDecoder().decode(input.data)); }
  else if (extension === "xlsx" || extension === "xls") { sourceType = "xlsx"; rows = rowsFromWorkbook(input.data); }
  else throw new Error("Unsupported historical file type. Upload CSV, JSON, or Excel (.xlsx/.xls).");
  if (!rows.length) throw new Error("The historical file does not contain any records.");
  const records = rows.map((row, index) => normalizeRow(row, index + 2));
  if (new Set(records.map(record => record.id)).size !== records.length) throw new Error("Historical record IDs must be unique.");
  if (records.some(record => !record.systems.length || !record.changeTypes.length || !record.technologies.length)) throw new Error("Each historical record needs systems, changeTypes, and technologies.");
  return { sourceType, rows: records.length, records, warnings: [] };
}
