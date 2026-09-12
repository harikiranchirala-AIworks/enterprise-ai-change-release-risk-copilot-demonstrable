import * as XLSX from "xlsx";
const required = ["id", "title"];
const outcomes = new Set(["success", "failed", "incident", "unknown"]);
const text = (value) => String(value ?? "").trim();
const list = (value) => Array.isArray(value) ? value.map(text).filter(Boolean) : text(value).split(/[;,|]/).map(item => item.trim()).filter(Boolean);
function field(row, ...names) {
    const entries = Object.entries(row);
    return entries.find(([key]) => names.some(name => key.trim().toLowerCase() === name.toLowerCase()))?.[1];
}
function normalizeOutcome(value) {
    const normalized = text(value).toLowerCase();
    if (["success", "successful", "completed", "closed", "implemented"].includes(normalized))
        return "success";
    if (["failed", "failure", "unsuccessful"].includes(normalized))
        return "failed";
    if (["incident", "open", "rollback", "rolled back"].includes(normalized))
        return "incident";
    return "unknown";
}
function rowsFromWorkbook(data) {
    const workbook = XLSX.read(data, { type: typeof data === "string" ? "string" : "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet)
        throw new Error("The workbook does not contain a sheet.");
    return XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
}
function rowsFromJson(value) {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === "object" && Array.isArray(value.records))
        return value.records;
    if (value && typeof value === "object" && Array.isArray(value.history))
        return value.history;
    if (value && typeof value === "object")
        return [value];
    throw new Error("Historical JSON must contain an array of records or one historical record.");
}
function normalizeRow(row, rowNumber) {
    const id = text(field(row, "id", "Change ID", "ChangeID"));
    const title = text(field(row, "title", "Title", "Change Title"));
    const missing = required.filter(name => name === "id" ? !id : !title);
    if (missing.length)
        throw new Error(`Historical row ${rowNumber} is missing: ${missing.join(", ")}.`);
    const summary = text(field(row, "summary", "Summary", "Additional comments", "Work notes", "Reason for Change", "Reason")) || `Historical record for ${title}.`;
    const systems = list(field(row, "systems", "System", "Systems"));
    const changeTypes = list(field(row, "changeTypes", "Change Type", "Type"));
    const technologies = list(field(row, "technologies", "Technology", "Technologies"));
    const dependencies = list(field(row, "dependencies", "Dependency", "Dependencies"));
    const failureModes = list(field(row, "failureModes", "Failure Mode", "Failure Modes"));
    const suppliedOutcome = field(row, "outcome", "Outcome", "Result");
    const suppliedOutcomeValue = text(suppliedOutcome).toLowerCase();
    const acceptedOutcomes = ["success", "successful", "completed", "closed", "implemented", "failed", "failure", "unsuccessful", "incident", "open", "rollback", "rolled back", "unknown"];
    if (suppliedOutcomeValue && !acceptedOutcomes.includes(suppliedOutcomeValue))
        throw new Error(`Historical row ${rowNumber} has unsupported outcome "${text(suppliedOutcome)}".`);
    const outcome = normalizeOutcome(suppliedOutcome ?? field(row, "State"));
    return {
        id, sourceRecordId: id, title, summary, systems, changeTypes: changeTypes.length ? changeTypes : ["planned"], technologies,
        dependencies, failureModes, outcome,
        sourceSection: text(field(row, "sourceSection", "Source Section")) || `Historical Change ${id}`,
        canonicalGroupId: text(field(row, "canonicalGroupId", "Canonical Group ID")) || id
    };
}
export function parseHistoricalEvidence(input) {
    const extension = input.name.toLowerCase().split(".").pop();
    let sourceType;
    let rows;
    if (extension === "json") {
        sourceType = "json";
        rows = rowsFromJson(typeof input.data === "string" ? JSON.parse(input.data) : JSON.parse(new TextDecoder().decode(input.data)));
    }
    else if (extension === "csv") {
        sourceType = "csv";
        rows = rowsFromWorkbook(typeof input.data === "string" ? input.data : new TextDecoder().decode(input.data));
    }
    else if (extension === "xlsx" || extension === "xls") {
        sourceType = "xlsx";
        rows = rowsFromWorkbook(input.data);
    }
    else
        throw new Error("Unsupported historical file type. Upload CSV, JSON, or Excel (.xlsx/.xls).");
    if (!rows.length)
        throw new Error("The historical file does not contain any records.");
    const records = rows.map((row, index) => normalizeRow(row, index + 2));
    const seenIds = new Map();
    records.forEach((record, index) => {
        const occurrence = (seenIds.get(record.id) ?? 0) + 1;
        seenIds.set(record.id, occurrence);
        if (occurrence > 1) {
            const originalId = record.id;
            const uniqueId = `${originalId}-HIST-ROW-${index + 2}`;
            record.id = uniqueId;
            if (record.canonicalGroupId === originalId)
                record.canonicalGroupId = uniqueId;
            record.sourceSection = `${record.sourceSection} (source ${originalId}, row ${index + 2})`;
        }
    });
    return { sourceType, rows: records.length, records, warnings: [] };
}
//# sourceMappingURL=historicalEvidenceParser.js.map