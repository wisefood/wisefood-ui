# Library Browse-By Axes + Map Prominence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the FoodScholar Library tab, let users browse articles by Category or Journal, persist that view in the URL, and make the dietary-guides map obviously interactive on both the Library tab and the Guides page.

**Architecture:** All article-browse changes live in `app/pages/foodscholar/index.vue` (the Library tab is `pageTab === 'resources'`). A reusable hint affordance is added to `EuropeGuidesMap.vue` behind a `showHint` prop and consumed by both `index.vue` and `guides/index.vue`. No new API plumbing — reuse `articlesApi.searchArticles` + the existing `category`/`ai_category`/`venue` facets.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup>` + TypeScript, `@nuxt/ui`, Tailwind 4, vue-i18n, vue-router.

**Verification model:** This repo has no unit-test runner (`package.json` scripts are `lint`, `typecheck`, `dev`, `build` only). Each task is verified by `pnpm typecheck`, `pnpm lint`, and a described manual browser check via `pnpm dev`. Commit after each task.

**Reference facts (verified against current code):**
- `CATEGORY_ALL = 'All'` (`index.vue:1068`).
- `facets` is `ref<Record<string, Array<{ value: string, count: number }>>>({})` (`index.vue:1566`). It is populated by `loadPopularArticles` which already requests `fields: ['category', 'ai_category', 'tags', 'ai_tags', 'topics', 'venue']` (`index.vue:1969-1976`).
- `interface AnnotatedFacet { value: string; count: number; field: string; label?: string }` (`index.vue:1023`).
- Existing pill state: `librarySelectedTopic` (`index.vue:1128`), `libraryTopicArticles` / `libraryTopicArticlesLoading` (`1129-1130`), `libraryArticleTopics` computed (`1133`), `libraryFilteredArticles` computed (`1145`), `selectLibraryTopic` (`1159`).
- `router` is `useRouter()` (`index.vue:1376`); `route` is NOT yet imported.
- `pageTab = ref<'qa' | 'resources'>('qa')` (`index.vue:1070`); lazy loaders fire in `watch(pageTab,…)` (`2516`) and `onMounted` (`2531`).
- `mapArticleToHome` exists and maps API results to `HomeArticle` (`index.vue:2367`-ish).
- Catalog page hydrates `route.query.venue` (`catalog.vue:785`) and `route.query.q` (`784`); it has NO `category` query key.
- Map component props block at `EuropeGuidesMap.vue:121`; template root already uses `cursor-grab`; `selectedRegionCode` is the v-model prop; `selectedCode` computed at line 146.

---

## File Structure

- **Modify** `app/components/foodscholar/guides/EuropeGuidesMap.vue` — add `showHint?: boolean` prop + a dismissible "Click a region" overlay chip. One new prop, one new template block, one new computed. (Task 1)
- **Modify** `app/pages/foodscholar/index.vue` — browse-axis state + computeds + selector, segmented toggle UI, per-axis empty state, see-all link, URL persistence (`tab`/`browse`/value), map section copy + `:show-hint`. (Tasks 2–6)
- **Modify** `app/pages/foodscholar/guides/index.vue` — map-tab caption + `:show-hint`. (Task 7)

---

## Task 1: Add `showHint` affordance to EuropeGuidesMap

**Files:**
- Modify: `app/components/foodscholar/guides/EuropeGuidesMap.vue` (props block ~121; template root ~14)

- [ ] **Step 1: Add the `showHint` prop**

In the `defineProps` block (currently lines 121-126), add `showHint`:

```ts
const props = defineProps<{
  regions: GuidesCatalogRegionSummary[]
  selectedRegionCode?: string | null
  hideControls?: boolean
  viewPadding?: number
  showHint?: boolean
}>()
```

- [ ] **Step 2: Add a computed controlling chip visibility**

Add right after the `selectedCode` computed (line 146):

```ts
const showHintChip = computed(() => Boolean(props.showHint) && !selectedCode.value)
```

- [ ] **Step 3: Add the chip to the template**

Inside the `v-else` interactive frame `<div ref="frameRef" …>` (opens line 16), add this as the LAST child of that div, immediately before its closing `</div>` (i.e. after the controls block that starts at line 40). It must sit inside the framed map area:

```html
<transition
  enter-active-class="transition-opacity duration-300"
  enter-from-class="opacity-0"
  leave-active-class="transition-opacity duration-300"
  leave-to-class="opacity-0"
