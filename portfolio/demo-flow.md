# Demo flow and screenshots

## Five-minute demo flow

1. Open the synthetic change review for `CHG-004`, a CRM and Billing interface update.
2. Show aggregate state `AR2` and the individual `DEP-001` E2 observation.
3. Show the missing evidence statement: Billing dependency validation is not documented.
4. Show the CAB question and evidence trace `RULE:DEP-001`.
5. Point out provenance: deterministic rule output is labelled `deterministic`; historical evidence and bounded synthesis have separate source/provenance labels in the schema.
6. Add a reviewer comment or edit, then request additional evidence.
7. Demonstrate `Accept for CAB`; the UI explicitly states that this accepts supporting material and does not approve the change.
8. Demonstrate a stale fingerprint; the workflow blocks the action and requests re-analysis.

## UI evidence

The semantic operator UI is in [`../ui/index.html`](../ui/index.html). A lightweight portfolio wireframe is included at [`screenshots/review-ui-wireframe.svg`](screenshots/review-ui-wireframe.svg). It is a documentation aid, not a claim of a production deployment.
