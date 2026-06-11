# Console Statistics & Observability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded console KPIs with real catalog content statistics and Langfuse-backed LLM observability, surfaced on the `/console` index and a new `/console/operations` dashboard.

**Architecture:** Two repos. (A) `wisefood-api` gains a read-only Langfuse proxy (`backend/langfuse_read.py` + `routers/observability.py`) that holds Langfuse keys server-side and re-gates with Keycloak `admin,expert` — the browser cannot call Langfuse directly. (B) `wisefood-ui` adds a catalog-stats aggregator (frontend-only, real data today via existing `/v1/*/search` facets), an `observabilityApi` client, real KPIs on `/console`, and a new 2-tab `/console/operations` page. The two data sources are decoupled: catalog stats work even when Langfuse is unconfigured (proxy degrades to `{enabled:false}`).

**Tech Stack:** Python 3 / FastAPI / httpx (wisefood-api); Nuxt 3 / Vue 3 / TypeScript / `@nuxt/ui` v4 (wisefood-ui). Langfuse self-hosted — **v1** `/api/public/metrics` (v2 is Cloud-only).

**Spec:** `docs/superpowers/specs/2026-06-11-console-statistics-observability-design.md`

**Branch:** `feat/console-statistics-observability` (already created; spec committed there).

---

## File Structure

### wisefood-api (`/mnt/workspaces/wisefood/wisefood-api`)
- **Create** `src/backend/langfuse_read.py` — httpx singleton + gated read methods (metrics/traces/prompts). One responsibility: talk to Langfuse public API.
- **Create** `src/routers/observability.py` — FastAPI router, `/api/v1/observability/*`, role-gated, normalizes Langfuse responses for the UI.
- **Modify** `src/main.py` — add `LANGFUSE_*` settings; register the observability router.
- **Create** `tests/test_observability.py` — disabled-mode no-op + normalization unit tests (pytest; httpx already a dep).
- **Create** `tests/__init__.py`, `pytest.ini` — minimal test harness (none exists today).
- **Modify** `requirements.txt` — add `pytest` (dev) only. (No `langfuse` SDK needed; we call the HTTP API with httpx, which is already present.)

### wisefood-ui (`/mnt/workspaces/wisefood/wisefood-ui`)
- **Create** `app/services/observabilityApi.ts` — typed client for `/v1/observability/*`.
- **Modify** `app/services/catalogApi.ts` — add `fetchCatalogStats()` aggregator + `CatalogStats` types.
- **Create** `app/composables/useConsoleStats.ts` — orchestrates catalog + observability fetches with caching + graceful per-source failure.
- **Modify** `app/pages/console/index.vue` — real KPI tiles; flip INOP cards to live → `/console/operations`.
- **Create** `app/pages/console/operations.vue` — 2-tab dashboard (Content | Observability).
- **Create** `app/components/console/stats/StatTile.vue`, `ReviewPipeline.vue`, `MetricTrend.vue`, `TracesTable.vue`, `PromptsPanel.vue` — focused presentational components.

---

## PHASE A — wisefood-api Langfuse read proxy

> Working directory for all Phase A tasks: `/mnt/workspaces/wisefood/wisefood-api`
> Run Python with `PYTHONPATH=src` (repo convention).

### Task A1: Test harness scaffold

**Files:**
- Create: `/mnt/workspaces/wisefood/wisefood-api/pytest.ini`
- Create: `/mnt/workspaces/wisefood/wisefood-api/tests/__init__.py`
- Modify: `/mnt/workspaces/wisefood/wisefood-api/requirements.txt`

- [ ] **Step 1: Add pytest to requirements**

Append to `requirements.txt`:
```
pytest==8.3.3
```

- [ ] **Step 2: Create pytest.ini**

Create `pytest.ini`:
```ini
[pytest]
pythonpath = src
testpaths = tests
python_files = test_*.py
```

- [ ] **Step 3: Create empty tests package init**

Create `tests/__init__.py` with no content (empty file).

- [ ] **Step 4: Install and verify pytest runs (collects nothing yet)**

Run: `pip install -r requirements.txt && python -m pytest -q`
Expected: exits 0 with "no tests ran" (or collects 0 items). No import errors.

- [ ] **Step 5: Commit**

```bash
git add requirements.txt pytest.ini tests/__init__.py
git commit -m "test: add minimal pytest harness for wisefood-api"
```

---

### Task A2: Langfuse read client — disabled-mode no-op

**Files:**
- Create: `/mnt/workspaces/wisefood/wisefood-api/src/backend/langfuse_read.py`
- Test: `/mnt/workspaces/wisefood/wisefood-api/tests/test_observability.py`

The client mirrors the producer-side runbook's opt-in contract: active only when both keys are set; otherwise every method is a no-op returning empty data. It NEVER raises into a request path.

- [ ] **Step 1: Write the failing test**

Create `tests/test_observability.py`:
```python
import os
import pytest


def _clear_keys():
    for k in ("LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY"):
        os.environ.pop(k, None)


def test_disabled_when_keys_missing():
    _clear_keys()
    from backend.langfuse_read import langfuse_read_enabled
    assert langfuse_read_enabled() is False


@pytest.mark.asyncio
async def test_fetch_metrics_returns_empty_when_disabled():
    _clear_keys()
    from backend.langfuse_read import LANGFUSE_READ
    result = await LANGFUSE_READ.fetch_metrics(
        view="traces", measure="count", aggregation="count",
        dimension="name", from_ts="2026-06-01T00:00:00Z", to_ts="2026-06-11T00:00:00Z",
    )
    assert result == {"data": []}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_observability.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'backend.langfuse_read'` (and missing `pytest-asyncio`).

- [ ] **Step 3: Add pytest-asyncio and the client**