>
  <div
    v-if="showHintChip && isReady"
    class="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-medium text-[#173f35] shadow-[0_14px_32px_rgba(70,46,30,0.14)] backdrop-blur-xl dark:bg-white/12 dark:text-stone-100"
  >
    <UIcon name="i-lucide-mouse-pointer-click" class="h-3.5 w-3.5" />
    Click a region to open its guides
  </div>
</transition>
```

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: PASS (no errors referencing `EuropeGuidesMap.vue` / `showHint`).

- [ ] **Step 5: Lint**

Run: `pnpm lint`
Expected: PASS (no new errors in `EuropeGuidesMap.vue`).

- [ ] **Step 6: Commit**

```bash
git add app/components/foodscholar/guides/EuropeGuidesMap.vue
git commit -m "Add dismissible click-a-region hint chip to EuropeGuidesMap

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Add browse-axis state, facet computeds, and selector to the Library tab

**Files:**
- Modify: `app/pages/foodscholar/index.vue` (script, near existing library state ~1128-1184)

- [ ] **Step 1: Add browse-axis state**

Immediately after `const librarySelectedTopic = ref(CATEGORY_ALL)` (line 1128), add:

```ts
const libraryBrowseAxis = ref<'category' | 'journal'>('category')
```

- [ ] **Step 2: Add category and journal pill computeds**

Add after the `libraryArticleTopics` computed (line 1133). These mirror the `categoryFacets` merge pattern from `catalog.vue` and the `tagFacets` pattern already in this file (`index.vue:1729`):

```ts
const libraryCategoryPills = computed<string[]>(() => {
  const merged = new Map<string, number>()
  ;(facets.value.category || []).forEach((f) => {
    if (f?.value) merged.set(f.value, (merged.get(f.value) || 0) + Number(f.count || 0))
  })
  ;(facets.value.ai_category || []).forEach((f) => {
    if (f?.value) merged.set(f.value, (merged.get(f.value) || 0) + Number(f.count || 0))
  })
  const top = Array.from(merged.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([value]) => value)
  return [CATEGORY_ALL, ...top]
})

const libraryJournalPills = computed<string[]>(() => {
  const top = (facets.value.venue || [])
    .filter(f => f?.value && String(f.value).trim())
    .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))
    .slice(0, 8)
    .map(f => f.value)
  return [CATEGORY_ALL, ...top]
})

const libraryActivePills = computed<string[]>(() =>
  libraryBrowseAxis.value === 'journal' ? libraryJournalPills.value : libraryCategoryPills.value
)
```

- [ ] **Step 3: Add a count lookup for the see-all link**

Add after the computeds from Step 2. Returns the facet count for the currently selected value (used by Task 5):

```ts
const librarySelectedCount = computed<number>(() => {
  const value = librarySelectedTopic.value
  if (value === CATEGORY_ALL) return 0
  if (libraryBrowseAxis.value === 'journal') {
    return Number((facets.value.venue || []).find(f => f.value === value)?.count || 0)
  }
  const cat = Number((facets.value.category || []).find(f => f.value === value)?.count || 0)
  const ai = Number((facets.value.ai_category || []).find(f => f.value === value)?.count || 0)
  return cat + ai
})
```

- [ ] **Step 4: Replace `selectLibraryTopic` with an axis-aware selector**

Replace the entire existing `selectLibraryTopic` function (lines 1159-1184) with:

