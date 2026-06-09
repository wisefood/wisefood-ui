# Library browse-by axes + map prominence — design

Date: 2026-06-09
Status: Approved (pending spec review)

## Goal

On the FoodScholar **Library tab** (`app/pages/foodscholar/index.vue`, `pageTab === 'resources'`):

1. Let users browse articles **by category** or **by journal** (not only by topic).
2. Make the dietary-guides **map** more obviously interactive and inviting to click.

On the **Guides page** (`app/pages/foodscholar/guides/index.vue`): apply the same map
interactivity affordances, since the country/region detail pages it links to are valuable.

Copy uses **"by region"** terminology, matching the existing region-based data model (not "by country").

## Non-goals

- No hero relayout of either page; promotion is by labeling + affordance, not restructuring.
- No new map library, no change to region data, no change to destination pages.
- No new article search infrastructure — reuse the existing `articlesApi.searchArticles` + facets.

## Part 1 — Browse articles by Category or Journal

### Location
The "Articles" section of the Library tab (currently around `app/pages/foodscholar/index.vue:751`),
which today renders `libraryArticleTopics` pills and filters via `selectLibraryTopic`.

### UI
Add a small segmented toggle directly above the existing pill row:

```
Articles
Browse by topic
[ ⌗ Category │ 📓 Journal ]      ← new segmented toggle
[ All ] [ Nutrition ] [ Metabolism ] …   ← pills; source depends on toggle
[ card ] [ card ] [ card ]               ← existing FoodscholarArticleCard grid
```

- Reuse the existing pill markup, loading skeletons, and the `FoodscholarArticleCard` grid.
- The toggle matches the visual weight of the existing pill row (small, rounded, two segments).

### State
- New: `libraryBrowseAxis = ref<'category' | 'journal'>('category')`.
- Keep `librarySelectedTopic` but generalize selection to a single value per axis.
  Recommended: rename the runtime concept to `librarySelectedFacetValue` (default `CATEGORY_ALL`),
  or keep `librarySelectedTopic` as the variable name to minimize churn — implementer's call,
  but the *behavior* below is what matters.

### Pill sources
- **Category pills**: top ~8 values from the `category` / `ai_category` facet
  (`facets.value.category` falling back to `facets.value.ai_category`), by count, prefixed with an "All" pill.
- **Journal pills**: top ~8 values from the existing `facets.value.venue` facet, by count, prefixed with "All".
- Both already exist: `category`/`ai_category` and `venue` are in the `fl`/`fields` lists used by
  `loadPopularArticles` (`app/pages/foodscholar/index.vue:1969-1976`).

### Selection fetch
Generalize `selectLibraryTopic` into a facet-field-aware selector:

```ts
async function selectLibraryFacet(field: 'category' | 'venue', value: string) { … }
```

- `value === CATEGORY_ALL` → show recent articles (`allArticles.value.slice(0, 6)`), no fetch (current behavior).
- Otherwise issue `articlesApi.searchArticles({ … fq: [`${field}:"${value}"`], limit: 6 … })` and map results
  via `mapArticleToHome`, reusing the existing `libraryTopicArticles` / `libraryTopicArticlesLoading`
  refs (or renamed equivalents).
- The existing `category` axis may use `category` with `ai_category` fallback in the `fq`; if `category`
  is empty for an article the facet still groups by the stored category value, so a single
  `fq: ['category:"X"']` is acceptable. (Topic-based `topics:"…"` filtering is dropped in favor of `category`.)

### Switching axes
- Toggling `libraryBrowseAxis` resets the selected value to `CATEGORY_ALL` for that axis and re-renders
  the pill row from the corresponding facet. The card grid returns to "recent articles".

### Stats row
The existing stats dl (Articles / Journals / Topics) is unchanged.

### Per-axis empty states
When a selection yields zero cards, show axis-aware copy instead of the current generic
"No articles found for this topic.":
- Category axis → **"No articles in this category yet."**
- Journal axis → **"No articles in this journal yet."**

Implement as a computed string keyed off `libraryBrowseAxis`.

### See-all-in-catalog link
When a non-`All` pill is selected, render a small link below/beside the card grid:
**"See all {N} in catalog →"**, where `{N}` is the matching facet's `count` (already available
from the facet entry that produced the pill — no extra request).

Destination depends on axis, constrained by what the catalog page can hydrate from its URL
(`hydrateStateFromRoute`, `app/pages/foodscholar/catalog.vue:782`):
- **Journal** → `/foodscholar/catalog?venue=<value>` — the catalog reads `route.query.venue` directly,
  so the filter lands exactly.