Append to `requirements.txt`:
```
pytest-asyncio==0.24.0
```
Add to `pytest.ini` under `[pytest]`:
```ini
asyncio_mode = auto
```
Create `src/backend/langfuse_read.py`:
```python
"""Read-only Langfuse public-API client. No-op unless both keys are set.

Self-hosted Langfuse: use the v1 Metrics API (`/api/public/metrics`); the v2
Metrics API is Cloud-only. All methods degrade to empty data on any failure and
never raise into the request path (logged at WARNING).
"""
import json
import logging
import os
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)

_DEFAULT_BASE_URL = "http://langfuse-web.langfuse.svc.cluster.local:3000"


def langfuse_read_enabled() -> bool:
    return bool(os.getenv("LANGFUSE_PUBLIC_KEY") and os.getenv("LANGFUSE_SECRET_KEY"))


class LangfuseRead:
    """Singleton httpx client for the Langfuse public API (Basic auth)."""

    _client: Optional[httpx.AsyncClient] = None

    @classmethod
    def _get_client(cls) -> Optional[httpx.AsyncClient]:
        if not langfuse_read_enabled():
            return None
        if cls._client is None:
            base = os.getenv("LANGFUSE_BASE_URL", _DEFAULT_BASE_URL).rstrip("/")
            cls._client = httpx.AsyncClient(
                base_url=base,
                auth=(os.environ["LANGFUSE_PUBLIC_KEY"], os.environ["LANGFUSE_SECRET_KEY"]),
                timeout=20.0,
            )
        return cls._client

    @classmethod
    async def fetch_metrics(
        cls, *, view: str, measure: str, aggregation: str,
        dimension: Optional[str], from_ts: str, to_ts: str,
        granularity: Optional[str] = None,
    ) -> Dict[str, Any]:
        """v1 GET /api/public/metrics. Returns {"data": [...]} or {"data": []} on failure."""
        client = cls._get_client()
        if client is None:
            return {"data": []}
        query: Dict[str, Any] = {
            "view": view,
            "metrics": [{"measure": measure, "aggregation": aggregation}],
            "dimensions": [{"field": dimension}] if dimension else [],
            "filters": [],
            "fromTimestamp": from_ts,
            "toTimestamp": to_ts,
        }
        if granularity:
            query["timeDimension"] = {"granularity": granularity}
        try:
            resp = await client.get("/api/public/metrics", params={"query": json.dumps(query)})
            resp.raise_for_status()
            body = resp.json()
            return {"data": body.get("data", []) if isinstance(body, dict) else []}
        except Exception as exc:  # noqa: BLE001 — never raise into request path
            logger.warning("Langfuse fetch_metrics failed: %s", exc)
            return {"data": []}

    @classmethod
    async def fetch_traces(cls, *, limit: int = 50, tag: Optional[str] = None) -> List[Dict[str, Any]]:
        client = cls._get_client()
        if client is None:
            return []
        params: Dict[str, Any] = {"limit": max(1, min(limit, 100))}
        if tag:
            params["tags"] = tag
        try:
            resp = await client.get("/api/public/traces", params=params)
            resp.raise_for_status()
            body = resp.json()
            return body.get("data", []) if isinstance(body, dict) else []
        except Exception as exc:  # noqa: BLE001
            logger.warning("Langfuse fetch_traces failed: %s", exc)
            return []

    @classmethod
    async def fetch_prompts(cls) -> List[Dict[str, Any]]:
        client = cls._get_client()
        if client is None:
            return []
        try:
            resp = await client.get("/api/public/v2/prompts", params={"limit": 100})
            resp.raise_for_status()
            body = resp.json()
            return body.get("data", []) if isinstance(body, dict) else []
        except Exception as exc:  # noqa: BLE001
            logger.warning("Langfuse fetch_prompts failed: %s", exc)
            return []

    @classmethod
    async def fetch_prompt(cls, name: str) -> Optional[Dict[str, Any]]:
        client = cls._get_client()
        if client is None:
            return None
        try:
            resp = await client.get(f"/api/public/v2/prompts/{name}")
            resp.raise_for_status()
            return resp.json()
        except Exception as exc:  # noqa: BLE001
            logger.warning("Langfuse fetch_prompt(%s) failed: %s", name, exc)
            return None

    @classmethod
    async def reachable(cls) -> bool:
        client = cls._get_client()
        if client is None:
            return False
        try:
            resp = await client.get("/api/public/health")
            return resp.status_code < 500
        except Exception:  # noqa: BLE001
            return False


LANGFUSE_READ = LangfuseRead
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pip install -r requirements.txt && python -m pytest tests/test_observability.py -q`
Expected: 2 passed.

- [ ] **Step 5: Verify py_compile is clean**

Run: `PYTHONPATH=src python -m py_compile src/backend/langfuse_read.py && echo ok`
Expected: `ok`

- [ ] **Step 6: Commit**

```bash
git add src/backend/langfuse_read.py tests/test_observability.py requirements.txt pytest.ini
git commit -m "feat: add read-only Langfuse public-API client (no-op when disabled)"
```

---

### Task A3: Observability router with response normalization

**Files:**
- Create: `/mnt/workspaces/wisefood/wisefood-api/src/routers/observability.py`
- Test: `/mnt/workspaces/wisefood/wisefood-api/tests/test_observability.py` (append)

The router normalizes the v1 metrics shape (`{"data":[{"name":"x","count_count":"10"}]}`, string values) into UI-friendly `{label, value}` rows. Normalization is a pure function — tested directly without HTTP.

- [ ] **Step 1: Write the failing test (append)**

Append to `tests/test_observability.py`:
```python
def test_normalize_metric_rows_parses_string_values():
    from routers.observability import normalize_metric_rows
    raw = {"data": [
        {"name": "qa-answer", "count_count": "10"},
        {"name": "meal-plan", "count_count": "5"},
    ]}
    rows = normalize_metric_rows(raw, dimension="name", value_key="count_count")
    assert rows == [
        {"label": "qa-answer", "value": 10.0},
        {"label": "meal-plan", "value": 5.0},
    ]


def test_normalize_metric_rows_handles_empty():
    from routers.observability import normalize_metric_rows
    assert normalize_metric_rows({"data": []}, dimension="name", value_key="count_count") == []
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_observability.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'routers.observability'`.

- [ ] **Step 3: Write the router**

Create `src/routers/observability.py`:
```python
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query, Request

from auth import auth
from backend.langfuse_read import LANGFUSE_READ, langfuse_read_enabled
from routers.generic import render

router = APIRouter(prefix="/api/v1/observability", tags=["Observability"])


def normalize_metric_rows(raw: Dict[str, Any], *, dimension: str, value_key: str) -> List[Dict[str, Any]]:
    """Convert v1 metrics rows ({dimension: label, "<measure>_<agg>": "10"}) to
    [{label, value(float)}]. Skips rows that can't be parsed."""
    rows: List[Dict[str, Any]] = []
    for item in raw.get("data", []) if isinstance(raw, dict) else []:
        if not isinstance(item, dict):
            continue
        label = item.get(dimension)
        try:
            value = float(item.get(value_key))
        except (TypeError, ValueError):
            continue
        rows.append({"label": str(label) if label is not None else "unknown", "value": value})
    return rows


@router.get("/status", dependencies=[Depends(auth("admin,expert"))])
@render()
async def status(request: Request):
    enabled = langfuse_read_enabled()
    reachable = await LANGFUSE_READ.reachable() if enabled else False
    return {"enabled": enabled, "langfuse_reachable": reachable}


@router.get("/metrics", dependencies=[Depends(auth("admin,expert"))])
@render()
async def metrics(
    request: Request,
    from_ts: str = Query(..., alias="from"),
    to_ts: str = Query(..., alias="to"),
    view: str = Query("observations"),
    measure: str = Query("count"),
    aggregation: str = Query("count"),
    dimension: Optional[str] = Query("providedModelName"),
    granularity: Optional[str] = Query(None),
):
    raw = await LANGFUSE_READ.fetch_metrics(
        view=view, measure=measure, aggregation=aggregation,
        dimension=dimension, from_ts=from_ts, to_ts=to_ts, granularity=granularity,
    )
    value_key = f"{measure}_{aggregation}"
    rows = normalize_metric_rows(raw, dimension=dimension or "name", value_key=value_key)
    return {"rows": rows, "enabled": langfuse_read_enabled()}


@router.get("/traces", dependencies=[Depends(auth("admin,expert"))])
@render()
async def traces(
    request: Request,
    limit: int = Query(50, ge=1, le=100),
    tag: Optional[str] = Query(None),
):
    rows = await LANGFUSE_READ.fetch_traces(limit=limit, tag=tag)
    return {"traces": rows, "enabled": langfuse_read_enabled()}


@router.get("/prompts", dependencies=[Depends(auth("admin,expert"))])
@render()
async def prompts(request: Request):
    return {"prompts": await LANGFUSE_READ.fetch_prompts(), "enabled": langfuse_read_enabled()}


@router.get("/prompts/{name}", dependencies=[Depends(auth("admin,expert"))])
@render()
async def prompt_detail(request: Request, name: str):
    return {"prompt": await LANGFUSE_READ.fetch_prompt(name), "enabled": langfuse_read_enabled()}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_observability.py -q`