```ts
async function selectLibraryFacet(value: string) {
  librarySelectedTopic.value = value
  if (value === CATEGORY_ALL) {
    libraryTopicArticles.value = []
    syncLibraryQuery()
    return
  }

  const field = libraryBrowseAxis.value === 'journal' ? 'venue' : 'category'
  libraryTopicArticlesLoading.value = true
  try {
    const response = await articlesApi.searchArticles({
      q: null,
      limit: 6,
      offset: 0,
      sort: 'created_at desc',
      fl: ['id', 'urn', 'title', 'abstract', 'description', 'content', 'authors', 'tags', 'ai_tags', 'topics', 'venue', 'publication_year', 'category', 'ai_category'],
      fq: [`${field}:"${value}"`],
      fields: []
    })
    const results = response.result.results || []
    libraryTopicArticles.value = results.map(mapArticleToHome)
  } catch {
    libraryTopicArticles.value = []
  } finally {
    libraryTopicArticlesLoading.value = false
  }
  syncLibraryQuery()
}

function setLibraryBrowseAxis(axis: 'category' | 'journal') {
  if (libraryBrowseAxis.value === axis) return
  libraryBrowseAxis.value = axis
  librarySelectedTopic.value = CATEGORY_ALL
  libraryTopicArticles.value = []
  syncLibraryQuery()
}
```

> `syncLibraryQuery` is defined in Task 6. It is safe to reference here because both land before any execution; if implementing strictly task-by-task and running `dev` between Task 2 and Task 6, temporarily stub `function syncLibraryQuery() {}` near the state and remove the stub in Task 6. The typecheck in Step 6 below will flag the missing reference if the stub is omitted — add it then.

- [ ] **Step 5: Update the empty-state computed**

Add near the other library computeds (after Step 3 block):

```ts
const libraryEmptyMessage = computed(() =>
  libraryBrowseAxis.value === 'journal'
    ? 'No articles in this journal yet.'
    : 'No articles in this category yet.'
)
```

- [ ] **Step 6: Repoint the topic-reset watch at `libraryActivePills`**

There is an existing `watch(libraryArticleTopics, …)` (line 2459) that resets the selection to `CATEGORY_ALL` whenever the available pills change. After this task the active pill source is `libraryActivePills`, so repoint the watch. Replace lines 2459-2464:

```ts
watch(libraryArticleTopics, (newTopics) => {
  if (newTopics.length > 0 && !newTopics.includes(librarySelectedTopic.value)) {
    librarySelectedTopic.value = CATEGORY_ALL
    libraryTopicArticles.value = []
  }
})
```

with:

```ts
watch(libraryActivePills, (pills) => {
  if (pills.length > 0 && !pills.includes(librarySelectedTopic.value)) {
    librarySelectedTopic.value = CATEGORY_ALL
    libraryTopicArticles.value = []
  }
})
```

> Note for Task 6: this watch fires when facets first load. A URL-hydrated selection (e.g. `?venue=Foo`) is set before facets arrive, so when `libraryActivePills` populates and does NOT yet contain `Foo` (only top-8 by count), this watch would wrongly reset it. Task 6 Step 4 re-fetches the hydrated selection in `onMounted` after `loadPopularArticles()`; that runs after this watch settles, so the cards still load. The pill itself may not be highlighted if the value isn't in the top-8 — acceptable. If exact highlight is required later, merge the hydrated value into the pill list. This is an accepted limitation, not a bug.

- [ ] **Step 7: Typecheck**

Run: `pnpm typecheck`
Expected: PASS. If it errors on `syncLibraryQuery`, add the temporary stub described in Step 4 and re-run; expected PASS.

- [ ] **Step 8: Commit**

```bash
git add app/pages/foodscholar/index.vue
git commit -m "Add category/journal browse-axis state and selector to library tab

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Wire the template to the new selector and pill source

**Files:**
- Modify: `app/pages/foodscholar/index.vue` (template, topic-pill row ~797-810 and card grid ~815-832)

- [ ] **Step 1: Repoint the pill row at `libraryActivePills` + `selectLibraryFacet`**

Replace the topic-tabs block (lines 797-810):

```html
<!-- Topic tabs -->
<div class="flex gap-1.5 flex-wrap mb-6">
  <button
    v-for="topic in libraryArticleTopics"
    :key="topic"
    type="button"
    :class="[
      'px-3 py-1.5 text-xs font-medium rounded-full border transition-colors',
      librarySelectedTopic === topic
        ? 'bg-brand-500 border-brand-500 text-white'
        : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-600 dark:hover:text-brand-400'
    ]"
    @click="selectLibraryTopic(topic)"
  >{{ topic }}</button>
