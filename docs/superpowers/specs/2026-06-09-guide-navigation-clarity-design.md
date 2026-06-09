# Guide Navigation Clarity — Design

**Date:** 2026-06-09
**Status:** Approved

## Problem

FoodScholar guide pages have two competing "back" mechanisms that disagree:

1. **Browser back/forward keys** — follow true navigation history.
2. **In-page header back button** (`FoodscholarMicroHeader`) — a `NuxtLink` with a
   **hardcoded `:to` destination**, independent of history.

On the guide-detail page the header back button always targets *that guide's country
explorer* (`buildGuidesRegionPath(resolvedRegion)`). So a user who arrives via the
Catalog tab (`/foodscholar/guides`), opens a guide, then clicks the header back button
lands on a country page they never visited — a confusing "teleport". The browser back
key, by contrast, returns them to the catalog. The two mechanisms diverge.

Separately: in the Catalog tab, selecting a country only applies a search filter. Unlike
the Map tab (which has an "Open explorer" link), there is **no affordance to open the
selected country's full explorer page**.

## Decisions

- **Back button:** keep the logical up-level hierarchy (guide → its country → guides
  index), but make the **label self-describing** so the destination is never surprising.
- **Country link:** add an "Open explorer" link on the active filter pill when exactly
  one country is selected.

## Changes

### 1. Self-describing up-level back label (guide detail page)

File: `app/pages/foodscholar/guides/[countryOrRegion]/guides/[guideId].vue`

The `:back-to` logic is already correct:
`resolvedRegion ? buildGuidesRegionPath(resolvedRegion) : buildGuidesCatalogPath()`.

Change only the **label**. Add a computed `backLabel`:

- When `resolvedRegion` resolves to a known region →
  `Back to ${getRegionPresentation(resolvedRegion).label}` (e.g. "Back to Italy").
- Otherwise → `"Back to Guides"` (the catalog fallback).

Bind `:back-label="backLabel"` instead of the static string. `getRegionPresentation`
is already imported and used by the existing `regionTitle` computed.

The country/region page back button already correctly reads "Back to Guides" →
`/foodscholar/guides` (its true parent); **no change**.

### 2. "Open explorer" link for a selected country (Catalog tab)

File: `app/pages/foodscholar/guides/index.vue`

In the active-filter-pill block (currently ~lines 229–252), when
`selectedCatalogRegions.length === 1`, render a link:

- Label: `Open ${getRegionPresentation(code).label} explorer`
- Target: `buildGuidesRegionPath(code)` via `NuxtLink`
- Styled to mirror the Map tab's existing "Open explorer" link (lines 157–163):
  arrow-right icon, brand/emerald text.

When zero or multiple countries are selected, render nothing (ambiguous target).
`buildGuidesRegionPath` is already imported.

## Non-goals

- No changes to browser back/forward behavior (already correct via history).
- No changes to the `/foodscholar/catalog/guides/*` redirect aliases.
- No changes to the Map tab, textbooks, or other `MicroHeader` consumers.

## Testing

- Catalog → open guide → header back button reads "Back to {Country}" and lands on that
  country's explorer; the country matches the guide.
- Direct/cold load of a guide whose region cannot be resolved → button reads
  "Back to Guides" → `/foodscholar/guides`.
- Catalog tab, select one country → "Open {Country} explorer" link appears and navigates
  to `buildGuidesRegionPath(code)`.
- Catalog tab, select zero or 2+ countries → no explorer link shown.