Expected: 4 passed.

- [ ] **Step 5: Verify py_compile**

Run: `PYTHONPATH=src python -m py_compile src/routers/observability.py && echo ok`
Expected: `ok`

- [ ] **Step 6: Commit**

```bash
git add src/routers/observability.py tests/test_observability.py
git commit -m "feat: add observability router proxying Langfuse metrics/traces/prompts"
```

---

### Task A4: Wire settings + register router in main.py

**Files:**
- Modify: `/mnt/workspaces/wisefood/wisefood-api/src/main.py`

- [ ] **Step 1: Add Langfuse settings**

In `src/main.py`, find the block of `self.settings[...]` assignments (near line 36 where `RECIPEWRANGLER_URL` is set) and add directly after the `FOODCHAT_URL` line:
```python
        self.settings["LANGFUSE_BASE_URL"] = os.getenv("LANGFUSE_BASE_URL", "http://langfuse-web.langfuse.svc.cluster.local:3000")
        self.settings["LANGFUSE_PUBLIC_KEY"] = os.getenv("LANGFUSE_PUBLIC_KEY", "")
        self.settings["LANGFUSE_SECRET_KEY"] = os.getenv("LANGFUSE_SECRET_KEY", "")
```

- [ ] **Step 2: Import and register the router**

Find where routers are imported (top of `main.py`, e.g. `from routers.recipewrangler import router as recipewrangler_router` — match the existing import alias style). Add an import alongside them:
```python
from routers.observability import router as observability_router
```
Find the `api.include_router(...)` block (near line 153-160) and add after `api.include_router(images_router)`:
```python
api.include_router(observability_router)
```
(If the existing imports use a different alias convention, match it exactly — check the file first.)

- [ ] **Step 3: Verify py_compile + app imports cleanly**

Run: `PYTHONPATH=src python -c "import main; print('app imports ok')"`
Expected: `app imports ok` (no ImportError).

- [ ] **Step 4: Verify the route is registered**

Run: `PYTHONPATH=src python -c "import main; paths=[r.path for r in main.api.routes]; assert '/api/v1/observability/status' in paths, paths; print('route registered')"`
Expected: `route registered`

- [ ] **Step 5: Run full backend test suite (no regressions)**

Run: `python -m pytest -q`
Expected: all pass (the 4 observability tests).

- [ ] **Step 6: Commit**

```bash
git add src/main.py
git commit -m "feat: register observability router and Langfuse config in wisefood-api"
```

---

### Task A5: Deployment manifest env vars (handoff artifact)

**Files:**
- Modify: the wisefood-api Deployment manifest in `platform-deployment` (jsonnet lib). Find it first.

- [ ] **Step 1: Locate the wisefood-api deployment definition**

Run: `grep -rln "RECIPEWRANGLER_URL\|wisefood-api" /mnt/workspaces/wisefood/platform-deployment/lib`
Expected: a `.libsonnet` file defining the wisefood-api env. Open it and find the env block.

- [ ] **Step 2: Add the 3 Langfuse env vars to the wisefood-api env block**

Following the existing pattern in that file (compare to how `foodscholar.libsonnet` injects `LANGFUSE_PUBLIC_KEY`/`LANGFUSE_SECRET_KEY` from secrets — keys already exist in prod), add:
```jsonnet
LANGFUSE_BASE_URL: "http://langfuse-web.langfuse.svc.cluster.local:3000",
LANGFUSE_PUBLIC_KEY: envSource.secretKeyRef.withName(config.secrets.api.langfuse_public_key)+envSource.secretKeyRef.withKey("password")+envSource.secretKeyRef.withOptional(true),
LANGFUSE_SECRET_KEY: envSource.secretKeyRef.withName(config.secrets.api.langfuse_secret_key)+envSource.secretKeyRef.withKey("password")+envSource.secretKeyRef.withOptional(true),
```
(Match the exact `config.secrets.api.*` key names used by foodscholar; if they differ, mirror whatever foodscholar uses since the secrets are shared.)

- [ ] **Step 3: Verify jsonnet renders (if a build command exists)**

Run: `grep -rn "jsonnet\|tk \|tanka" /mnt/workspaces/wisefood/platform-deployment/Makefile 2>/dev/null | head`
If a render/build target exists, run it and confirm no error. If not, skip — this is a handoff artifact applied by the operator.

- [ ] **Step 4: Commit**

```bash
cd /mnt/workspaces/wisefood/platform-deployment
git add -A
git commit -m "ops: inject Langfuse read keys into wisefood-api deployment"
```
(Note: this is a separate git repo from wisefood-api. Commit there.)

---

## PHASE B — wisefood-ui catalog statistics (real data, no Langfuse dependency)

> Working directory for all Phase B/C/D tasks: `/mnt/workspaces/wisefood/wisefood-ui`
> Run tests/lint with the repo's tooling. Typecheck: `npx vue-tsc --noEmit -p tsconfig.json`. Lint: `npx eslint <file>`.

### Task B1: Catalog stats aggregator in catalogApi.ts

**Files:**
- Modify: `/mnt/workspaces/wisefood/wisefood-ui/app/services/catalogApi.ts`

`fetchCatalogStats()` fans out `searchX({limit:1, fields:[...]})` for the 7 catalog artifacts (NO organizations), reading `total` + `facets`. Uses `Promise.allSettled` so one failure doesn't sink the rest. The catalog API already exposes per-entity search methods returning `{total, facets}` (e.g. `searchGuides`). Reuse them.