</div>
```

with:

```html
<!-- Browse-axis pills -->
<div class="flex gap-1.5 flex-wrap mb-6">
  <button
    v-for="pill in libraryActivePills"
    :key="pill"
    type="button"
    :class="[
      'px-3 py-1.5 text-xs font-medium rounded-full border transition-colors',
      librarySelectedTopic === pill
        ? 'bg-brand-500 border-brand-500 text-white'
        : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-600 dark:hover:text-brand-400'
    ]"
    @click="selectLibraryFacet(pill)"
  >{{ pill }}</button>
</div>
```

- [ ] **Step 2: Update the empty-state copy**

Replace the empty paragraph (lines 829-831):

```html
<p v-if="!libraryFilteredArticles.length" class="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">
  No articles found for this topic.
</p>
```

with:

```html
<p v-if="!libraryFilteredArticles.length" class="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">
  {{ libraryEmptyMessage }}
</p>
```

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS (no references to the now-removed `selectLibraryTopic` / `libraryArticleTopics` remain in the template).

- [ ] **Step 4: Manual check**

Run: `pnpm dev`, open `/foodscholar`, click the **Library** tab. Confirm the pill row still renders (category pills) and clicking a pill loads 6 cards; clicking **All** restores recent articles.

- [ ] **Step 5: Commit**

```bash
git add app/pages/foodscholar/index.vue
git commit -m "Point library article pills at active browse axis

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Add the Category / Journal segmented toggle

**Files:**
- Modify: `app/pages/foodscholar/index.vue` (template, between the "Browse by topic" heading ~756 and the pill row)

- [ ] **Step 1: Update the section sub-heading and insert the toggle**

The heading at line 756 currently reads `Browse by topic`. Change it to `Browse articles`:

```html
<h2 class="font-claude text-2xl text-gray-900 dark:text-white">Browse articles</h2>
```

Then, immediately before the `<!-- Browse-axis pills -->` div (from Task 3 Step 1), insert the toggle. It lives inside the `<template v-else>` that wraps the pill row (after `allArticles.length` check at line 795):

```html
<!-- Browse axis toggle -->
<div class="inline-flex items-center gap-0.5 rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/60 p-0.5 mb-4">
  <button
    type="button"
    :class="[
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors',
      libraryBrowseAxis === 'category'
        ? 'bg-white dark:bg-zinc-900 text-brand-600 dark:text-brand-400 shadow-sm'
        : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
    ]"
    @click="setLibraryBrowseAxis('category')"
  >
    <UIcon name="i-lucide-shapes" class="w-3.5 h-3.5" />
    Category
  </button>
  <button
    type="button"
    :class="[
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors',
      libraryBrowseAxis === 'journal'
        ? 'bg-white dark:bg-zinc-900 text-brand-600 dark:text-brand-400 shadow-sm'
        : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
    ]"
    @click="setLibraryBrowseAxis('journal')"
  >
    <UIcon name="i-lucide-book-marked" class="w-3.5 h-3.5" />
    Journal
  </button>
</div>
```

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 3: Manual check**

Run: `pnpm dev`, Library tab. Toggle Category ↔ Journal: pill row swaps sources, selection resets to All, and selecting a journal pill loads journal-filtered cards.

- [ ] **Step 4: Commit**

