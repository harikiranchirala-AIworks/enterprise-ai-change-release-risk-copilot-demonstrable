export type EvidenceSeverity = "E0" | "E1" | "E2" | "E3";
export type AggregateReviewState = "AR0" | "AR1" | "AR2" | "AR3";
export type ChangeType = "standard" | "planned" | "emergency" | "critical";
export type EvidenceDomain =
  | "Implementation" | "Rollback / Recovery" | "Validation" | "Dependencies"
  | "Security" | "Data" | "Business Impact" | "Ownership / Governance"
  | "Monitoring" | "Historical Evidence";

export interface ChangeEvidence {
  changeId: string;
  title: string;
  changeType?: ChangeType;
  changeTypeLabel?: string;
  changePriority?: string;
  businessImpact?: string;
  ownerRiskRating?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  description: string;
  company: "NorthStar Telecom";
  environment: "production" | "non-production";
  serviceImpact: "service-impacted" | "non-service-impacted";
  customerFacing: boolean;
  reversible: boolean;
  riskClassification: "low" | "medium" | "high" | "critical";
  systems: string[];
  implementation: {
    prerequisites: string[];
    steps: string[];
    durationMinutes?: number;
    owners: string[];
    communicationProvided: boolean;
  };
  rollback: {
    steps: string[];
    trigger?: string;
    durationMinutes?: number;
    decisionOwner?: string;
    recoveryValidation?: string[];
  };
  validation: {
    preChecks: string[];
    postChecks: string[];
    successCriteria?: string[];
    monitoringPeriodMinutes?: number;
  };
  dependencies: Array<{
    name: string;
    direction: "upstream" | "downstream" | "interface" | "database" | "infrastructure" | "vendor";
    validationProvided: boolean;
  }>;
  approvals: Array<{ type: "business" | "security" | "database" | "CAB"; provided: boolean }>;
  historicalReferences: Array<{
    id: string;
    summary: string;
    relevant: boolean;
    concern?: string;
    currentMitigationProvided: boolean;
  }>;
  notes?: string[];
}

export interface EvidenceObservation {
  id: string;
  code: string;
  title: string;
  statement: string;
  severity: EvidenceSeverity;
  domain: EvidenceDomain;
  evidencePaths: string[];
  evidenceConfidence: "High" | "Medium";
}

export interface DeterministicEvaluation {
  changeId: string;
  observations: EvidenceObservation[];
  aggregateReviewState: AggregateReviewState;
  aggregateFlags: string[];
  aggregateReason: string;
}
