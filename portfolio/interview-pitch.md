# Interview explanations

## 30 seconds

I built a governed pre-CAB change-risk copilot using synthetic NorthStar Telecom data. It runs deterministic evidence-gap checks first, retrieves relevant historical changes with explainable match reasons, and then allows bounded structured synthesis. Every material observation must cite evidence, unsupported claims fail closed, and a human reviewer accepts material only for CAB discussion—the system never approves or rejects the change.

## 90 seconds

The problem was inconsistent first-pass CAB preparation around rollback readiness, validation, dependencies, database recovery, security review, and historical incidents. I designed the solution as a controlled pipeline. A typed `ChangeEvidence` schema feeds deterministic E0–E3 findings and AR0–AR3 aggregate review state. A small historical repository uses transparent multi-field scoring and suppresses irrelevant or near-duplicate records. The model receives only normalized evidence, rule findings, retrieved history, and fixed instructions, and must return a strict schema. A post-generation validator checks evidence IDs, lexical support, traces, and forbidden decision language. The operator UI supports review, edits, comments, send-back, additional evidence requests, and re-analysis, while stale packages and provider failures are explicit bounded states. The result achieved 100% groundedness and critical-gap recall on 18 synthetic scenarios, with 48/48 tests passing.

## Five minutes

Explain the problem, then draw the six-stage flow in `architecture.md`. Walk through `CHG-004`: the deterministic rule detects an E2 dependency-validation gap, the UI shows the aggregate AR2 state, the missing evidence, CAB question, provenance, and `RULE:DEP-001` trace. Explain that retrieval is not keyword-only: a superficially similar incident is suppressed when dependency and failure mode do not match. Show the bounded synthesis contract and hostile cases for invented outage, dependency, incident, business impact, high-risk language, and approval/rejection language. Demonstrate the review lifecycle and stale fingerprint block. Close with the Day-6 metrics and the limitation that external CAB practitioner UAT remains pending.

## Résumé bullets

- Designed and built a governed pre-CAB change-risk copilot with deterministic E0–E3 evidence checks, AR0–AR3 aggregate review rules, explainable historical retrieval, and a human-in-the-loop review workflow.
- Implemented evidence-grounded structured AI synthesis with strict schemas, source-ID traceability, prompt-injection controls, fail-closed handling for unsupported claims, malformed output, provider failure, timeout, and stale change packages.
- Created an 18-scenario synthetic evaluation and red-team suite achieving 100% groundedness, 100% critical-gap recall, 0% unsupported-risk false positives, 100% retrieval relevance, and 48/48 automated tests passing.
