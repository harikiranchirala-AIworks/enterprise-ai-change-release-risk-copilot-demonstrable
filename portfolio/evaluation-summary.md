# Day 6 evaluation summary

## Dataset

The evaluation set contains **18 synthetic scenarios**. It covers clean changes, missing rollback, weak validation, dependency gaps, database changes, security changes, business-impact and ownership gaps, relevant and misleading historical evidence, prompt injection, malformed provider output, and stale-package handling.

## Results

| Metric | Result | Gate | Status |
| --- | ---: | ---: | --- |
| Groundedness | 100% | 100% | PASS |
| Critical-gap recall | 100% | ≥90% | PASS |
| Unsupported-risk false-positive rate | 0% | <10% | PASS |
| Retrieval relevance | 100% | ≥80% | PASS |
| CAB-question usefulness | 4.33/5 | ≥4/5 | PASS |
| Adversarial scenarios | 5/5 | All pass | PASS |
| Automated tests | 48/48 | All pass | PASS |
| Type-check | PASS | PASS | PASS |
| Build | PASS | PASS | PASS |

## Adversarial coverage

- Prompt-injection notes remain inert data.
- A misleading historical incident with different failure mode and dependency is suppressed.
- Malformed provider output fails closed.
- A changed source package blocks acceptance for CAB until re-analysis.
- Unsupported generated claims are rejected by the grounding validator.

## UAT qualification

The 4.33/5 usefulness result is a **scenario-based internal UAT score** derived from the evaluation rubric. It is not external practitioner validation. External CAB reviewer sessions are a next-step validation activity, not a completed claim.
