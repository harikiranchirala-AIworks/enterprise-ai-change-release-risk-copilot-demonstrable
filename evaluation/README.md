# Day 6 evaluation / red-team / UAT

`day6.dataset.json` contains 18 synthetic scenarios. It covers clean changes, rollback and validation gaps, dependency, database, security, business-impact, ownership and duration gaps, historical evidence, prompt injection, malformed provider output, and stale-package handling.

The executable harness is `src/day6Evaluation.ts`, covered by `tests/day6Evaluation.test.ts`.

Metric definitions:

- Groundedness: accepted structured outputs with every material observation mapped to a valid deterministic evidence ID.
- Critical-gap recall: scenarios with planted E2/E3 gaps where every expected rule code is detected.
- False-positive rate: clean scenarios that produce an unexpected deterministic observation.
- Retrieval relevance: the historical-match scenario retrieves the relevant incident and the misleading-history scenario suppresses the wrong failure mode/dependency.
- CAB-question usefulness: scenario-based internal ratings on a 1–5 rubric; this is not external human research.

Known limitations: all data and ratings are synthetic/scenario-based, so external CAB reviewer UAT remains pending. Retrieval relevance is measured against a small eight-record repository. The evaluation does not claim production performance, operational availability, or final change approval accuracy.
