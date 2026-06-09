# FoodScholar QA — three fixes

**Date:** 2026-06-09
**Status:** Approved
**File:** `app/pages/foodscholar/index.vue` (QA tab) + new `app/stores/foodscholarQa.ts`

## Issue 1 — Source links should open in a new tab

Today the right-column "Sources cited" cards (`index.vue` ~L533) use
`@click.prevent` + `router.push` (same-tab SPA nav), and inline answer-text
citation links go through `handleMarkdownClick` → `router.push` (same tab).
Both yank the user out of the QA thread.

**Fix (all source/citation links open in a new tab):**
- Right-column "Sources cited" and "Sources consulted" `NuxtLink`s: add
  `target="_blank"` + `rel="noopener noreferrer"`, and remove the
  `@click.prevent="…router.push…"` handler so the link navigates normally in a
  new tab. Guideline citations (which used `navigateToGuideline`) resolve to a
  normal path via `getCitationSourcePath`, so a plain `:to` + `target=_blank`
  works for them too.
- `handleMarkdownClick`: instead of `router.push({ path, query, hash })`, build
  the full path (incl. query + hash) and `window.open(fullPath, '_blank',
  'noopener')`. Same for the guideline branch (resolve its path, then
  `window.open`). Keep `event.preventDefault()`.

## Issue 2 — References column overflows the footer

`.qa-source-sidebar` is `position:absolute; top:0.25rem` with no height bound,
so a long citation list runs past the page footer.

**Fix:** make it a sticky, height-capped, internally-scrolling column:
- `position: sticky; top: 1rem;` (replaces absolute) — *or* keep absolute but add
  `max-height: calc(100vh - 2rem); overflow-y: auto;`. Use sticky so it scrolls
  with content but never exceeds the viewport.
- Add a minimal custom scrollbar (thin, subtle, theme-aware) scoped to the
  sidebar via `::-webkit-scrollbar` + `scrollbar-width: thin`.

## Issue 3 — QA thread lost on navigate-away-and-back

All QA state is component-local `ref`s, wiped on unmount. Persist the thread in
a Pinia store **with a TTL** so returning to `/foodscholar` restores it, but a
stale thread (older than the TTL) is discarded.

**New store `app/stores/foodscholarQa.ts`** (Options API, matching existing stores):
- State: `{ question: string; result: QaAskResult | null; expertiseLevel: string;
  savedAt: number | null }`.
- `TTL_MS = 30 * 60 * 1000` (30 min).
- `save({ question, result, expertiseLevel })` — stamps `savedAt = Date.now()`.
- `restore()` getter/action — returns the saved thread only if
  `savedAt && Date.now() - savedAt < TTL_MS`; otherwise clears and returns null.
- `clear()` — resets all fields.

**Wiring in `index.vue`:**
- After a successful ask (`handleQaResponse` non-clarification branch, where
  `qaResult.value = normalizeQaResult(result)`), call
  `qaStore.save({ question: pendingQuestion.value, result: qaResult.value,
  expertiseLevel: expertiseLevel.value })`.
- On `onMounted`, if there's no live result, call `qaStore.restore()`; if it
  returns a thread, hydrate `qaResult`, `pendingQuestion`, `expertiseLevel` from
  it (and switch `pageTab` to `'qa'` is unnecessary — QA is already the default
  tab). Only restore when not already showing a result.

## Non-goals
- No multi-turn history (single most-recent thread only).
- No server-side persistence; in-memory store (lost on full reload — acceptable,
  TTL-bounded). If reload-survival is wanted later, swap the store's backing to
  `sessionStorage`.
- No change to the clarification flow beyond what already exists.

## Testing
- Click a cited source / consulted source / inline citation → opens in a new tab;
  original tab still shows the full QA thread.
- Long citation list → sidebar scrolls internally with a thin scrollbar, never
  overruns the footer.
- Ask a question → navigate to another page → browser back (or in-app return) to
  `/foodscholar` within 30 min → question + answer + citations restored.
- Same, after 30 min → thread not restored (clean QA tab).
