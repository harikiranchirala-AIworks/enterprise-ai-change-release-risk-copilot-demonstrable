const text = (value) => String(value ?? "").trim();
const list = (value) => text(value).split(/[;\n|]+|,(?=\s*[A-Za-z0-9])/).map(item => item.trim()).filter(Boolean);
const bool = (value, fallback = false) => {
    const normalized = text(value).toLowerCase();
    if (["true", "yes", "y", "1", "provided", "complete"].includes(normalized))
        return true;
    if (["false", "no", "n", "0", "missing", "not provided"].includes(normalized))
        return false;
    return fallback;
};
const number = (value) => { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined; };
export const parsePackageDate = (value) => { const raw = text(value); if (!raw)
    return undefined; const match = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/); if (match)
    return new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(match[4] ?? 0), Number(match[5] ?? 0), Number(match[6] ?? 0))).toISOString(); const parsed = new Date(raw); return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString(); };
const changeType = (value) => { const normalized = text(value).toLowerCase(); if (normalized.includes("emergency"))
    return "emergency"; if (normalized.includes("critical"))
    return "critical"; if (normalized.includes("standard"))
    return "standard"; return "planned"; };
const first = (row, ...names) => names.map(name => row[name]).find(value => text(value) !== "");
export function mapChangePackageRow(row) {
    const changeId = text(first(row, "Change ID", "changeId", "ChangeId"));
    const title = text(first(row, "Title", "title"));
    const environmentValue = text(first(row, "Environment", "environment")).toLowerCase();
    const systems = list(first(row, "Systems", "Affected Systems", "Affected Service", "Service", "Configuration item", "systems"));
    const dependencies = list(first(row, "Dependencies", "dependencies")).map(name => ({ name, direction: "downstream", validationProvided: false }));
    const rollbackSteps = list(first(row, "Rollback Steps", "rollbackSteps"));
    const validationSteps = list(first(row, "Validation Steps", "validationSteps"));
    const successCriteria = list(first(row, "Success Criteria", "successCriteria"));
    const securityReview = bool(first(row, "Security Review", "securityReview"));
    const businessImpact = text(first(row, "Business Impact", "Impact", "Impact_1", "businessImpact"));
    const outageRequired = text(first(row, "Outage Required", "outageRequired"));
    const serviceImpact = /no impact|non.?service|none|zero|no outage/i.test(businessImpact) && !/^yes$/i.test(outageRequired) ? "non-service-impacted" : "service-impacted";
    const changeOwner = text(first(row, "Change Owner", "Assigned to", "changeOwner"));
    const priority = text(first(row, "Priority", "Risk Classification", "riskClassification")).toLowerCase();
    const priorityLabel = text(first(row, "Priority", "Change Priority", "changePriority"));
    const ownerRiskRating = text(first(row, "Owner Risk Rating", "Risk Classification", "riskClassification"));
    const riskClassification = priority.includes("critical") || priority.startsWith("1") ? "critical" : priority.includes("high") || priority.startsWith("2") ? "high" : priority.includes("low") || priority.startsWith("4") ? "low" : "medium";
    const rollbackOwner = text(first(row, "Rollback Owner", "rollbackOwner"));
    const plannedStartDate = parsePackageDate(first(row, "Planned Start Date", "Planned start date", "plannedStartDate"));
    const plannedEndDate = parsePackageDate(first(row, "Planned End Date", "Planned end date", "plannedEndDate"));
    const typeValue = first(row, "Change Type", "Type", "changeType");
    const parsedEnvironment = /non.?prod|test|dev|qa|stage/i.test(environmentValue) ? "non-production" : "production";
    return {
        changeId,
        title,
        changeType: changeType(typeValue),
        changeTypeLabel: text(typeValue) || "Planned",
        changePriority: priorityLabel || undefined,
        businessImpact: businessImpact || undefined,
        ownerRiskRating: ownerRiskRating || undefined,
        plannedStartDate,
        plannedEndDate,
        description: businessImpact || `Change package for ${title}.`,
        company: "NorthStar Telecom",
        environment: parsedEnvironment,
        serviceImpact,
        customerFacing: serviceImpact === "service-impacted",
        reversible: rollbackSteps.length > 0,
        riskClassification,
        systems,
        implementation: { prerequisites: [], steps: [title].filter(Boolean), durationMinutes: number(first(row, "Implementation Duration", "Duration Minutes")), owners: changeOwner ? [changeOwner] : [], communicationProvided: false },
        rollback: { steps: rollbackSteps, trigger: text(first(row, "Rollback Trigger", "rollbackTrigger")) || undefined, decisionOwner: rollbackOwner || changeOwner || undefined },
        validation: { preChecks: [], postChecks: validationSteps, successCriteria: successCriteria.length ? successCriteria : undefined },
        dependencies,
        approvals: [
            { type: "security", provided: securityReview },
            { type: "business", provided: serviceImpact === "non-service-impacted" },
            { type: "CAB", provided: false }
        ],
        historicalReferences: [],
        notes: ["Mapped from the one-row operator change-package template."]
    };
}
export function validateChangePackageRow(row, rowNumber = 2, now = new Date()) {
    const errors = [];
    if (!text(first(row, "Change ID", "changeId", "ChangeId")))
        errors.push(`Row ${rowNumber}: Change ID is required.`);
    if (!text(first(row, "Title", "title")))
        errors.push(`Row ${rowNumber}: Title is required.`);
    if (!text(first(row, "Environment", "environment")))
        errors.push(`Row ${rowNumber}: Environment is required.`);
    const mapped = mapChangePackageRow(row);
    if (mapped.plannedStartDate) {
        const start = new Date(mapped.plannedStartDate);
        const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        const startDateUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
        if (startDateUtc < todayUtc)
            errors.push(`Row ${rowNumber}: Planned start date must be today or later.`);
    }
    if (mapped.plannedStartDate && mapped.plannedEndDate && new Date(mapped.plannedEndDate) <= new Date(mapped.plannedStartDate))
        errors.push(`Row ${rowNumber}: Planned end date must be after the planned start date.`);
    return errors;
}
//# sourceMappingURL=changePackageMapper.js.map