- [ ] **Step 1: Add the types (near the other Catalog*SearchResult types, ~line 269)**

In `catalogApi.ts`, add:
```typescript
export interface CatalogEntityStat {
  key: string            // 'guides' | 'guidelines' | ...
  label: string          // human label
  total: number          // null-safe count; -1 means "failed to load"
  reviewStatus: Record<string, number>  // review_status facet → count
  status: Record<string, number>        // lifecycle status facet → count
}

export interface CatalogStats {
  entities: CatalogEntityStat[]
  totalAssets: number          // sum of successful entity totals
  pendingReviews: number       // sum of non-'verified' review_status across entities
}
```

- [ ] **Step 2: Add a facet-to-map helper (inside the class or as a module fn)**

Add this module-level helper above the class:
```typescript
const facetMap = (buckets: CatalogFacetBucket[] | undefined): Record<string, number> => {
  const out: Record<string, number> = {}
  for (const b of buckets ?? []) out[b.value] = b.count
  return out
}
```

- [ ] **Step 3: Add the aggregator method to CatalogApiService**

Add inside the class:
```typescript
  async fetchCatalogStats(): Promise<CatalogStats> {
    const specs: Array<{ key: string; label: string; run: () => Promise<{ total: number; facets: Record<string, CatalogFacetBucket[]> }> }> = [
      { key: 'guides', label: 'Guides', run: () => this.searchGuides({ limit: 1, fields: ['status', 'review_status'] }) },
      { key: 'guidelines', label: 'Guidelines', run: () => this.searchGuidelines({ limit: 1, fields: ['status', 'review_status'] }) },
      { key: 'articles', label: 'Articles', run: () => this.searchArticles({ limit: 1, fields: ['status', 'review_status'] }) },
      { key: 'textbooks', label: 'Textbooks', run: () => this.searchTextbooks({ limit: 1, fields: ['status', 'review_status'] }) },
      { key: 'passages', label: 'Textbook Passages', run: () => this.searchTextbookPassages({ limit: 1, fields: ['status'] }) },
      { key: 'rcollections', label: 'Recipe Collections', run: () => this.searchRecipeCollections({ limit: 1, fields: ['status'] }) },
      { key: 'fctables', label: 'Food Composition Tables', run: () => this.searchFctables({ limit: 1, fields: ['status'] }) },
    ]

    const settled = await Promise.allSettled(specs.map(s => s.run()))
    const entities: CatalogEntityStat[] = settled.map((res, i) => {
      const spec = specs[i]
      if (res.status === 'fulfilled') {
        return {
          key: spec.key,
          label: spec.label,
          total: res.value.total,
          reviewStatus: facetMap(res.value.facets['review_status']),
          status: facetMap(res.value.facets['status']),
        }
      }
      return { key: spec.key, label: spec.label, total: -1, reviewStatus: {}, status: {} }
    })

    const totalAssets = entities.filter(e => e.total >= 0).reduce((sum, e) => sum + e.total, 0)
    const pendingReviews = entities.reduce((sum, e) => {
      const verified = e.reviewStatus['verified'] ?? 0
      const all = Object.values(e.reviewStatus).reduce((a, b) => a + b, 0)
      return sum + Math.max(0, all - verified)
    }, 0)

    return { entities, totalAssets, pendingReviews }
  }
```

> NOTE (verified during planning): only `searchGuides` and `searchGuidelines` exist today in `catalogApi.ts`. The other **5 methods are NEW work** in this task — `searchArticles`, `searchTextbooks`, `searchTextbookPassages`, `searchRecipeCollections`, `searchFctables`. Add each by mirroring `searchGuides` exactly: same body shape, `wisefoodApi.post(\`${this.basePath}/<entity>/search\`, {...})`, and the same `total`/`facets` extraction via `extractSearchTotal`/`extractSearchFacets`. Entity paths: articles→`articles`, textbooks→`textbooks`, passages→`textbook-passages`, collections→`rcollections`, FC tables→`fctables`. Each returns `{ <entity>: [...], total, facets }` (the aggregator only reads `total` + `facets`, so a lean result type is fine — define `Catalog<Entity>SearchResult` mirroring `CatalogGuideSearchResult`). All these entities expose `/search` per the Data API recon.

- [ ] **Step 4: Verify the search methods exist (or add missing ones)**

Run: `grep -nE "async search(Guides|Guidelines|Articles|Textbooks|TextbookPassages|RecipeCollections|Fctables)" app/services/catalogApi.ts`
Expected: all 7 present. For any missing, add a method mirroring `searchGuides` against the correct `/v1/<entity>/search` path (entity paths: `guides`, `guidelines`, `articles`, `textbooks`, `textbook-passages`, `rcollections`, `fctables`). Re-run grep until all 7 resolve.

- [ ] **Step 5: Typecheck**

Run: `npx vue-tsc --noEmit -p tsconfig.json 2>&1 | grep catalogApi.ts; echo "done (empty = clean)"`
Expected: no errors referencing `catalogApi.ts`.

- [ ] **Step 6: Lint**

Run: `npx eslint app/services/catalogApi.ts`
Expected: no new errors.

- [ ] **Step 7: Commit**

```bash
git add app/services/catalogApi.ts
git commit -m "feat: add fetchCatalogStats aggregator over catalog search facets"
```

---

### Task B2: observabilityApi.ts client

**Files:**
- Create: `/mnt/workspaces/wisefood/wisefood-ui/app/services/observabilityApi.ts`

- [ ] **Step 1: Write the client**

