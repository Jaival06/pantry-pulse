# Pantry Pulse

The repository includes generated sample data so it can run without exposing private business records. Import your own CSV files through the dashboard when running your private deployment.

A lightweight, multi-agent business intelligence dashboard for independent food and beverage businesses. Built against the supplied hackathon brief and all three supplied CSV datasets.

## Run locally

Requires Node.js 24 (recommended; built-in SQLite and TypeScript stripping). No npm installation is required.

    node scripts/dev.mjs

Open http://localhost:5173. Data persists in `.local/pantry.sqlite`. Source edits to the interface or agents rebuild the local runtime; refresh the browser to see them.

    node scripts/build.mjs
    node --test tests/agents.test.mjs

The build emits one Cloudflare-compatible ESM Worker at `dist/server/index.js`, including the dashboard assets and seed data. Hosted persistence uses Sites D1. Local and hosted implementations share the same SQL schema and request handler. No external packages are required; the initial framework was replaced after the machine ran out of disk space during installation.

## What works

- All 5,848 source rows loaded: 8 menu rows, 2,920 sales rows and 2,920 inventory rows.
- 37 invalid sales records quarantined. CSV schema, numeric, date, category, duplicate and foreign-key validation.
- Date/category filters; contribution-ranked menu; wastage cost and low-margin flags.
- Item-level 3/5/7-day forecasts; backtested model selection; explicit heuristic uncertainty bands.
- Estimated stock, lead-time coverage, reorder thresholds and conflict resolution.
- Wastage spikes, sales dips, stock-out risks and unreliable inventory alerts.
- CSV replacement import and validated manual record entry with atomic persistence.
- Report and issue exports, downloadable CSV templates, full execution trace.
- Data-only conversational assistant grounded in agent outputs, and an implemented optional live LLM tool-calling agent.

## Important submission limitation

Without an AI provider key, the assistant uses a deterministic data-only fallback and labels that mode explicitly. With Groq configured, it uses a bounded local function-calling loop over the specialist outputs. Separate analytical agents still run statistical and rule-based methods; they are not represented as separate LLMs.

To enable the live conversation agent, configure `GROQ_API_KEY` as a server-side environment secret and optionally `GROQ_MODEL` (default `openai/gpt-oss-120b`). OpenAI remains supported as a fallback with `OPENAI_API_KEY`. Never put keys in browser code or Git. The local process loads `.env`; `.env.example` documents the names. For hosted Sites, use runtime environment secrets. The Groq endpoint uses Chat Completions local function calling, queries named specialist tools, reports its model and evidence sources, and has a six-turn limit.

Groq tool-calling reference: https://console.groq.com/docs/tool-use/local-tool-calling

## Architecture

1. `IngestionAgent` in `lib/agents/ingestion.ts` validates, normalizes, joins menu IDs and quarantines invalid rows.
2. `FinancialAgent` in `lib/agents/financial.ts` ranks actual contribution after recorded wastage.
3. `DemandAgent` in `lib/agents/demand.ts` selects the forecast model per item and checks supplier lead-time stock coverage.
4. `AnomalyAgent` in `lib/agents/anomaly.ts` detects historical exceptions and stock uncertainty.
5. `ConversationAgent` in `lib/agents/conversation.ts` queries specialist outputs through live LLM tools when configured; otherwise uses a labeled deterministic fallback.
6. `Orchestrator` in `lib/agents/orchestrator.ts` sequences dependencies, records execution traces, consolidates outputs and resolves conflicting recommendations.

The orchestrator withholds reorder quantities when stock is unreliable. A recent waste spike plus a reorder signal requires owner review. Low margin plus low stock prioritizes availability while prompting a cost review. Suggestions do not place orders.

The database stores each raw source, normalized snapshots, consolidated specialist outputs, and question/answer records. Seed data initializes the database on first access. Imports replace only selected sources in an atomic save; manual entry appends a validated row. Rejected imports leave the last successful dataset intact. The private deployment is a single-business workspace, not a multi-tenant SaaS application.

## Analytics definitions and limitations

- Dataset coverage: 2025-09-01 to 2026-08-31. Initial view: last 30 days, 2026-08-02 through 2026-08-31.
- Initial revenue: 60,893.10 currency units; contribution: 40,078.10 CU. Highest contribution: Avocado Toast. 24 recent alerts and 5 reorder suggestions.
- CU means unspecified currency; no currency conversion is assumed.
- Revenue = completed quantity × selling price. Contribution = revenue - quantity × item cost - recorded wastage × item cost. It excludes rent, labor, taxes and other overhead; it is not net profit.
- Invalid/missing sales are unknown observations, not zeros. Wastage remains charged when a sales record is missing, so incomplete periods can understate contribution.
- Forecast candidates: 56-day same-weekday average (at least 3 matching observations) and the last 14 observed days. Select lowest mean absolute error over the last 14 observed days, using strictly prior observations at each origin. This is lightweight model selection, not an independent final accuracy evaluation.
- Forecast bands use ±1.5 × backtest MAE. They are heuristic ranges, not calibrated confidence intervals. Forecasts start after the latest dataset sales date, not the system date.
- Stock = starting stock - completed sales - wastage. Receipts and transfers are absent. Missing, stale or negative balances withhold advice. Item units are not a recipe/ingredient inventory model.
- Reorder trigger: max(recorded threshold, expected supplier lead-time demand + 1.5 × MAE). Quantity targets lead-time demand plus 2 extra days of expected demand and that buffer.
- A margin below 40% is an explicit business review threshold, not a claim about industry norms.
- Wastage spike: greater than max(prior 28-day mean + 3 SD, twice that mean, 3 units), with at least 7 prior records. Sales dip: below half the prior 56-day same-weekday average, with at least 4 matches. Alert list covers the latest 30 days independently of the financial date filter.

## Demo flow

1. Open Overview: explain revenue, contribution and wastage; inspect the daily chart.
2. Open Data sources: show the 37 excluded records and export the quality report.
3. Open Menu performance: contrast contribution ranking with volume or margin ranking.
4. Open Demand & inventory: choose 3 or 7 days; show lead-time coverage, order suggestions and withheld advice.
5. Open Alerts: filter waste spikes, sales dips and stock risks.
6. Open Agent workspace: rerun all agents, show role separation and conflict rules.
7. Ask “How is Espresso doing?” or “What should I reorder?”; disclose data-only mode if no provider is connected.
8. Import a corrected CSV or manually add a valid next-day record. Refresh to show persistence and updated insights.

## Validation

Automated tests cover independent CSV financial reconciliation, category/date partitions, malformed CSV handling, row quarantine, forecast ranges, missing-data behavior, orchestration outputs, data-only chat, storage initialization, atomic invalid imports, manual-entry persistence and request guards. Browser visual/interaction QA was not performed. The optional `get_business_report` WebMCP read-only tool is feature-detected and schema-validated; no supported live WebMCP browser context was available to verify registration.
