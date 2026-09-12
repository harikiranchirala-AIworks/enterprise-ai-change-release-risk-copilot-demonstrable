# Enterprise AI Change & Release Risk Copilot

Career-purpose portfolio project: a synthetic, governed pre-CAB decision-support copilot.

The complete portfolio documentation is in [`portfolio/README.md`](portfolio/README.md), including architecture, AI risk register, exact evaluation results, demo flow, case study, interview explanations, résumé bullets, and known limitations.

The system identifies evidence gaps and prepares supporting analysis. It does not approve or reject changes. Human governance retains authority.

## Operator demo

The lightweight operator UI is compiled to `dist/ui/` and supports one change package
per upload in CSV, JSON, or Excel (`.xlsx`/`.xls`) format. Run `npm run build`, then serve
the project directory with any static file server and open `ui/index.html` (or the
compiled `dist/ui/index.html`). Select **Use demo package** or upload a file, then choose
**Analyze change**. The screen shows normalized evidence, deterministic E0–E3 and AR0–AR3
results, explainable historical retrieval, bounded synthesis output, provenance, and
human review actions.

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