Create `app/services/observabilityApi.ts`:
```typescript
import wisefoodApi from './wisefoodApi'

export interface ObservabilityStatus {
  enabled: boolean
  langfuse_reachable: boolean
}

export interface MetricRow {
  label: string
  value: number
}

export interface ObservabilityMetrics {
  rows: MetricRow[]
  enabled: boolean
}

export interface TraceRow {
  id?: string
  name?: string
  timestamp?: string
  latency?: number
  totalCost?: number
  tags?: string[]
  [k: string]: unknown
}

export interface PromptSummary {
  name: string
  version?: number
  labels?: string[]
  tags?: string[]
  updatedAt?: string
  [k: string]: unknown
}

const unwrap = <T>(payload: unknown, key: string, fallback: T): T => {
  const result = (payload as { result?: Record<string, unknown> } | null)?.result ?? (payload as Record<string, unknown> | null)
  const value = result?.[key as keyof typeof result]
  return (value ?? fallback) as T
}

class ObservabilityApiService {
  private readonly basePath = '/v1/observability'

  async getStatus(): Promise<ObservabilityStatus> {
    try {
      const payload = await wisefoodApi.get<unknown>(`${this.basePath}/status`)
      return {
        enabled: Boolean(unwrap(payload, 'enabled', false)),
        langfuse_reachable: Boolean(unwrap(payload, 'langfuse_reachable', false)),
      }
    } catch {
      return { enabled: false, langfuse_reachable: false }
    }
  }

  async getMetrics(params: {
    from: string; to: string; view?: string; measure?: string
    aggregation?: string; dimension?: string; granularity?: string
  }): Promise<ObservabilityMetrics> {
    try {
      const query = new URLSearchParams({ from: params.from, to: params.to })
      if (params.view) query.set('view', params.view)
      if (params.measure) query.set('measure', params.measure)
      if (params.aggregation) query.set('aggregation', params.aggregation)
      if (params.dimension) query.set('dimension', params.dimension)
      if (params.granularity) query.set('granularity', params.granularity)
      const payload = await wisefoodApi.get<unknown>(`${this.basePath}/metrics?${query.toString()}`)
      return {
        rows: unwrap<MetricRow[]>(payload, 'rows', []),
        enabled: Boolean(unwrap(payload, 'enabled', false)),
      }
    } catch {
      return { rows: [], enabled: false }
    }
  }

  async getTraces(limit = 50, tag?: string): Promise<TraceRow[]> {
    try {
      const query = new URLSearchParams({ limit: String(limit) })
      if (tag) query.set('tag', tag)
      const payload = await wisefoodApi.get<unknown>(`${this.basePath}/traces?${query.toString()}`)
      return unwrap<TraceRow[]>(payload, 'traces', [])
    } catch {
      return []
    }
  }

  async getPrompts(): Promise<PromptSummary[]> {
    try {
      const payload = await wisefoodApi.get<unknown>(`${this.basePath}/prompts`)
      return unwrap<PromptSummary[]>(payload, 'prompts', [])
    } catch {
      return []
    }
  }
}

export default new ObservabilityApiService()
```

- [ ] **Step 2: Typecheck**

Run: `npx vue-tsc --noEmit -p tsconfig.json 2>&1 | grep observabilityApi.ts; echo "done"`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `npx eslint app/services/observabilityApi.ts`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/services/observabilityApi.ts
git commit -m "feat: add observabilityApi client for Langfuse-backed metrics/traces/prompts"
```

---

### Task B3: useConsoleStats composable

**Files:**
- Create: `/mnt/workspaces/wisefood/wisefood-ui/app/composables/useConsoleStats.ts`

Orchestrates both sources with independent loading flags and a 5-minute in-memory cache, so the index KPIs and the operations page share one fetch.

- [ ] **Step 1: Write the composable**

Create `app/composables/useConsoleStats.ts`:
```typescript
import { ref } from 'vue'
import catalogApi, { type CatalogStats } from '~/services/catalogApi'
import recipeApi from '~/services/recipeApi'
import observabilityApi, { type ObservabilityStatus } from '~/services/observabilityApi'

const CACHE_TTL_MS = 5 * 60 * 1000

let cachedAt = 0
let cachedCatalog: CatalogStats | null = null
let cachedRecipeCount: number | null = null
let cachedObsStatus: ObservabilityStatus | null = null