```bash
git add app/pages/foodscholar/index.vue
git commit -m "Add category/journal segmented toggle to library tab

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Add the "See all in catalog" link

**Files:**
- Modify: `app/pages/foodscholar/index.vue` (template, after the card grid ~827; script for the destination helper)

- [ ] **Step 1: Add a destination computed**

Add near the other library computeds (e.g. after `librarySelectedCount`). Journal carries `?venue=`; category falls back to `?q=` since the catalog has no category query key:

```ts
const librarySeeAllTo = computed(() => {
  const value = librarySelectedTopic.value
  if (value === CATEGORY_ALL) return null
  // Catalog hydrates ?venue directly; it has no ?category key, so category
  // routes into the catalog's NL search box via ?q as the closest match.
  const query = libraryBrowseAxis.value === 'journal' ? { venue: value } : { q: value }
  return { path: '/foodscholar/catalog', query }
})
```

- [ ] **Step 2: Add the link to the template**

Insert immediately after the article-cards grid `</div>` (closes at line 827), inside the `<template v-else>`, before the empty-state paragraph:

```html
<div v-if="librarySeeAllTo && libraryFilteredArticles.length" class="mt-5 flex justify-center">
  <NuxtLink
    :to="librarySeeAllTo"
    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-xs font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group"
  >
    <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5" />
    <span v-if="librarySelectedCount">See all {{ librarySelectedCount.toLocaleString() }} in catalog</span>
    <span v-else>See all in catalog</span>
  </NuxtLink>
</div>
```

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 4: Manual check**

Run: `pnpm dev`, Library tab. Select a journal pill → "See all N in catalog" link appears; clicking it lands on `/foodscholar/catalog` with that journal filter applied (filter visible in the venue facet). Select a category pill → link routes to catalog with the category name in the search box.

- [ ] **Step 5: Commit**

```bash
git add app/pages/foodscholar/index.vue
git commit -m "Add see-all-in-catalog link to library browse section

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Persist browse state (tab + axis + value) in the URL

**Files:**
- Modify: `app/pages/foodscholar/index.vue` (script: imports ~966, state, `onMounted` ~2524)

- [ ] **Step 1: Import `useRoute`**

The file imports `useRouter` at line 966. Update that import to include `useRoute`:

```ts
import { useRouter, useRoute } from 'vue-router'
```

Then add, near `const router = useRouter()` (line 1376):

```ts
const route = useRoute()
```

- [ ] **Step 2: Add `syncLibraryQuery` (replace the temporary stub if you added one)**

Add near the library state. Writes `tab`/`browse`/value into the URL without polluting history:

```ts
function syncLibraryQuery() {
  if (pageTab.value !== 'resources') return
  const query: Record<string, string> = { ...(route.query as Record<string, string>) }
  query.tab = 'resources'
  query.browse = libraryBrowseAxis.value
  // Clear both value keys, then set the active one (if a real selection).
  delete query.venue
  delete query.category
  if (librarySelectedTopic.value !== CATEGORY_ALL) {
    if (libraryBrowseAxis.value === 'journal') query.venue = librarySelectedTopic.value
    else query.category = librarySelectedTopic.value
  }
  router.replace({ query })
}
```

- [ ] **Step 3: Add a hydrate helper and call it in `onMounted`**

Add the helper near `syncLibraryQuery`:

```ts
function hydrateLibraryFromQuery() {
  const tab = route.query.tab
  if (tab === 'resources') pageTab.value = 'resources'
  const browse = route.query.browse
  if (browse === 'journal' || browse === 'category') libraryBrowseAxis.value = browse
  const value = libraryBrowseAxis.value === 'journal' ? route.query.venue : route.query.category
  if (typeof value === 'string' && value) librarySelectedTopic.value = value
}
```

In `onMounted` (line 2524), call `hydrateLibraryFromQuery()` as the FIRST line so the existing `pageTab.value === 'resources'` lazy-load check at line 2531 sees the hydrated tab:

```ts
onMounted(async () => {
  hydrateLibraryFromQuery()

  await Promise.all([
    loadPopularArticles(),
    loadQaModels(),
    loadQaQuestions()
  ])

  if (pageTab.value === 'resources') {
    loadLibraryMap()
    loadLibraryTextbooks()
    loadLibraryTopicFacets()
  }
  // …rest unchanged…
```

- [ ] **Step 4: Fetch the hydrated selection after facets load**

A hydrated non-`All` value needs its 6 cards fetched. After `loadPopularArticles()` resolves (facets are then populated), add — inside `onMounted`, right after the `Promise.all([...])` await:

```ts
  if (pageTab.value === 'resources' && librarySelectedTopic.value !== CATEGORY_ALL) {
    selectLibraryFacet(librarySelectedTopic.value)
  }
```

