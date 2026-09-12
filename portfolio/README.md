# Enterprise AI Change & Release Risk Copilot

## Portfolio summary

This project is a governed pre-CAB decision-support copilot for change owners, operations managers, and CAB reviewers. It reviews a synthetic change package, identifies evidence gaps, retrieves relevant historical change evidence, produces bounded evidence-grounded observations and CAB questions, and presents the result for human review.

The project uses a fictional NorthStar Telecom environment only. It contains no confidential employer data and no production connectors.

## Problem

Change review is often slowed by incomplete rollback plans, weak validation, undocumented dependencies, database recovery gaps, and historical incidents that are difficult to connect to the current package. The copilot is designed to reduce first-pass review effort while improving evidence coverage and traceability.

## Architecture

1. Normalize the change package into a typed `ChangeEvidence` model.
2. Run deterministic E0–E3 evidence rules and AR0–AR3 aggregate review rules.
3. Retrieve historical changes using explainable overlap and threshold rules.
4. Allow bounded synthesis only over normalized evidence, deterministic findings, retrieved history, and fixed instructions.
5. Validate every material generated claim against cited evidence and fail closed when grounding is missing.
6. Present the analysis to a human reviewer for comment, edit, send-back, additional evidence request, or acceptance as supporting material for CAB discussion.

See [`architecture.md`](architecture.md).

## Governance and controls

- AI assists the decision; human governance retains authority.
- `Accepted for CAB` means supporting material was accepted for discussion. It does not approve or reject the change.
- The system cannot execute a deployment or make a final CAB decision.
- Deterministic rules retain control of individual severity and aggregate review state.
- LLM output must use a strict schema and cite evidence IDs.
- Unknown evidence IDs, unsupported claims, malformed output, provider failure, and timeout conditions fail closed.
- Prompt-injection text in change notes is treated as inert data.
- Stale source packages block decision-oriented review actions until re-analysis is requested.

## Evaluation

Day 6 evaluated 18 synthetic scenarios covering clean changes, rollback, validation, dependencies, database and security changes, historical evidence, prompt injection, malformed provider output, and stale packages.

| Measure | Result |
| --- | ---: |
| Groundedness | 100% |
| Critical-gap recall | 100% |
| Unsupported-risk false-positive rate | 0% |
| Retrieval relevance | 100% |
| CAB-question usefulness | 4.33/5 scenario-based internal score |
| Adversarial scenarios | 5/5 pass |
| Automated tests | 48/48 pass |

The usefulness result is scenario-based internal UAT, not external CAB practitioner validation. External human UAT remains a limitation.

## Scope and exclusions

Included: deterministic evidence evaluation, explainable historical retrieval, bounded provider route, grounding validation, human review workflow, operator UI, evaluation, red-team cases, and portfolio documentation.

Excluded: automatic approval/rejection, final autonomous risk classification, deployment execution, dashboards, authentication, enterprise connectors, vector databases, embeddings, and commercialization.

## Running the project

```bash
npm ci
npm test
npm run typecheck
npm run build
```

The project is intentionally synthetic and bounded for career demonstration. It is not represented as production-ready enterprise software.
