# Console Statistics & Observability — Design

**Date:** 2026-06-11
**Status:** Approved (pending spec review)
**Repos touched:** `wisefood-ui` (frontend), `wisefood-api` (gateway backend)

## Problem

The `/console` index ([app/pages/console/index.vue](../../../app/pages/console/index.vue)) shows
**entirely hardcoded placeholder KPIs** ("184.2K assets", "28.4K LLM requests today", etc.) and two
quick-access cards marked INOP ("Prompt / LLM Controls", "Analytics Reports") that link to a
`/console/operations` page **that does not exist**.

We want a real, informative console: live content statistics from the catalog (WiseFood Data API),
and LLM observability + prompt visibility from Langfuse — kept in one place so operators don't
hop between tools.

## Key findings (verified during exploration)

1. **Catalog / Data API content is reachable today.** The frontend `catalogApi.ts` → `wisefoodApi`
   client → `getWisefoodApiUrl()` already calls `/v1/{entity}/search`. Every `/search` returns
   `total` + `facets` (counts grouped by `status`, `review_status`, `region`, `publication_year`, …).
   **No backend change needed** for content stats.
2. **Langfuse is deployed in-cluster** (`langfuse-web.langfuse.svc.cluster.local:3000`, public
   `langfuse.wisefood.gr`); prod secrets `langfuse-public-key` / `langfuse-secret-key` exist;
   `foodscholar` already **writes** traces to it.
3. **wisefood-api does NOT yet read from Langfuse.** No Langfuse code, not a dependency — only two
   planning docs (`langfuse-integration-AGENT.md`, which is the *producer* side: writing traces +
   managing prompts). The browser **cannot** call Langfuse directly (secret-key Basic auth + CORS),
   so a **read-only proxy in wisefood-api must be built**.
4. **Console access control already exists.** `app/middleware/console.global.ts` redirects any
   non-privileged user away from `/console/*` via `canAccessConsole` (= roles `['expert','admin']`,
   `app/utils/authRoles.ts`). This automatically protects the new `/console/operations` page.
   The API gate `auth("admin,expert")` matches these roles exactly.
5. **Charting:** `@nuxt/ui ^4.2.1` is present (its charts build on unovis). Confirm the exact chart
   component during implementation; only add a charting peer dep after explicit approval.

## Architecture

```
wisefood-ui (frontend)
  /console (index)            → real KPI tiles (catalog + observability headline)
  /console/operations (NEW)   → 2-tab deep dashboard (Content | Observability)
      catalogApi.ts        (EXISTS) → /v1/*/search facets   [content stats]
      observabilityApi.ts  (NEW)    → /v1/observability/*   [Langfuse, via proxy]
            │ wisefoodApi client (Bearer)
            ▼
wisefood-api (gateway)
  routers/observability.py (NEW)  prefix /api/v1/observability, auth("admin,expert")
      GET /status   GET /metrics   GET /traces   GET /prompts   GET /prompts/{name}
  backend/langfuse_read.py (NEW)  httpx.AsyncClient singleton, Basic auth (pk:sk)
            │ Basic auth, in-cluster
            ▼
  Langfuse public API @ langfuse-web.langfuse.svc.cluster.local:3000
      /api/public/metrics   /api/public/traces   /api/public/v2/prompts
```

Two **decoupled** data sources: catalog stats work even if Langfuse is down/unconfigured; every
observability endpoint degrades to `{enabled:false}` + empty data, never a 500.

## Component 1 — Langfuse read proxy (wisefood-api, NEW)

Read-only counterpart to the existing producer-side runbook. Follows the verified
`backend/recipewrangler.py` client + `routers/recipewrangler.py` router conventions.

