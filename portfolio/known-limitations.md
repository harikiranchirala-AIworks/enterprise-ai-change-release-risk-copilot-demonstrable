# Known limitations and next production steps

## Limitations

- All data is synthetic and represents fictional NorthStar Telecom systems.
- External CAB practitioner UAT has not been completed.
- The usefulness score is scenario-based internal UAT, not external validation.
- The historical repository contains only eight records; retrieval results do not represent production-scale relevance.
- Grounding uses lexical support checks and requires stronger semantic and policy validation before production.
- No production authentication, enterprise connectors, dashboards, deployment execution, or final approval logic is included.
- No production SLO, cost, rate-limit, observability, or model-drift claims are made.

## Production-oriented next steps

1. Run supervised UAT with CAB reviewers using approved, redacted data.
2. Expand and independently label historical and adversarial evaluation sets.
3. Complete privacy, security, access-control, retention, and threat-model reviews.
4. Add operational telemetry that records safe metadata without raw change or retrieved-document text.
5. Establish provider reliability, latency, cost, and rollback procedures.
6. Integrate with enterprise systems only after governance approval and contract testing.

These are future controls and validation activities, not part of the completed portfolio MVP.