export const useConsoleStats = () => {
  const catalog = ref<CatalogStats | null>(cachedCatalog)
  const recipeCount = ref<number | null>(cachedRecipeCount)
  const obsStatus = ref<ObservabilityStatus | null>(cachedObsStatus)
  const loadingCatalog = ref(false)
  const loadingObs = ref(false)

  const isFresh = () => Date.now() - cachedAt < CACHE_TTL_MS && cachedCatalog !== null

  const load = async (force = false) => {
    if (!force && isFresh()) {
      catalog.value = cachedCatalog
      recipeCount.value = cachedRecipeCount
      obsStatus.value = cachedObsStatus
      return
    }

    loadingCatalog.value = true
    loadingObs.value = true

    const [catalogRes, recipeRes, obsRes] = await Promise.allSettled([
      catalogApi.fetchCatalogStats(),
      recipeApi.getRecipeCount(),
      observabilityApi.getStatus(),
    ])

    cachedCatalog = catalogRes.status === 'fulfilled' ? catalogRes.value : null
    cachedRecipeCount = recipeRes.status === 'fulfilled' ? recipeRes.value : null
    cachedObsStatus = obsRes.status === 'fulfilled' ? obsRes.value : { enabled: false, langfuse_reachable: false }
    cachedAt = Date.now()

    catalog.value = cachedCatalog
    recipeCount.value = cachedRecipeCount
    obsStatus.value = cachedObsStatus
    loadingCatalog.value = false
    loadingObs.value = false
  }

  return { catalog, recipeCount, obsStatus, loadingCatalog, loadingObs, load }
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx vue-tsc --noEmit -p tsconfig.json 2>&1 | grep useConsoleStats; npx eslint app/composables/useConsoleStats.ts; echo done`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add app/composables/useConsoleStats.ts
git commit -m "feat: add useConsoleStats composable orchestrating catalog + observability"
```

---

## PHASE C — wisefood-ui index KPIs (real data)

### Task C1: Replace fake KPIs on /console index

**Files:**
- Modify: `/mnt/workspaces/wisefood/wisefood-ui/app/pages/console/index.vue`

- [ ] **Step 1: Replace the hardcoded `kpis` array with computed real values**

In the `<script setup>` of `console/index.vue`, add imports and wiring at the top of the script:
```typescript
import { computed, onMounted } from 'vue'
import { useConsoleStats } from '~/composables/useConsoleStats'

const { catalog, recipeCount, obsStatus, load } = useConsoleStats()
onMounted(() => { void load() })

const fmt = (n: number | null | undefined): string => {
  if (n === null || n === undefined || n < 0) return '—'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}
```
Replace the existing `const kpis = [ ... ]` literal with a computed:
```typescript
const kpis = computed(() => [
  {
    label: 'Total Catalog Assets',
    value: fmt(catalog.value?.totalAssets),
    delta: `${catalog.value?.entities.filter(e => e.total >= 0).length ?? 0} content types`,
    deltaColor: 'success' as const,
    hint: 'Guides, guidelines, articles, textbooks, collections, FC tables',
    icon: 'i-lucide-database',
    available: true,
    cardClass: 'border-t-2 border-t-brand-400 dark:border-t-brand-500/70',
    labelClass: 'text-brand-700 dark:text-brand-300',
    iconWrapperClass: 'bg-brand-50 dark:bg-brand-500/10',
    iconClass: 'text-brand-600 dark:text-brand-300',
  },
  {
    label: 'Pending Curation Reviews',
    value: fmt(catalog.value?.pendingReviews),
    delta: 'Awaiting verification',
    deltaColor: 'warning' as const,
    hint: 'Non-verified review states across catalog',
    icon: 'i-lucide-clipboard-check',
    available: true,
    cardClass: 'border-t-2 border-t-brandg-400 dark:border-t-brandg-500/70',
    labelClass: 'text-brandg-700 dark:text-brandg-300',
    iconWrapperClass: 'bg-brandg-50 dark:bg-brandg-500/10',
    iconClass: 'text-brandg-600 dark:text-brandg-300',
  },
  {
    label: 'Recipes',
    value: fmt(recipeCount.value),
    delta: 'In the recipe graph',
    deltaColor: 'info' as const,
    hint: 'Total RecipeWrangler recipes',
    icon: 'i-lucide-chef-hat',
    available: true,
    cardClass: 'border-t-2 border-t-brandp-300 dark:border-t-brandp-400/70',
    labelClass: 'text-brandp-600 dark:text-brandp-300',
    iconWrapperClass: 'bg-brandp-50 dark:bg-brandp-500/15',
    iconClass: 'text-brandp-500 dark:text-brandp-300',
  },
  {
    label: 'LLM Observability',
    value: obsStatus.value?.enabled ? 'Live' : '—',
    delta: obsStatus.value?.enabled ? 'Langfuse connected' : 'Not configured',
    deltaColor: 'primary' as const,
    hint: 'Open Analytics for traces, tokens, cost',
    icon: 'i-lucide-sparkles',
    available: Boolean(obsStatus.value?.enabled),
    cardClass: 'border-t-2 border-t-brand-400 dark:border-t-brand-500/70',
    labelClass: 'text-brand-700 dark:text-brand-300',
    iconWrapperClass: 'bg-brand-50 dark:bg-brand-500/10',
    iconClass: 'text-brand-500 dark:text-brand-300',
  },
])
```

- [ ] **Step 2: Update the template `v-for` key for kpis (computed → still array)**

The template iterates `kpi in kpis`. Since `kpis` is now a computed returning an array, the template works unchanged. Confirm the `:key="kpi.label"` is present (it is). No template edit needed beyond verifying.

- [ ] **Step 3: Flip the two INOP quick-access cards to live**

In the `quickAccessCards` array, change the "Prompt / LLM Controls" and "Analytics Reports" entries:
- set `available: true`
- set `to: '/console/operations'`
- set `iconWrapperClass: 'bg-brand-50 dark:bg-brand-500/10'` and `iconClass: 'text-brand-600 dark:text-brand-300'` (so they no longer look disabled)

- [ ] **Step 4: Typecheck + lint**

Run: `npx vue-tsc --noEmit -p tsconfig.json 2>&1 | grep "console/index"; npx eslint app/pages/console/index.vue; echo done`
Expected: no new errors (pre-existing template-format warnings in the file are acceptable; do not introduce new errors).

- [ ] **Step 5: Commit**

```bash
git add app/pages/console/index.vue
git commit -m "feat: show real catalog + observability KPIs on console index"
```

---

## PHASE D — wisefood-ui operations dashboard

### Task D1: Presentational components

**Files:**
- Create: `app/components/console/stats/StatTile.vue`
- Create: `app/components/console/stats/ReviewPipeline.vue`

- [ ] **Step 1: StatTile.vue**

Create `app/components/console/stats/StatTile.vue`:
```vue
<template>
  <UCard :ui="{ body: 'p-4' }" class="border border-gray-200/70 dark:border-white/10">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ label }}</p>
        <p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ display }}</p>
      </div>
      <div class="rounded-xl bg-brand-50 p-3 dark:bg-brand-500/10">
        <UIcon :name="icon" class="h-5 w-5 text-brand-600 dark:text-brand-300" />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ label: string; value: number | null | undefined; icon: string }>()

const display = computed(() => {
  const n = props.value
  if (n === null || n === undefined || n < 0) return '—'
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
})
</script>
```

- [ ] **Step 2: ReviewPipeline.vue**

Create `app/components/console/stats/ReviewPipeline.vue`:
```vue
<template>
  <UCard :ui="{ body: 'p-5' }" class="border border-gray-200/70 dark:border-white/10">
    <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Editorial review pipeline</h3>
    <div class="space-y-3">
      <div v-for="stage in stages" :key="stage.key">
        <div class="mb-1 flex items-center justify-between text-sm">
          <span class="text-gray-600 dark:text-gray-300">{{ stage.label }}</span>
          <span class="font-medium text-gray-900 dark:text-white">{{ stage.count }}</span>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
          <div class="h-full rounded-full" :class="stage.barClass" :style="{ width: `${stage.pct}%` }" />
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogStats } from '~/services/catalogApi'

const props = defineProps<{ stats: CatalogStats | null }>()

const ORDER: Array<{ key: string; label: string; barClass: string }> = [
  { key: 'unreviewed', label: 'Unreviewed', barClass: 'bg-gray-400' },
  { key: 'pending_review', label: 'Pending review', barClass: 'bg-amber-400' },
  { key: 'in_review', label: 'In review', barClass: 'bg-blue-400' },
  { key: 'changes_requested', label: 'Changes requested', barClass: 'bg-orange-400' },
  { key: 'verified', label: 'Verified', barClass: 'bg-emerald-500' },
  { key: 'rejected', label: 'Rejected', barClass: 'bg-rose-400' },
]

const totals = computed<Record<string, number>>(() => {
  const acc: Record<string, number> = {}
  for (const e of props.stats?.entities ?? []) {
    for (const [k, v] of Object.entries(e.reviewStatus)) acc[k] = (acc[k] ?? 0) + v
  }
  return acc
})

const stages = computed(() => {
  const max = Math.max(1, ...ORDER.map(o => totals.value[o.key] ?? 0))
  return ORDER.map(o => {
    const count = totals.value[o.key] ?? 0
    return { ...o, count, pct: Math.round((count / max) * 100) }
  })
})
</script>
```

- [ ] **Step 3: Typecheck + lint both**

Run: `npx vue-tsc --noEmit -p tsconfig.json 2>&1 | grep "console/stats"; npx eslint app/components/console/stats/; echo done`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/components/console/stats/StatTile.vue app/components/console/stats/ReviewPipeline.vue
git commit -m "feat: add StatTile and ReviewPipeline console stat components"
```

---

### Task D2: Charting decision checkpoint

**Files:** none yet (decision task).

- [ ] **Step 1: Check whether @nuxt/ui exposes a usable chart component**

Run: `ls node_modules/@nuxt/ui/dist/runtime/components 2>/dev/null | grep -i chart; grep -rn "unovis\|nuxt-charts\|UChart" node_modules/@nuxt/ui/package.json 2>/dev/null | head`
Also: `grep -rn "unovis\|VisXYContainer\|nuxt-charts" package.json`

- [ ] **Step 2: Decide and HALT for approval if a dependency is required**

- If a chart primitive is already available (Nuxt UI chart component or unovis present transitively), use it for `MetricTrend.vue` in Task D3.
- If NOT available, **do not install anything**. Implement `MetricTrend.vue` as a dependency-free inline SVG bar/sparkline (covered in Task D3 Step 1b). Per the spec, adding a charting peer dep (e.g. `nuxt-charts`/unovis) requires explicit user approval — surface the recommendation and pause.

- [ ] **Step 3: Record the decision in the commit message of D3.**

---

### Task D3: MetricTrend, TracesTable, PromptsPanel components

**Files:**
- Create: `app/components/console/stats/MetricTrend.vue`
- Create: `app/components/console/stats/TracesTable.vue`
- Create: `app/components/console/stats/PromptsPanel.vue`

- [ ] **Step 1: MetricTrend.vue (dependency-free SVG fallback — always works)**

Create `app/components/console/stats/MetricTrend.vue`:
```vue
<template>
  <UCard :ui="{ body: 'p-5' }" class="border border-gray-200/70 dark:border-white/10">
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ title }}</h3>
      <UBadge v-if="!enabled" color="neutral" variant="outline" size="sm">Not configured</UBadge>
    </div>
    <p v-if="!enabled" class="text-sm text-gray-500 dark:text-gray-400">
      Observability is not configured. Set Langfuse keys on the API to populate this panel.
    </p>
    <p v-else-if="!rows.length" class="text-sm text-gray-500 dark:text-gray-400">No data in range.</p>
    <div v-else class="flex items-end gap-1 h-32">
      <div
        v-for="(row, i) in rows"
        :key="`${row.label}-${i}`"
        class="flex-1 rounded-t bg-brand-400 dark:bg-brand-500 transition-all"
        :style="{ height: `${barPct(row.value)}%` }"
        :title="`${row.label}: ${row.value}`"
      />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MetricRow } from '~/services/observabilityApi'