- **Category** → the catalog has **no URL-addressable `category` param** (category filtering there is
  internal facet state, not a query key). Use the closest approximation: `/foodscholar/catalog?q=<value>`,
  routing the category name into the catalog's NL search box. Note this in code with a brief comment so
  the asymmetry is intentional, not a bug. If exact category pre-selection is later wanted, the catalog
  page would need a new `?category=` query key — out of scope here.

### URL query persistence
Persist the Library browse state in the page URL so a view is shareable and survives refresh:
- Query keys: `?browse=category|journal` and a value key — reuse `category=<value>` / `venue=<value>`
  to mirror the catalog's convention (`venue` for journal; `category` for the category axis, which
  the Library tab *can* address even though the catalog cannot).
- On mount, hydrate `libraryBrowseAxis` and the selected value from `route.query` (guard against
  unknown values → fall back to `category` / `CATEGORY_ALL`). Only applies when `pageTab === 'resources'`.
- On toggle/pill change, update the query via `router.replace` (not `push`, to avoid history spam).
- `pageTab` is currently **not** URL-persisted — it's a plain `ref<'qa' | 'resources'>('qa')`
  (`app/pages/foodscholar/index.vue:1070`) selected on mount via `pageTab.value === 'resources'`
  (`onMounted`, ~line 2531). For a shared Library link to actually open the Library tab, persist
  `pageTab` too: add `?tab=resources` to the query and hydrate `pageTab` from `route.query.tab` on mount.
  Final shareable shape: `/foodscholar?tab=resources&browse=journal&venue=<value>`.
- Keep the existing `watch(pageTab, …)` / `onMounted` lazy-load triggers
  (`loadLibraryMap` / `loadLibraryTextbooks` / `loadLibraryTopicFacets`) working when the tab is
  hydrated from the URL — i.e. hydrate `pageTab` *before* the `onMounted` lazy-load check runs, or
  fire the loaders after hydration.

## Part 2 — Map prominence & interactivity

### Shared affordance in `EuropeGuidesMap.vue`
Add an optional prop and overlay so both call sites get identical behavior:

- New prop: `showHint?: boolean` (default `false`), added to the `defineProps<{…}>()` block at
  `app/components/foodscholar/guides/EuropeGuidesMap.vue:121`.
- When `showHint` is true and no region is selected, render a small persistent chip overlaid in a
  corner of the map: **"Click a region to open its guides"** with a pointer/cursor icon.
- The chip fades out once `selectedRegionCode` becomes non-null (first selection) and does not return.
- Ensure interactive region shapes use `cursor-pointer` (verify current hover/cursor styling; add if missing).
- Keep all existing behavior (tooltip, controls, view padding) intact.

### Library tab "Dietary Guides overview" section
(`app/pages/foodscholar/index.vue`, ~line 838.)

- Replace the muted heading block with:
  - Eyebrow: `Explore` (uppercase tracked label, matching existing eyebrow style).
  - Heading: **"Dietary guides by region"**.
  - Caption directly above the map: **"Click a region to open its official guides →"**.
- Pass `:show-hint="true"` to `<FoodscholarGuidesEuropeGuidesMap>` (line ~863).
- Keep the existing two-column layout (map + stats aside). Promotion is by labeling + the hint chip.

### Guides page
(`app/pages/foodscholar/guides/index.vue`.)

- Map tab is already the default. Add a caption beneath the tab bar, shown when `activeTab === 'map'`:
  **"Click a region to open its official guides."**
- Pass `:show-hint="true"` to `<EuropeGuidesMap>` (line ~97).
- Strengthen the active Map-tab affordance only if it reads as weak after the caption is added
  (the active-tab border/text styling already exists); no relayout.

## Testing / verification

- Manual: run the app, open `/foodscholar` → Library tab. Confirm Category/Journal toggle switches
  pill sources, "All" shows recent articles, selecting a category and a journal each fetches 6 cards.
- Manual: confirm the hint chip appears on both maps, that clicking a region dismisses it and navigates,
  and that the region detail pages still load.
- Lint/typecheck: `pnpm lint` and `pnpm typecheck` clean for the touched files.

## Files touched

- `app/pages/foodscholar/index.vue` — browse toggle + selector logic; per-axis empty states;
  see-all-in-catalog link; URL persistence (`tab` + `browse` + value); map section copy + `show-hint`.
- `app/pages/foodscholar/guides/index.vue` — map tab caption + `show-hint`.
- `app/components/foodscholar/guides/EuropeGuidesMap.vue` — `showHint` prop + hint chip + cursor.
- i18n locale files (`en`/`hu`/`sl`) if new visible strings are added through the i18n layer
  (the Library tab currently mixes hard-coded English and `t(...)`; match the surrounding section's
  approach — hard-coded English is acceptable here as the section already uses it).
