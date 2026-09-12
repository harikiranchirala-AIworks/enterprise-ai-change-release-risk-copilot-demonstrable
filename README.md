# Enterprise AI Change & Release Risk Copilot

Career-purpose portfolio project: a synthetic, governed pre-CAB decision-support copilot.

The complete portfolio documentation is in [`portfolio/README.md`](portfolio/README.md), including architecture, AI risk register, exact evaluation results, demo flow, case study, interview explanations, résumé bullets, and known limitations.

The system identifies evidence gaps and prepares supporting analysis. It does not approve or reject changes. Human governance retains authority.

## Operator demo

The lightweight operator UI is compiled to `dist/ui/` and supports one or more change
records per upload in CSV, JSON, or Excel (`.xlsx`/`.xls`) format. Run `npm run build`, then serve
the project directory with any static file server and open `ui/index.html` (or the
compiled `dist/ui/index.html`). Select **Use demo package** or upload a file, then choose
**Analyze change**. The screen shows normalized evidence, deterministic E0–E3 and AR0–AR3
results, explainable historical retrieval, bounded synthesis output, provenance, and
human review actions.

Batch uploads are evaluated independently and shown row-wise. Selecting a row opens its
full evidence detail and human actions. Planned start dates must be today or later and
planned end dates must be after the start date. Invalid rows remain visible as
`Input Validation Failed` and are not sent into E/AR or synthesis. The normalized change
type is `standard`, `planned`, `emergency`, or `critical`; the original label such as
`Normal` is retained for display and mapped to `planned` for retrieval.
Change type and owner-supplied risk classification are context, not mathematical weights.
E0–E3 remains evidence-gap severity and AR0–AR3 remains the explicit aggregate rule
outcome. Change type may influence historical retrieval relevance, but it cannot by itself
raise or lower evidence severity.

The operator UI also supports a separate **Load Historical Evidence** control. Upload a
fictional/sanitized historical repository as CSV, JSON, or Excel. The expected fields are
`id`, `title`, `summary`, `systems`, `changeTypes`, `technologies`, `dependencies`,
`failureModes`, `outcome`, `sourceSection`, and `canonicalGroupId`. List fields may be
JSON arrays or semicolon-separated values in CSV/Excel. The loaded repository is held in
memory for the session and is used on the next analysis; it is not persisted and it does
not alter E0–E3 or AR0–AR3 semantics. Sample files are in
`fixtures/demo-historical-evidence.csv` and `fixtures/demo-historical-evidence.json`.
Repeated source `Change ID` values are allowed. The first row keeps the original ID;
later rows receive an internal evidence ID such as `CHNG1182118-HIST-ROW-6` and retain
the original value as `sourceRecordId`.

The UI does not persist uploaded data and does not accept provider credentials. Serve
`dist` with a static server after the build (for example, `npx serve dist`) and open
`dist/ui/index.html`. Excel parsing uses the browser import map for the SheetJS module.
OpenAI
synthesis remains server/CLI-side through `src/providerRoute.ts`; the browser demo uses
the deterministic findings as a bounded, visibly traceable fallback when no provider
route is configured. `Accept for CAB` only accepts supporting analysis for discussion;
it never approves the underlying change.

## Verification

```bash
npm ci
npm test
npm run typecheck
npm run build
```