const props = defineProps<{ title: string; rows: MetricRow[]; enabled: boolean }>()

const max = computed(() => Math.max(1, ...props.rows.map(r => r.value)))
const barPct = (v: number) => Math.max(2, Math.round((v / max.value) * 100))
</script>
```
> Step 1b: If Task D2 found a real chart lib and you prefer it, replace the `<div class="flex items-end">` block with the chart component bound to `rows`. The SVG version is the guaranteed-working baseline.

- [ ] **Step 2: TracesTable.vue**

Create `app/components/console/stats/TracesTable.vue`:
```vue
<template>
  <UCard :ui="{ body: 'p-0' }" class="border border-gray-200/70 dark:border-white/10 overflow-hidden">
    <div class="border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">Recent traces</h3>
    </div>
    <div v-if="!enabled" class="px-5 py-6 text-sm text-gray-500 dark:text-gray-400">
      Observability is not configured.
    </div>
    <div v-else-if="!traces.length" class="px-5 py-6 text-sm text-gray-500 dark:text-gray-400">
      No traces found.
    </div>
    <table v-else class="w-full text-sm">
      <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-zinc-900/50 dark:text-gray-400">
        <tr>
          <th class="px-5 py-2 font-medium">Name</th>
          <th class="px-5 py-2 font-medium">When</th>
          <th class="px-5 py-2 font-medium text-right">Latency</th>
          <th class="px-5 py-2 font-medium text-right">Cost</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(t, i) in traces" :key="t.id ?? i" class="border-t border-gray-100 dark:border-zinc-800">
          <td class="px-5 py-2 text-gray-900 dark:text-white">{{ t.name ?? '—' }}</td>
          <td class="px-5 py-2 text-gray-500 dark:text-gray-400">{{ formatWhen(t.timestamp) }}</td>
          <td class="px-5 py-2 text-right tabular-nums">{{ t.latency != null ? `${Math.round(Number(t.latency))}ms` : '—' }}</td>
          <td class="px-5 py-2 text-right tabular-nums">{{ t.totalCost != null ? `$${Number(t.totalCost).toFixed(4)}` : '—' }}</td>
        </tr>
      </tbody>
    </table>
  </UCard>
</template>

<script setup lang="ts">
import type { TraceRow } from '~/services/observabilityApi'

defineProps<{ traces: TraceRow[]; enabled: boolean }>()

const formatWhen = (ts?: string): string => {
  if (!ts) return '—'
  const d = new Date(ts)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString()
}
</script>
```

- [ ] **Step 3: PromptsPanel.vue**

Create `app/components/console/stats/PromptsPanel.vue`:
```vue
<template>
  <UCard :ui="{ body: 'p-5' }" class="border border-gray-200/70 dark:border-white/10">
    <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">Prompts (read-only)</h3>
    <p v-if="!enabled" class="text-sm text-gray-500 dark:text-gray-400">Observability is not configured.</p>
    <p v-else-if="!prompts.length" class="text-sm text-gray-500 dark:text-gray-400">No prompts registered.</p>
    <ul v-else class="divide-y divide-gray-100 dark:divide-zinc-800">
      <li v-for="p in prompts" :key="p.name" class="flex items-center justify-between py-2">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ p.name }}</p>
          <div class="mt-0.5 flex flex-wrap gap-1">
            <UBadge v-for="label in p.labels ?? []" :key="label" size="xs" variant="soft" color="primary">{{ label }}</UBadge>
            <UBadge v-for="tag in p.tags ?? []" :key="tag" size="xs" variant="outline" color="neutral">{{ tag }}</UBadge>
          </div>
        </div>
        <span v-if="p.version != null" class="text-xs text-gray-500 dark:text-gray-400">v{{ p.version }}</span>
      </li>
    </ul>
  </UCard>
</template>

<script setup lang="ts">
import type { PromptSummary } from '~/services/observabilityApi'

defineProps<{ prompts: PromptSummary[]; enabled: boolean }>()
</script>
```

- [ ] **Step 4: Typecheck + lint all three**

Run: `npx vue-tsc --noEmit -p tsconfig.json 2>&1 | grep "console/stats"; npx eslint app/components/console/stats/; echo done`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add app/components/console/stats/MetricTrend.vue app/components/console/stats/TracesTable.vue app/components/console/stats/PromptsPanel.vue
git commit -m "feat: add MetricTrend, TracesTable, PromptsPanel console components"
```

---

### Task D4: The /console/operations page

**Files:**
- Create: `/mnt/workspaces/wisefood/wisefood-ui/app/pages/console/operations.vue`

The page is auto-protected by `app/middleware/console.global.ts` (any `/console/*` path → `expert,admin` only). No new middleware.

- [ ] **Step 1: Write the page**