- [ ] **Step 5: Persist when the tab itself changes to resources**

In the existing `watch(pageTab, …)` (line 2516), add a `syncLibraryQuery()` call so navigating to the Library tab reflects in the URL:

```ts
watch(pageTab, (tab) => {
  if (tab === 'resources') {
    loadLibraryMap()
    loadLibraryTextbooks()
    loadLibraryTopicFacets()
    syncLibraryQuery()
  }
})
```

- [ ] **Step 6: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS, with no remaining reference to a `syncLibraryQuery` stub.

- [ ] **Step 7: Manual check**

Run: `pnpm dev`. On the Library tab, toggle to Journal and pick a journal — the URL gains `?tab=resources&browse=journal&venue=…`. Copy the URL, open in a new tab: it lands on the Library tab, Journal axis, that journal selected, with its cards loaded. Repeat for a category (`?…&browse=category&category=…`).

- [ ] **Step 8: Commit**

```bash
git add app/pages/foodscholar/index.vue
git commit -m "Persist library browse tab/axis/value in URL query

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Map prominence copy + `show-hint` on both pages

**Files:**
- Modify: `app/pages/foodscholar/index.vue` (Dietary Guides overview section ~838-869)
- Modify: `app/pages/foodscholar/guides/index.vue` (tab bar ~48; map usage ~97)

- [ ] **Step 1: Update the Library tab's Dietary Guides heading + caption**

Replace the heading block (lines 841-844):

```html
<div>
  <p class="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500">Dietary Guides</p>
  <h2 class="font-claude text-2xl text-gray-900 dark:text-white">Official dietary rules.</h2>
</div>
```

with:

```html
<div>
  <p class="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500">Explore</p>
  <h2 class="font-claude text-2xl text-gray-900 dark:text-white">Dietary guides by region</h2>
  <p class="mt-1 text-sm text-gray-400 dark:text-zinc-500">Click a region to open its official guides →</p>
</div>
```

- [ ] **Step 2: Pass `:show-hint` on the Library map**

The map usage is at lines 863-868. Add `:show-hint="true"`:

```html
<FoodscholarGuidesEuropeGuidesMap
  v-model:selected-region-code="librarySelectedRegion"
  :regions="libraryEuRegions"
  :hide-controls="true"
  :view-padding="0.015"
  :show-hint="true"
/>
```

- [ ] **Step 3: Add the caption beneath the Guides page tab bar**

In `app/pages/foodscholar/guides/index.vue`, the tab-switcher closes at line 48. Immediately after that closing `</div>` (the `border-b` bar) and before `<UPage …>` (line 50), add:

```html
<p
  v-show="activeTab === 'map'"
  class="mx-auto max-w-[92rem] px-4 pt-4 sm:px-6 lg:px-8 text-sm text-zinc-500 dark:text-zinc-400"
>
  Click a region to open its official guides.
</p>
```

- [ ] **Step 4: Pass `:show-hint` on the Guides page map**

The map usage is at lines 97-102. Add `:show-hint="true"`:

```html
<EuropeGuidesMap
  v-model:selected-region-code="selectedMapRegionCode"
  :regions="euRegionSummaries"
  :hide-controls="true"
  :view-padding="0.04"
  :show-hint="true"
/>
```

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 6: Manual check**

Run: `pnpm dev`. (a) Library tab: the Dietary Guides section reads "Dietary guides by region" with the click caption, and the map shows the hint chip until a region is clicked. (b) `/foodscholar/guides`: the Map tab shows the caption under the tabs and the hint chip on the map; clicking a region dismisses the chip and the region detail still loads.

- [ ] **Step 7: Commit**

```bash
git add app/pages/foodscholar/index.vue app/pages/foodscholar/guides/index.vue
git commit -m "Promote and label the dietary-guides map on library and guides pages

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final verification

- [ ] Run `pnpm typecheck` — PASS.
- [ ] Run `pnpm lint` — PASS.
- [ ] Run `pnpm build` — PASS (catches SSR/template issues `dev` may hide).
- [ ] Full manual pass of the Task 3/4/5/6/7 manual checks in one `pnpm dev` session.