**`src/backend/langfuse_read.py`**
- `langfuse_read_enabled()` — true only when `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` set
  (mirrors the runbook's opt-in contract).
- `httpx.AsyncClient` singleton, `base_url = LANGFUSE_BASE_URL`, `auth=(public, secret)` Basic.
- `fetch_metrics(query)` → `GET /api/public/metrics` (**v1** metrics API — the **v2** metrics API
  is Cloud-only and unavailable on self-hosted Langfuse, which WiseFood runs). Query is a
  URL-encoded JSON object `{view, metrics:[{measure,aggregation}], dimensions:[{field}], filters:[],
  fromTimestamp, toTimestamp, timeDimension?:{granularity}}`; response is
  `{ "data": [ {<dimension>, "<measure>_<aggregation>": "<stringified-number>"} ] }`. Used for
  counts, token sums, cost, latency, grouped by `name` / `providedModelName` / time bucket.
- `fetch_traces(params)` → `GET /api/public/traces`: recent traces (name, latency, cost, tokens,
  tags, timestamp).
- `fetch_prompts()` / `fetch_prompt(name)` → `GET /api/public/v2/prompts` (list) and
  `GET /api/public/v2/prompts/{name}` (detail): name/version/labels/tags. (The list endpoint has no
  SDK convenience method, so it is fetched over HTTP; single-prompt detail may alternatively use the
  SDK `get_prompt` for client-side caching/fallback.)
- All methods raise nothing into the request path on Langfuse failure — return empty + log WARNING.

**`src/routers/observability.py`** — `APIRouter(prefix="/api/v1/observability")`, every route
`@render()` + `Depends(auth("admin,expert"))`:
- `GET /status` → `{ enabled, langfuse_reachable, version? }`
- `GET /metrics?from&to&granularity` → normalized series: requests, tokens (in/out/total), cost,
  latency percentiles; plus breakdown by **model** and by **service tag**
  (foodchat / recipewrangler / foodscholar).
- `GET /traces?limit&tag&from&to` → recent trace rows for a table.
- `GET /prompts` → registry list (name, latest version, labels, tags, updatedAt).
- `GET /prompts/{name}` → single prompt detail (versions, labels, tags) — **read-only**.

**Config + deploy:** add `LANGFUSE_BASE_URL` (default in-cluster URL), `LANGFUSE_PUBLIC_KEY`,
`LANGFUSE_SECRET_KEY` (default empty) to `main.py` settings; register the router; emit the 3 env
vars for the k8s Deployment (secrets already exist).

**Scope guard (YAGNI):** read-only. No writing traces; **no editing prompts** from the console —
prompt content stays Langfuse-UI-authoritative per the runbook contract. The console *shows*
prompts; it never mutates them.

## Component 2 — Catalog statistics (wisefood-ui, real data today)

New `catalogApi` method `fetchCatalogStats()`. Fans out `POST /v1/{entity}/search` with
`{ limit: 1, fields: [...] }` (via `Promise.allSettled`) for **catalog artifacts only — NO
organizations** (per explicit user instruction):

- guides, guidelines, articles, textbooks, textbook passages, recipe collections,
  food composition tables.

From each response read: `total` (headline count), `facets.review_status` (editorial pipeline:
unreviewed / pending_review / in_review / verified / changes_requested / rejected),
`facets.status` (lifecycle: draft / active / archived). Recipe **count** comes from the existing
`/recipewrangler/recipes/count`.

Returns a normalized `{ entities[], reviewPipeline, totals }`. ~7 lightweight parallel requests,
cached ~5 min client-side. A failed entity fetch yields "—" for that tile; others still render.

## Component 3 — UI surfaces (wisefood-ui)

**`/console` index** — replace the 4 fake KPI tiles with real ones:
- Total Catalog Assets (sum of entity totals)
- Pending Curation Reviews (sum of non-`verified` review_status)
- Recipes (count endpoint)
- LLM Requests (from `/observability/metrics`; graceful "—" when disabled)

Flip the "Prompt / LLM Controls" and "Analytics Reports" cards INOP → live, pointing at
`/console/operations`. Reuse the existing card / skeleton / `available` visual system in the file.

**`/console/operations` (NEW page)** — protected automatically by `console.global.ts`. Two tabs:
- **Content** — per-entity count cards; review-pipeline funnel/bars (curation backlog); status
  breakdowns. From catalog stats.
- **Observability** — LLM request/token/cost trend; latency p50/p95/p99; breakdown by model and by
  service tag; recent-traces table; **Prompts** panel (read-only list with version/label/tags). Each
  panel independently: skeleton → data, or "Observability not configured" empty-state when
  `/observability/status` reports `enabled:false`.

Charts reuse `@nuxt/ui` chart primitives (unovis-based) or inline SVG sparklines; any new charting
peer dep requires explicit approval before install.

## Error handling

- Observability proxy → `{enabled:false}` + empty data on missing keys / unreachable Langfuse;
  never 500. UI renders empty-states.
- Catalog stats → `Promise.allSettled`; per-tile "—" on failure, page still renders.
- All observability endpoints `admin,expert`-gated server-side; `/console/*` `expert,admin`-gated
  client-side (existing middleware). The two gates use the same role set.

## Testing

- **Backend:** unittest — disabled-mode no-op (`langfuse_read_enabled()` false → empty), and a
  mocked-httpx metrics-shape test. Mirrors the runbook's test style.
- **Frontend:** `nuxt typecheck` + `eslint` clean; manual eyeball of both pages via the run/verify
  skill (catalog tab shows real numbers; observability tab shows data or the empty-state).

## Rollout order

1. Backend proxy behind its gate — safe to deploy dark (no keys ⇒ no-op).
2. Frontend catalog stats — real value immediately, no Langfuse dependency.
3. Wire observability UI against the proxy.
4. Ops sets the 3 env vars to light up observability.

## Out of scope (YAGNI)

- Writing traces or editing prompts from the console.
- Organizations stats (excluded per user).
- New SQL aggregation endpoints in wisefood-api (households/members/meal-plan counts) — not
  requested this round; catalog + Langfuse only.
- Active-sessions / real-time presence KPIs.
```
