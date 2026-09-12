# AI risk register

| Risk | Failure mode | Control | Evidence in project | Residual limitation |
| --- | --- | --- | --- | --- |
| Hallucination | Invented outage, dependency, incident, or business impact | Strict schema, evidence IDs, lexical grounding validation, fail closed | Hostile grounding tests pass | Validator is lexical and should be strengthened before production |
| Omission | A planted E2/E3 gap is not surfaced | Deterministic rules run before synthesis; gold expectations | Critical-gap recall 100% on 18 scenarios | Larger and independently authored gold sets are needed |
| Automation bias | Reviewer treats a suggestion as a decision | Explicit “Decision Support Only” UI; no approval API/state | UI and workflow tests | Human factors testing with real CAB reviewers is pending |
| Prompt injection | Notes attempt to override review instructions | Notes remain data; fixed instructions; hostile tests | Prompt-injection scenarios pass | More payload variants and supply-chain controls are needed |
| Privacy | Sensitive change or retrieved text is exposed | Synthetic-only dataset; bounded synthesis input; no raw-data logging contract | NorthStar Telecom fictional data only | Production privacy review and redaction controls are still required |
| Historical bias | A superficially similar incident is treated as relevant | Explainable multi-field scoring, failure-mode/dependency matching, threshold, suppression | Misleading-history test passes | Eight-record repository is too small for production conclusions |
| Provider failure | Timeout, malformed output, unavailable provider | Explicit failure states and retry/re-analysis path | Provider failure tests pass | Production SLOs, rate limits, and provider monitoring are not implemented |
| Stale analysis | Reviewer acts on an analysis for changed source data | Source fingerprint comparison blocks decision actions | Stale-package test passes | Fingerprint persistence and distributed concurrency controls need production design |