Create `app/pages/console/operations.vue`:
```vue
<template>
  <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb :items="breadcrumbItems" class="mb-4" />
    <UPageHeader
      title="Analytics & Observability"
      description="Catalog content statistics and LLM observability across Foodchat, RecipeWrangler and FoodScholar."
      :ui="{ root: 'relative py-8 border-b-0' }"
    />

    <UPageBody>
      <UTabs :items="tabs" class="w-full">
        <template #content>
          <!-- Content tab -->
          <div v-if="activeTab === 'content'" class="space-y-6">
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ConsoleStatsStatTile
                v-for="e in catalog?.entities ?? []"
                :key="e.key"
                :label="e.label"
                :value="e.total"
                icon="i-lucide-database"
              />
            </div>
            <ConsoleStatsReviewPipeline :stats="catalog" />
          </div>

          <!-- Observability tab -->
          <div v-else class="space-y-6">
            <div class="grid gap-6 lg:grid-cols-2">
              <ConsoleStatsMetricTrend title="Requests by model" :rows="modelRows" :enabled="obsEnabled" />
              <ConsoleStatsMetricTrend title="Cost by model" :rows="costRows" :enabled="obsEnabled" />
            </div>
            <ConsoleStatsTracesTable :traces="traces" :enabled="obsEnabled" />
            <ConsoleStatsPromptsPanel :prompts="prompts" :enabled="obsEnabled" />
          </div>
        </template>
      </UTabs>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useConsoleStats } from '~/composables/useConsoleStats'
import observabilityApi, { type MetricRow, type TraceRow, type PromptSummary } from '~/services/observabilityApi'

definePageMeta({ layout: 'default' })
useHead({ title: 'Analytics & Observability' })

const breadcrumbItems = [
  { label: 'Console', icon: 'i-lucide-panel-top', to: '/console' },
  { label: 'Analytics', icon: 'i-lucide-chart-column' },
]

const tabs = [
  { label: 'Content', value: 'content', icon: 'i-lucide-folder-open' },
  { label: 'Observability', value: 'observability', icon: 'i-lucide-sparkles' },
]
const activeTab = ref<'content' | 'observability'>('content')

const { catalog, obsStatus, load } = useConsoleStats()
const obsEnabled = computed(() => Boolean(obsStatus.value?.enabled))

const modelRows = ref<MetricRow[]>([])
const costRows = ref<MetricRow[]>([])
const traces = ref<TraceRow[]>([])
const prompts = ref<PromptSummary[]>([])

const isoDaysAgo = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

onMounted(async () => {
  await load()
  if (!obsStatus.value?.enabled) return
  const from = isoDaysAgo(7)
  const to = new Date().toISOString()
  const [m, c, t, p] = await Promise.allSettled([
    observabilityApi.getMetrics({ from, to, view: 'observations', measure: 'count', aggregation: 'count', dimension: 'providedModelName' }),
    observabilityApi.getMetrics({ from, to, view: 'observations', measure: 'totalCost', aggregation: 'sum', dimension: 'providedModelName' }),
    observabilityApi.getTraces(25),
    observabilityApi.getPrompts(),
  ])
  if (m.status === 'fulfilled') modelRows.value = m.value.rows
  if (c.status === 'fulfilled') costRows.value = c.value.rows
  if (t.status === 'fulfilled') traces.value = t.value
  if (p.status === 'fulfilled') prompts.value = p.value
})
</script>
```
> NOTE on tabs: confirm `UTabs` slot/`v-model` API for the installed `@nuxt/ui` v4 — run `grep -rn "UTabs" app/ | head` to find an existing usage and mirror its prop/`v-model:model-value` pattern. If `UTabs` exposes `v-model`, bind `activeTab` to it instead of the manual `#content` switch; adjust the template to the real API before committing.

- [ ] **Step 2: Confirm Nuxt UI component auto-import prefixes resolve**

Run: `grep -rn "ConsoleStats\|components:" nuxt.config.ts app/components 2>/dev/null | head`
Nuxt auto-imports nested components as `ConsoleStats<Name>` (path `components/console/stats/<Name>.vue` → `ConsoleStatsStatTile`). Verify the dev server resolves them (next step). If the project flattens component names, adjust the tags to the resolved names.

- [ ] **Step 3: Typecheck + lint**

Run: `npx vue-tsc --noEmit -p tsconfig.json 2>&1 | grep "operations"; npx eslint app/pages/console/operations.vue; echo done`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add app/pages/console/operations.vue
git commit -m "feat: add /console/operations analytics dashboard (Content + Observability)"
```

---

### Task D5: Manual verification (run both pages)

**Files:** none (verification).

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (background). Note the local URL.

- [ ] **Step 2: Verify /console index**

Open `/console` as an expert/admin user. Confirm:
- The 4 KPI tiles show real values (or "—" gracefully), NOT "184.2K"/"28.4K".
- "Prompt / LLM Controls" and "Analytics Reports" cards are enabled and link to `/console/operations`.

- [ ] **Step 3: Verify /console/operations**

Open `/console/operations`. Confirm:
- Content tab: per-entity stat tiles with real counts; review-pipeline bars render.
- Observability tab: if Langfuse keys are unset, panels show "Not configured" empty-states (NOT errors). If set, trends/traces/prompts populate.

- [ ] **Step 4: Verify access guard**

As a non-console user (no expert/admin role), navigate to `/console/operations` → should redirect to `/profiles` (existing middleware).

- [ ] **Step 5: Final full typecheck + lint**

Run: `npx vue-tsc --noEmit -p tsconfig.json 2>&1 | tail -5; npx eslint app/ 2>&1 | grep -c error`
Expected: no new type errors; error count not increased by these files.

- [ ] **Step 6: Commit any fixes from verification, then summarize.**

---

## Self-Review notes (resolved during planning)

- **Spec coverage:** Langfuse proxy (A2–A4), catalog stats no-orgs (B1), index KPIs (C1), operations page with Content+Observability tabs (D1–D4), graceful degradation (every observability path returns empty + `enabled` flag), role guard (reused existing `console.global.ts`, verified `CONSOLE_ALLOWED_ROLES = ['expert','admin']`), v1 metrics API (A2, corrected from v2 Cloud-only). All covered.
- **No new backend dependency on the `langfuse` SDK** — we use `httpx` (already present) against the public HTTP API, simpler for read-only.
- **Type consistency:** `CatalogStats`/`CatalogEntityStat` (B1) consumed by ReviewPipeline (D1) and operations page (D4); `MetricRow`/`TraceRow`/`PromptSummary` (B2) consumed by D3 components and D4. `normalize_metric_rows` signature stable across A3 test + impl.
- **Known confirm-before-commit points (flagged inline):** exact `searchX` catalog method names (B1 Step 4), `UTabs` v4 API (D4), Nuxt component auto-import prefix (D4 Step 2), chart-lib availability + approval gate (D2). These are repo-specific API surfaces to confirm against the live code, not placeholders.
```
