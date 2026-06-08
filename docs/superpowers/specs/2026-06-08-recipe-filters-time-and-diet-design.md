# Recipe Wrangler Filters: Time Range + Dietary Tags

**Date:** 2026-06-08
**Component:** `app/components/recipes/RecipeFilters.vue`

## Goal

Add two new filter sections to the Recipe Wrangler search filters:

1. **Time Range** — visual placeholder chips (Quick / Medium / Slow / Any), not wired to the API.
2. **Dietary Tags** — fully functional multi-select chips wired to the existing `diet_tags[]` param.

## Background

The backend `RecipeParamSearchParams` (`app/services/recipeApi.ts:107`) already declares:

- `diet_tags?: string[]` — currently unused in the UI.
- `max_duration_minutes?: number` — currently unused; reserved for a future wiring of Time Range.

The recipe detail page (`app/pages/recipe-wrangler/[id].vue:950`) reveals the backend's diet-tag
casing convention: **snake_case**, e.g. `dairy_free`, `nut_free`, `gluten_free`, `vegetarian`,
`vegan`, `pescatarian`. The new dietary-tag chips MUST send these exact snake_case values.

Existing filter sections (Allergens, Dish Type, Source) all follow the same UI idiom: a rounded
white card with a header (icon + i18n title) and `flex flex-wrap gap-2` pills, where selected pills
get a colored background + 2px ring. The new sections follow this idiom exactly.

## Design

### Placement

In `RecipeFilters.vue`, both new sections are inserted **between the Source section and the Quick
Filters section**, producing this order:

Allergens → Dish Type → Source → **Time Range** → **Dietary Tags** → Quick Filters → Sort

### 1. Time Range (visual placeholder only)

- Card header: `i-lucide-timer` icon + `t('recipeWrangler.filters.timeRange')`.
- Four single-select pills, each with a small subtitle:
  - **Quick** — ≤30 min
  - **Medium** — 30–60 min
  - **Slow** — 60+ min
  - **Any** — (no constraint)
- State: a local `ref<string | null>` (`selectedTimeRange`) in the component only. Clicking toggles
  the active visual state. It does **NOT**:
  - touch the Pinia store,
  - emit `filterChange`,
  - alter the API params.
- A muted "Coming soon" hint (`t('recipeWrangler.filters.timeRangeComingSoon')`) is shown in the
  card header area so the section does not read as broken.
- Selected styling reuses the blue ring treatment used by Source (`bg-blue-100 … ring-blue-400`).

This is deliberate scaffolding. When wired later, the buckets map to `max_duration_minutes`
(Quick=30, Medium=60, Slow=undefined-with-min, Any=cleared) — but that wiring is out of scope here.

### 2. Dietary Tags (fully wired)

UI:
- Card header: `i-lucide-leaf` icon + `t('recipeWrangler.filters.dietTags')`.
- Six **multi-select** pills. Label via i18n, value sent to API in snake_case:

  | i18n label key | API value (`diet_tags[]`) |
  |---|---|
  | `dietTagsOptions.nutFree` | `nut_free` |
  | `dietTagsOptions.vegetarian` | `vegetarian` |
  | `dietTagsOptions.pescatarian` | `pescatarian` |
  | `dietTagsOptions.dairyFree` | `dairy_free` |
  | `dietTagsOptions.vegan` | `vegan` |
  | `dietTagsOptions.glutenFree` | `gluten_free` |

- Selected styling reuses the green/brand ring treatment (`bg-brandg-100 … ring-brandg-400`), like
  Dish Type.
- `toggleDietTag(value)` calls the store action then emits `filterChange` — identical to
  `toggleSource`.

Store (`app/stores/recipe.ts`), mirroring `selectedSources` exactly:
- State: `selectedDietTags: [] as string[]`.
- Action `toggleDietTag(tag: string)` — push/splice + `persistDietTags()`.
- Action `clearDietTagFilters()` — reset + persist.
- `persistDietTags()` / `loadDietTags()` using localStorage key `recipe-diet-tags`.
- Wired into `initialize()` (call `loadDietTags()`), `reset()` (clear array + `removeItem`).

Component computed updates:
- `hasActiveFilters` adds `|| recipeStore.selectedDietTags.length > 0`.
- `clearAllFilters` adds `recipeStore.clearDietTagFilters()`.
- `isDietTagSelected(tag)` helper.

Index page (`app/pages/recipe-wrangler/index.vue`):
- In `handleFilterChange` (the `else` param-search branch), add
  `diet_tags: dietTags.length > 0 ? dietTags : undefined` where
  `const dietTags = recipeStore.selectedDietTags`.
- In `onMounted` initial param build, add the same `diet_tags` line.

  (NL search via `searchRecipes`/`performSearch` does not take `diet_tags`, so dietary tags only
  affect param-search mode — consistent with how Source and Dish Type already behave.)

### i18n

New keys added under `recipeWrangler.filters` in **all four** locale files (en, el, hu, sl), with
real translations (not English fallback):

```
"timeRange": <"Time Range">
"timeRangeComingSoon": <"Coming soon">
"timeRangeOptions": {
  "quick":  <"Quick"> + hint "≤ 30 min",
  "medium": <"Medium"> + hint "30–60 min",
  "slow":   <"Slow"> + hint "60+ min",
  "any":    <"Any">
}
"dietTags": <"Dietary Tags">
"dietTagsOptions": {
  "nutFree":     <"Nut-Free">,
  "vegetarian":  <"Vegetarian">,
  "pescatarian": <"Pescatarian">,
  "dairyFree":   <"Dairy-Free">,
  "vegan":       <"Vegan">,
  "glutenFree":  <"Gluten-Free">
}
```

The numeric minute hints (`≤ 30 min`, etc.) are language-neutral and reused across locales; the
"min" abbreviation stays as-is.

Keys are inserted inside the existing `filters` object (after `sortOptions` / before the object
closes) so as not to disturb the surrounding modified-in-tree keys.

## Out of scope

- Wiring Time Range to `max_duration_minutes` (placeholder only, by request).
- Applying dietary tags to natural-language search.
- Backend changes (both params already exist).

## Testing

This is a Nuxt/Vue UI change with no unit-test harness for these components in the repo. Verification
is manual:
1. Open Recipe Wrangler, show filters → confirm Time Range + Dietary Tags sections render between
   Source and Quick Filters.
2. Time Range chips toggle visually, single-select, and trigger no network request.
3. Dietary Tag chips toggle (multi-select), persist across reload, and a param search fires with
   `diet_tags` containing the snake_case values.
4. "Clear all" clears dietary tags; Time Range placeholder selection is independent.
5. `npx nuxi typecheck` (or project's typecheck) passes.
