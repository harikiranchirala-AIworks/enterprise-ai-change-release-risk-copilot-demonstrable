import { ChangeEvidence } from "./changeEvidence.schema.js";

export type ChangePackageRow = Record<string, unknown>;

const text = (value: unknown) => String(value ?? "").trim();
const list = (value: unknown) => text(value).split(/[;\n|]+|,(?=\s*[A-Za-z0-9])/).map(item => item.trim()).filter(Boolean);
const bool = (value: unknown, fallback = false) => {
  const normalized = text(value).toLowerCase();
  if (["true", "yes", "y", "1", "provided", "complete"].includes(normalized)) return true;
  if (["false", "no", "n", "0", "missing", "not provided"].includes(normalized)) return false;
  return fallback;
};
const number = (value: unknown) => { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined; };
const first = (row: ChangePackageRow, ...names: string[]) => names.map(name => row[name]).find(value => text(value) !== "");

export function mapChangePackageRow(row: ChangePackageRow): ChangeEvidence {
  const changeId = text(first(row, "Change ID", "changeId", "ChangeId"));
  const title = text(first(row, "Title", "title"));
  const environmentValue = text(first(row, "Environment", "environment")).toLowerCase();
  const systems = list(first(row, "Systems", "Affected Systems", "systems"));
  const dependencies = list(first(row, "Dependencies", "dependencies")).map(name => ({ name, direction: "downstream" as const, validationProvided: false }));
  const rollbackSteps = list(first(row, "Rollback Steps", "rollbackSteps"));
  const validationSteps = list(first(row, "Validation Steps", "validationSteps"));
  const successCriteria = list(first(row, "Success Criteria", "successCriteria"));
  const securityReview = bool(first(row, "Security Review", "securityReview"));
  const businessImpact = text(first(row, "Business Impact", "businessImpact"));
  const serviceImpact = /no impact|non.?service|none|zero/i.test(businessImpact) ? "non-service-impacted" as const : "service-impacted" as const;
  const changeOwner = text(first(row, "Change Owner", "changeOwner"));
  const rollbackOwner = text(first(row, "Rollback Owner", "rollbackOwner"));
  const parsedEnvironment = environmentValue === "non-production" || environmentValue === "nonproduction" || environmentValue === "test" ? "non-production" as const : "production" as const;
  return {
    changeId,
    title,
    description: businessImpact || `Change package for ${title}.`,
    company: "NorthStar Telecom",
    environment: parsedEnvironment,
    serviceImpact,
    customerFacing: serviceImpact === "service-impacted",
    reversible: rollbackSteps.length > 0,
    riskClassification: "medium",
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

export function validateChangePackageRow(row: ChangePackageRow, rowNumber = 2): string[] {
  const errors: string[] = [];
  if (!text(first(row, "Change ID", "changeId", "ChangeId"))) errors.push(`Row ${rowNumber}: Change ID is required.`);
  if (!text(first(row, "Title", "title"))) errors.push(`Row ${rowNumber}: Title is required.`);
  if (!text(first(row, "Environment", "environment"))) errors.push(`Row ${rowNumber}: Environment is required.`);
  return errors;
}
