const obs = (o, n) => ({ ...o, id: `OBS-${n.toString().padStart(3, "0")}` });
export function evaluateSeverity(change) {
    const out = [];
    const add = (o) => out.push(obs(o, out.length + 1));
    if (change.environment === "production" && change.reversible && change.rollback.steps.length === 0) {
        add({ code: "RB-001", title: "Rollback procedure absent", statement: "No rollback procedure is supplied for a reversible production change.", severity: "E3", domain: "Rollback / Recovery", evidencePaths: ["rollback.steps"], evidenceConfidence: "High" });
    }
    else if (change.rollback.steps.length === 0) {
        add({ code: "RB-001", title: "Rollback procedure absent", statement: "No rollback procedure is supplied.", severity: "E2", domain: "Rollback / Recovery", evidencePaths: ["rollback.steps"], evidenceConfidence: "High" });
    }
    if (change.rollback.steps.length > 0 && !change.rollback.trigger) {
        add({ code: "RB-002", title: "Rollback trigger missing", statement: "Rollback steps are supplied, but no rollback trigger or decision threshold is documented.", severity: "E2", domain: "Rollback / Recovery", evidencePaths: ["rollback.steps", "rollback.trigger"], evidenceConfidence: "High" });
    }
    if (change.rollback.steps.length > 0 && !change.rollback.decisionOwner) {
        add({ code: "RB-003", title: "Rollback decision owner missing", statement: "Rollback steps are supplied, but no decision owner is documented.", severity: "E2", domain: "Ownership / Governance", evidencePaths: ["rollback.steps", "rollback.decisionOwner"], evidenceConfidence: "High" });
    }
    if (change.validation.postChecks.length === 0) {
        add({ code: "VAL-001", title: "Validation plan missing", statement: "No post-change validation steps are supplied.", severity: change.customerFacing ? "E3" : "E2", domain: "Validation", evidencePaths: ["validation.postChecks"], evidenceConfidence: "High" });
    }
    else if (!change.validation.successCriteria?.length) {
        add({ code: "VAL-002", title: "Success criteria missing", statement: "Validation steps are supplied, but measurable success criteria are not documented.", severity: "E1", domain: "Validation", evidencePaths: ["validation.postChecks", "validation.successCriteria"], evidenceConfidence: "High" });
    }
    if (change.implementation.owners.length === 0) {
        add({ code: "OWN-001", title: "Implementation owner missing", statement: "No implementation owner is named in the change package.", severity: "E2", domain: "Ownership / Governance", evidencePaths: ["implementation.owners"], evidenceConfidence: "High" });
    }
    if (!change.implementation.durationMinutes) {
        add({ code: "IMP-001", title: "Implementation duration missing", statement: "The implementation duration is not documented.", severity: "E1", domain: "Implementation", evidencePaths: ["implementation.durationMinutes"], evidenceConfidence: "High" });
    }
    const databaseChange = change.systems.some(s => /database|oracle/i.test(s)) || change.description.toLowerCase().includes("schema");
    const databaseRollback = change.rollback.steps.some(s => /database|schema|recovery|restore database|database restore/i.test(s));
    if (databaseChange && !databaseRollback) {
        add({ code: "DB-001", title: "Database rollback absent", statement: "The change includes a database or schema change, but no database-specific rollback or recovery step is supplied.", severity: "E3", domain: "Data", evidencePaths: ["systems", "description", "rollback.steps"], evidenceConfidence: "High" });
    }
    for (const dependency of change.dependencies.filter(d => !d.validationProvided)) {
        add({ code: "DEP-001", title: "Dependency validation missing", statement: `The dependency ${dependency.name} is identified, but its validation is not documented.`, severity: "E2", domain: "Dependencies", evidencePaths: [`dependencies.${dependency.name}`, "validation.postChecks"], evidenceConfidence: "High" });
    }
    const downtimeApproval = change.serviceImpact === "service-impacted" && !change.approvals.some(a => a.type === "business" && a.provided);
    if (downtimeApproval) {
        add({ code: "BIZ-001", title: "Business approval missing", statement: "Service impact is documented, but business approval evidence is absent.", severity: "E3", domain: "Business Impact", evidencePaths: ["serviceImpact", "approvals"], evidenceConfidence: "High" });
    }
    if (change.systems.some(s => /authentication|certificate|security/i.test(s)) && !change.approvals.some(a => a.type === "security" && a.provided)) {
        add({ code: "SEC-001", title: "Security review evidence missing", statement: "The change affects security configuration, but security review evidence is absent.", severity: "E3", domain: "Security", evidencePaths: ["systems", "approvals"], evidenceConfidence: "High" });
    }
    for (const h of change.historicalReferences.filter(x => x.relevant && x.concern && !x.currentMitigationProvided)) {
        add({ code: "HIST-001", title: "Historical concern not addressed", statement: `Relevant historical evidence identifies a concern that is not addressed: ${h.concern}.`, severity: "E2", domain: "Historical Evidence", evidencePaths: [`historicalReferences.${h.id}`], evidenceConfidence: "High" });
    }
    return out;
}
//# sourceMappingURL=severityRules.js.map