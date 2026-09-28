# WiseFood UI — Mobile audit and implementation plan

Audit of the whole platform at phone width (375px, iOS Safari and Android Chrome),
plus a phased plan to make it a first-class mobile experience.

**Status (2026-09-28).** Phases 0 to 5 are implemented in the working tree
(uncommitted). Phase 6 (console) was dropped by decision: the console stays
desktop-only. See "What shipped" at the end for how the implementation departed
from the plan.

Stack facts that shape every decision below: Nuxt 4.2, Nuxt UI 4.2.1 (Reka UI 2.6),
Tailwind 4.1.17, VueUse 13.9 (installed, unused). Nuxt UI's header collapses at `lg`
(1024px), so **`lg` is the platform's "single pane" threshold** and `sm` (640px) is
the phone threshold. Tailwind 4.1 ships `pointer-coarse:` / `pointer-fine:` variants,
so touch-only rules need no custom variant.

---

## 0. Where we are

There has never been a mobile pass. `git log` has no commit mentioning mobile,
responsive or phone. Concretely:

| Signal | State |
|---|---|
| Breakpoint composable (`useBreakpoints`, `useMediaQuery`) | none in `app/` |
| `UDrawer` / `USlideover` outside the console | none |
| Width `@media` rules in `app/assets/css/main.css` | none (only `prefers-reduced-motion`) |
| Safe-area insets, `viewport-fit=cover` | none (`app/app.vue:29`) |
| Responsive prefixes in `app/pages` | `sm:` 588, `lg:` 298, `md:` 23 |
| Inputs at or above 16px on phones | none (see §1.2) |
| Full-height pages using `dvh` | 2 (`hierarchy.vue`, guide detail) |

The prefix counts say it plainly: layouts jump from `sm` straight to `lg`. There is
no tablet tier, and most "mobile" handling is `hidden sm:inline` on a label.

### Shipped bug, every phone and tablet, today

`UHeader` renders a hamburger button below `lg` by default (`toggle` prop defaults
to `true`, theme class `lg:hidden`). `app/components/WHeader.vue` neither disables it
nor fills the `#body` slot, so **the hamburger opens an empty full-screen modal.**
This is the first thing to fix and the anchor for the whole mobile navigation model.

---

## 1. Platform-wide findings

### 1.1 Navigation

- The three apps are reachable **only** from the dashboard cards
  (`app/pages/dashboard.vue:51-120`). The header has no app switcher on any width.
- `WHeader.vue` `#right` packs colour mode, `LocaleSelector` (flag plus full language
  name), the Console button and the avatar menu. On a 375px screen that leaves no
  room and the hamburger still appears (see above).
- `LocaleSelector.vue:60` is a hand-rolled `absolute` dropdown with `color="gray"`
  (not a Nuxt UI 4 colour).
- Sub-headers (`AppPageHeader.vue`, `foodscholar/MicroHeader.vue`,
  `guides/CatalogHeader.vue`) render no tabs; the back arrow is a bare 20px icon
  (`AppPageHeader.vue:9`, `MicroHeader.vue:10`). `MicroHeader.vue:16-23` keeps
  `sectionTitle` at `shrink-0`, squeezing the title to ~60% width.
- Hand-rolled tab bars (`foodscholar/index.vue:12-47`, `guides/index.vue:13-45`,
  `recipe-wrangler/index.vue:7-42`) fit today but have no wrap or scroll fallback;
  `foodscholar/[id].vue:427` pill tabs overflow in longer locales.

### 1.2 Inputs zoom on iOS

Nuxt UI 4 `UInput`/`UTextarea`/`USelectMenu` at `md` and `lg` render `text-sm`
(14px). Every raw input in the apps is 12-15px: QA composer `text-[0.9375rem]`
(`foodscholar/index.vue:73,229`), FoodChat textareas `text-[0.875rem]`
(`foodchat.vue:529`) and `text-[0.9375rem]` (`:51`), recipe search `text-sm`
(`recipe-wrangler/index.vue:55`), pantry input 11px (`foodchat.vue:3574`), rules
search `text-xs` (`guides/[guideId].vue:410`). iOS Safari zooms the page on focus
for anything under 16px. **One `app.config.ts` override plus one global CSS rule
fixes all of it** (§3, Phase 0).

### 1.3 Floating chrome collides and sits above modals

| Element | Position | z |
|---|---|---|
| Accessibility trigger / panel (`AccessibilityToolbar.client.vue:45,62`) | `fixed bottom-5 left-5` / `bottom-24 left-5 w-80` | 140 |
| Feedback trigger / panel (`FeedbackButton.client.vue:135,152`) | `fixed bottom-20 right-5` / `bottom-36 right-5 w-80` | 140 |
| Report bug (`ReportBugButton.client.vue:2`) | `fixed bottom-5 right-5` | 50 |
| ConsentBar (`ConsentBar.client.vue:12`) | `fixed inset-x-0 bottom-0` (~150px tall on phones) | 120 |
| FoodChat error toast (`foodchat.vue:1676`) | `fixed bottom-6 left-1/2` | 50 |
| Nuxt UI modals / toasts | portal, no z / `z-[100]` | – |

Both z-140 buttons paint over every open `UModal`, over toasts, over the consent
bar text and Accept button, and over the chat composers' send buttons. None uses a
safe-area inset. The accessibility panel has no `max-h`, so at the `xl` font scale
it runs off the top of a phone.

### 1.4 Height and scroll model

- `guides/[guideId].vue:5` uses `h-[calc(100dvh-4rem)]` (hard-coded header) **and**
  a `h-16` spacer at `:667`, so the page double-scrolls.
- `GuestBanner.vue` is in-flow and wraps to 2-3 lines on phones; every
  `calc(100dvh - header)` page overflows for guests.
- `foodchat.vue:3495` uses `height: clamp(480px, 78vh, 1080px)` inside a scrolling
  page with header, footer and disclaimer, and no keyboard handling.
- Sticky sidebars use `top-24` (96px) against a 64px header and are not
  breakpoint-gated (`foodscholar/[id].vue:473`, `recipe-wrangler/[id].vue:841`,
  `catalog/index.vue:58`, `textbooks/index.vue:51`).

### 1.5 Touch ergonomics (recurring everywhere)

- Hover-only reveals: `opacity-0 group-hover:opacity-100` in `RecipeCard.vue`,
  `library.vue:225`, `profiles.vue:85`, `foodchat.vue:373`; CSS `:hover::after`
  glossary tooltips (`foodscholar/[id].vue:1193`); menus that close on
  `@mouseleave` (`MealScheduleCard.vue:47`, `foodchat.vue:1293`).
- `UTooltip` as the only carrier of information (28 uses). Reka tooltips do not
  open on tap. Worst case: `ArticleCard.vue:22-33` swallows the tap with
  `@click.prevent.stop`, so "+N more topics" is dead on touch.
- Targets under 44px: chip removers 16px (`my-profile.vue:214`), tree chevrons 16px
  (`graph/Tree.vue:56`), card overlay buttons 36px (`RecipeCard.vue:29,47`), send
  button 36px (`foodchat.vue:538`), `size="xs"` toolbars.
- Markdown rendered with `gfm: true` has no table overflow rule anywhere
  (`.fc-md`, `.qa-answer-markdown`, catalog summaries), so LLM tables break the
  bubble/page width.

### 1.6 Side finding (not mobile, but found on the way)

`tailwind.config.js` is never loaded (Tailwind 4 needs `@config`), and
`--color-earth-*` is not in `@theme`. The 21 files using `from-earth-1`,
`to-earth-2` etc. generate **no CSS**; the built `dist/_nuxt/*.css` contains only the
raw `--earth-1/2` variables. Fix by adding `--color-earth-1/2` to `@theme` in
`main.css` (5 minutes, separate PR).

---

## 2. Per-app findings (ranked, worst first)

### 2.1 FoodChat (`app/pages/foodchat.vue`, 4065 lines) — no mobile layout at all

1. **Canvas gets 0px at 375px.** Split state is a plain `flex` row (`:153`): chat
   column with inline `width: chatWidth px` clamped to ≥300 (`:2995`), 8px splitter,
   44px rail. Nothing stacks. The plan is invisible on a phone.
2. **Fixed-height box in a scrolling page, no keyboard handling** (`:3495`).
3. **Planning-state rail** (`:1602`) is in normal flow; opening it squashes the chat.
4. **Hand-rolled modals** `PantryPicker.vue:2`, `AdaptRecipeModal.vue:2`:
   `fixed inset-0` centred, no scroll lock, no Escape, keyboard hides the footer CTA.
5. **Settings ribbon** (`PlanSettingsRibbon.vue:30`) wraps to 4-6 rows of 20px pills
   and a 13.6px range thumb.
6. Auto-scroll jumps to bottom on every message mutation (`:3434`); Enter always
   sends (`:2886`); `pt-12` + `pt-16` wasted at the top (`:149`, `:199`).
7. Markdown tables/pre overflow the 85% bubble (`:3654-3669`).
8. Weekly view text at `text-[0.4375rem]` (7px) (`:1394`).
9. `PlanToolsMenu.vue:17` passes the v2 `:popper` prop (ignored in v4).
10. Recipe links always `target="_blank"`.

Already good: idle state, `mealGridColumns` (one column below `sm`), weekly
accordion, `flex-wrap` everywhere, `SharePlanButton` on a real `UModal`.

### 2.2 FoodScholar

1. **Guide detail** (`guides/[countryOrRegion]/guides/[guideId].vue`): rules pane
   `w-[22rem] shrink-0` (`:366-369`) with its toggle `hidden lg:flex` (`:319`) and
   `rulesPaneOpen = true` (`:750`). **On a phone the PDF gets ~23px and the pane
   cannot be closed.** No-PDF variant stacks `w-80` + `w-[22rem]` = 672px of fixed
   width. Source/Edit actions `hidden sm:flex` (`:162,174`).
2. **QA cited sources hidden below `xl`** (`foodscholar/index.vue:676`
   `hidden xl:block`). Phones and tablets get answers with no source list.
3. **Europe map** (`guides/EuropeGuidesMap.vue:17`): `touch-none` over a
   `clamp(32rem, 72vh, 56rem)` area (`guides/index.vue:579`). The page cannot be
   scrolled past it; no pinch zoom; region facts are hover-only.
4. **Hierarchy filters** (`graph/Browser.vue:107-110`): inline `w-60 shrink-0`
   column leaves ~135px for the tree. Tree rows 24px, chevrons 16px.
5. QA composer is a single-line `<input>` with `pr-28` (~170px of visible text),
   no `enterkeyhint`, no autosize; idle `pb-48` pushes it under the keyboard.
6. Article passage peek is mouseover-only (`index.vue:2546-2568`); tap opens a new
   tab instead. Citation peeks have no `max-h`/scroll.
7. Session advanced panel `grid grid-cols-3` with no prefix (`index.vue:302`).
8. Catalog/textbook filters open **above** results with the close toggle below them
   (`catalog/index.vue:55-56`, `:359`); slide-in transition assumes a sidebar.
9. `[id].vue` Q&A pill tabs don't wrap (`:427`); glossary tooltips clip at edges.
10. PDF toolbar is nine `size="xs"` buttons (`[guideId].vue:226`).

Already good: article, catalog, textbook and region pages stack correctly;
`hierarchy.vue:8` uses `100dvh` and `var(--ui-header-height)`; the graph Inspector
already becomes a full-width overlay below `lg` (`Browser.vue:138-141`).

### 2.3 Recipe Wrangler

1. **Compare page** (`recipe-wrangler/compare.vue:49,53`): `w-[320px]` columns,
   `h-[240px]` images, sticky feature column inside a `<table class="overflow-hidden">`.
   ~1400px wide with 4 recipes.
2. **Filters** (`index.vue:415-422`, `RecipeFilters.vue`): an inline stack of 11
   cards several screens tall, every chip re-runs the search, results are below the
   whole panel, no active-filter summary once hidden.
3. **Results header** (`index.vue:427,437`) does not wrap once Compare is active.
4. **Detail page order** (`[id].vue:423-841`): ingredients render *after* nutrition
   and every instruction. `sticky top-24` (`:841`) is not `lg:`-gated.
5. **Nutri-Score and Substitute modals** (`[id].vue:1238`, `:1344`) have no inner
   scroll under Nuxt UI's `max-h-[calc(100dvh-2rem)] overflow-hidden`; they clip.
6. **Pagination** (`index.vue:576`) ±2 window plus edges overflows 343px.
7. **Hero overlay clipped** by `aspect-[16/7] overflow-hidden` (`[id].vue:58`) with
   title, meta pills and report button inside; same in `collections/[urn].vue:31`.
8. Detail page `main px-1` (`[id].vue:51`) with `p-8 sm:p-10` cards; ingredients
   header doesn't wrap (`:842`).
9. Radar chart labels shrink to 7-9px at phone width (`NutrientRadarChart.vue:31`).
10. Analyzer table colspan detail row renders off-screen (`index.vue:322`);
    search 14px (`:55`); no share/compare actions on the detail page.

Already good: all card grids start at one column; `overflow-x-auto` on the analyzer
and compare tables; the Adapt modal scrolls; fctables page is cards only.

### 2.4 Browsing pages and shell

1. **Household setup wizard cannot scroll** (`profile/HouseholdSetupWizard.vue:2-8`):
   `fixed inset-0 items-center` with no `overflow-y-auto`; step 2 is ~850px tall, so
   the Next button is unreachable on a 667px phone. Skip link is `absolute -top-12`.
2. **Landing hero clipped** (`pages/index.vue:65`): `text-6xl whitespace-nowrap`
   inside `overflow-hidden`; the accent line is ~560px wide. Greek lead overflows too.
3. **Pillar mockups** (`index.vue:213,442`) overflow a `aspect-[4/3]` box.
4. **Profiles** (`profiles.vue:43-107`): one 176px tile per row; play overlay is
   hover-only; delete badge 32px; v2-style `:ui` props (`:125,127,199,201`).
5. **Footer** (`WFooter.vue:45-89`): `UFooter` right slot has no wrap; session ID +
   legal links + 3 icons overflow 375px.
6. **Dashboard** headers don't wrap (`dashboard.vue:177-199`, `:294`); plate badges
   `text-[0.5rem]`; insight box fixed `h-28`.
7. **My profile**: danger-zone rows don't wrap (`my-profile.vue:582,598,618`); 16px
   chip removers; `w-28` fixed labels.
8. `GuestBanner.vue` `size="xs"` buttons; `TranslationNotice.vue` 24px buttons.
9. Landing autoplay video plus three `blur(90px)` blobs per section on mobile data.
10. Nine dashboard components are unused (HeroCard, TrendingRecipes, RingStat…); leave
    them out of the mobile pass.

### 2.5 Console (admin) — better than expected

Grids are prefixed, filter bars collapse, list tables scroll. Remaining:
`RangeControl.vue:2,43` overflows on 10 insights pages; wide fixed first columns
push row actions off-screen (`articles/index.vue:212` `w-[30rem]`);
`stats/TracesTable.vue:23` clips instead of scrolling; `insights/qa.vue:71` `w-72`
and `users.vue:175` `w-64`; `recipes/[id].vue:243` `grid-cols-2` unprefixed;
`InstructionStepsEditor.vue:38` relies on HTML5 drag. Gate as desktop-only:
guide review (`guides/review/[urn].vue`) and heatmaps (`insights/heatmaps.vue`).

---

## 3. Plan

Principles:
- **One threshold, one composable.** `lg` (1024px) is "single pane"; `sm` is
  "phone". A shared `useViewport()` is the only place JS asks about width.
- **Nuxt UI primitives over hand-rolled overlays.** `UDrawer` (bottom sheet) on
  phones, `USlideover` on tablets, `UModal` only when content is short.
- **Fix classes of problems once** (input size, markdown tables, FAB stacking,
  safe areas) before touching pages.
- **Don't make desktop-only tasks responsive**; gate them.

### Phase 0 — Foundations (one PR, unblocks everything)

1. `app/composables/useViewport.ts`: `useBreakpoints(breakpointsTailwind)` from
   VueUse → `isPhone` (< sm), `isCompact` (< lg), `isDesktop`, plus
   `hasHover` (`matchMedia('(hover: hover)')`). SSR-safe defaults to desktop; all
   app routes are `ssr: false` anyway.
2. `app/app.config.ts`: `ui.input`, `ui.textarea`, `ui.selectMenu`, `ui.inputMenu`
   base `text-base sm:text-sm` so every Nuxt UI field is 16px on phones. Add to
   `main.css`: `@media (pointer: coarse) { input, textarea, select { font-size: max(16px, 1em) } }`
   for the raw fields.
3. `app/app.vue:29`: `viewport-fit=cover`. `main.css`: `--wf-safe-bottom:
   env(safe-area-inset-bottom, 0px)`, `-webkit-tap-highlight-color: transparent`,
   `.touch-ok { @variant pointer-coarse { opacity: 1 } }` helper for hover reveals,
   and a markdown rule `:is(.prose, .fc-md, .qa-answer-markdown) :is(table, pre)
   { display:block; max-width:100%; overflow-x:auto }` plus
   `overflow-wrap: anywhere` on bubbles.
4. `main.css`: `--color-earth-1/2` in `@theme` (side fix from §1.6).
5. Floating chrome: new `app/components/FloatingDock.client.vue` mounted once in
   `app.vue`, bottom-right, `bottom-[calc(1.25rem+var(--wf-safe-bottom))]`, z-30,
   holding accessibility, feedback and bug-report as a speed-dial on phones and the
   current separate buttons at `lg`. Hidden while any `[role="dialog"]` is in the
   DOM (MutationObserver in a tiny `useOverlayOpen()`), while `ConsentBar` is
   visible, and on routes that declare `definePageMeta({ dock: 'composer' })`
   (chat pages lift it above the composer). Give the a11y panel
   `max-h-[calc(100dvh-8rem)] overflow-y-auto`.
6. Layout: add `app/layouts/app.vue` (header + main only, `min-h-dvh flex flex-col`,
   `UMain` as `flex-1 flex flex-col min-h-0`, no footer) for full-height pages
   (FoodChat, hierarchy, guide detail, QA session). Full-height pages become
   `flex-1 min-h-0` instead of `calc(100dvh - 4rem)`, which also absorbs the
   GuestBanner height for free.
7. `WFooter.vue`: `:ui="{ left: 'flex-wrap', right: 'flex-wrap gap-y-2' }"`, session
   ID `hidden sm:inline-flex`.

### Phase 1 — Header and navigation (one PR)

1. `WHeader.vue`: fill `UHeader` `#body` (mode `drawer` on phones via
   `:mode="isPhone ? 'drawer' : 'slideover'"`) with a `UNavigationMenu`
   `orientation="vertical"`: Dashboard; the three apps with icons and one-line
   descriptions; My Profile, My Library, Switch profile; Console (when allowed);
   then a row with `UColorModeButton` and the locale switcher; Sign out. Close on
   route change (`watch(route.path)`).
2. `#right` below `lg`: avatar only (or Sign in). Move `LocaleSelector`, colour
   mode and the Console button into the drawer. At `lg`+: keep the current row.
3. `#center` (visible only at `lg`+ by theme): a horizontal `UNavigationMenu` with
   the three apps, current one highlighted by route prefix. This is the same data
   as item 1 and finally gives desktop an app switcher too.
4. Rewrite `LocaleSelector.vue` on `UDropdownMenu` (flag only below `lg`).
5. `AppPageHeader.vue` / `MicroHeader.vue`: back link `min-h-11 min-w-11 -ml-2`
   touch target; `MicroHeader` section title `hidden sm:block` or wrapped under the
   title; actions slot `flex-wrap gap-y-2`. Optional: a `#tabs` slot rendering
   `UTabs variant="link"` inside an `overflow-x-auto snap-x` strip, adopted by the
   three hand-rolled tab bars.
6. Sticky offsets: replace `top-24` with
   `lg:sticky lg:top-[calc(var(--ui-header-height)+1rem)]` everywhere (§1.4 list).

### Phase 2 — FoodChat (one PR, largest)

1. Layout below `lg`: single pane with a segmented Chat / Plan switch in a compact
   top bar (badge on Plan when a new plan arrives). `flex-col lg:flex-row`; ignore
   `chatWidth`, `hidden lg:flex` on `.fc-splitter` and `.fc-rail`. Use the new `app`
   layout.
2. Chat pane: messages `flex-1 overflow-y-auto`; composer `sticky bottom-0` with
   `pb-[max(0.75rem,var(--wf-safe-bottom))]`; `text-base` textarea, `enterkeyhint`,
   under `pointer-coarse` Enter inserts a newline and the button sends; send button
   `h-11 w-11`; drop `pt-12`/`pt-16` on phones; auto-scroll only when within ~80px
   of the bottom.
3. Planning state rail → `UDrawer` (phone) / `USlideover` (tablet) from a toolbar
   button carrying the `standingCount` badge.
4. Settings ribbon → `UDrawer` on phones with one control per row, `min-h-11`
   pills, full-width range with a 24px thumb.
5. `PantryPicker` and `AdaptRecipeModal` → rebuild on `UDrawer` (phone) /
   `UModal` (desktop) with pinned footers and `dvh` heights; keep Escape/scroll-lock
   from the primitive.
6. `MealScheduleCard` / weekly view: menus on `UDropdownMenu`; donut value cycles on
   tap or shows a legend; feedback row and card actions `pointer-coarse:opacity-100`;
   buttons `min-h-11`; raise 7-9px text to `text-[0.6875rem]` minimum; recipe links
   same-tab on touch.
7. Fix `PlanToolsMenu.vue:17` (`:content` instead of `:popper`).

### Phase 3 — FoodScholar (one PR per bullet group)

1. Guide detail: use `app` layout and `flex-1 min-h-0`; drop the `h-16` spacer;
   below `lg` a PDF / Rules segmented toggle with `rulesPaneOpen` defaulting to
   false when `isCompact`; no-PDF variant `flex-col lg:flex-row`; Source and Edit in
   an overflow `UDropdownMenu` on phones; toolbar `size="sm"` under `pointer-coarse`;
   give `:217` `relative` so the info overlay anchors correctly.
2. QA page: below `xl`, render sources as a collapsible "Sources (n)" block under the
   answer (same data as the sidebar); `NLInput` gains a `multiline` mode (autosize
   textarea, `enterkeyhint="send"`), `pr-24`, `pb-24 sm:pb-48`; article citation tap
   opens the peek on `hover: none` (matching the guideline peek); peeks get
   `max-h-[70dvh] overflow-y-auto`; `index.vue:302` → `grid-cols-1 sm:grid-cols-3`;
   swap information-only `UTooltip`s for `UPopover`.
3. Europe map: `touch-pan-y` until the user taps "Explore map" (then `touch-none`
   with a Done button), height `clamp(18rem, 60vw, 56rem)` on phones, region facts on
   tap, "Tap a region" copy, pinch-zoom via two-pointer distance in the existing
   pointer handlers.
4. Hierarchy: filters in a `USlideover side="left"` below `lg`; Inspector on
   `USlideover` (keeps the existing overlay behaviour but gains backdrop and focus
   trap); tree rows `py-2`, chevron `h-8 w-8` under `pointer-coarse`; `SearchBox`
   16px.
5. Catalog / textbooks: filters in a `UDrawer` below `lg` with an "Apply" footer and
   result count; `[id].vue:427` tabs `flex-wrap`; glossary terms become tappable
   `UPopover`s; `ArticleCard.vue:22` "+N more" opens a popover instead of a dead tap.

### Phase 4 — Recipe Wrangler (one PR)

1. Filters → `UDrawer` below `lg` with a sticky "Show N recipes" footer (debounce
   the live search while the drawer is open); active-filter chip bar and count
   badge on the Filters button.
2. Results header `flex-wrap gap-y-3`; Compare/Clear labels `hidden sm:inline`; a
   sticky bottom "Compare (n)" bar on phones once ≥2 selected.
3. Pagination: phones show Prev / "Page X of Y" / Next only (`hidden sm:flex` on the
   number buttons).
4. Detail page: `main px-4`, cards `p-5 sm:p-8 lg:p-10`; ingredients column
   `order-first lg:order-none` (or Ingredients / Steps / Nutrition `UTabs` below
   `lg`); `lg:sticky`; hero `aspect-[4/3] sm:aspect-[16/6]` or title below the
   image on phones; ingredients header `flex-wrap`; Nutri-Score and Substitute
   modals on `UDrawer` (phone) with inner scroll; radar gets a phone viewBox with
   larger fonts or defaults to the grid view; Save/Share/Compare in a sticky action
   row on phones.
5. Compare: below `sm`, a stacked per-metric list with a two-recipe picker; at `sm`+
   keep the table with `w-[240px] sm:w-[320px]`, move `rounded/overflow-hidden` to
   the wrapper so the sticky column works.
6. Search and analyzer inputs `text-base sm:text-sm`; analyzer detail row rendered
   as a card below the table on phones; card overlay buttons `h-11 w-11`; hover
   lifts under `pointer-fine:` only.

### Phase 5 — Browsing pages (one PR)

1. Wizard → `UModal` with `fullscreen` below `sm`, scrollable body, footer pinned,
   Skip inside the card.
2. Landing: `text-4xl sm:text-6xl whitespace-normal sm:whitespace-nowrap` (`:65`),
   `break-words hyphens-auto` for el; pillars `aspect-auto min-h-[20rem]
   sm:aspect-[4/3]` with the micro-table `hidden sm:block`; `<video>` only at `sm`+
   or `prefers-reduced-data`; halve blob count on phones.
3. Profiles: `grid grid-cols-2 sm:flex sm:flex-wrap`, `size="lg"` avatars below
   `sm`, overlays `pointer-coarse:opacity-100`, delete badge 44px hit area, v4 `:ui`
   props.
4. Dashboard and My Profile: `flex-wrap` / `flex-col sm:flex-row` on the listed
   rows; chip removers `min-h-11 min-w-11`; `w-full sm:w-28` labels; badges
   ≥ `text-[0.625rem]`.
5. GuestBanner and TranslationNotice buttons `size="sm"`.

### Phase 6 — Console (small PR)

`RangeControl` wraps; list tables `w-[16rem] sm:w-[30rem]` first column and
`min-w-[40rem] md:min-w-[56rem]`; wrap `TracesTable`; `w-full sm:w-72/64` inputs;
`recipes/[id].vue:243` prefixed; up/down buttons in `InstructionStepsEditor`; a shared
`ConsoleLargeScreenNotice` (`lg:hidden`, with "continue anyway") on guide review
and heatmaps, soft notice on the integrator.

### Phase 7 — Verification and guardrails

- **Device matrix:** iPhone SE (375×667), iPhone 15 (393×852), Pixel 8 (412×915),
  iPad portrait (768×1024, the `md`-`lg` gap), iPad landscape (1024, header
  boundary). Test with the on-screen keyboard open on every composer.
- **Checklist per page:** no horizontal scroll, no input zoom, every action
  reachable without hover, ≥44px targets on `pointer-coarse`, nothing under the
  dock or consent bar, works as a guest (banner present).
- **Automated:** add Playwright with a 375px project running a smoke suite that
  asserts `document.documentElement.scrollWidth <= innerWidth` on every route and
  screenshots for review. Not currently in `package.json`.
- **Measure:** the console's Audience page already splits sessions by device
  (`insights/AudienceSplit.vue`). Record the mobile share and mobile error rate
  before Phase 1 and after Phase 5.
- **Guardrail:** an ESLint/grep check in CI for `grid-cols-[3-9]` without a
  prefix, `w-[…px]` in `app/pages`, and `text-sm`/`text-xs` on `<input|textarea>`.

---

## 4. Order and effort

| Phase | Scope | Effort | Depends on |
|---|---|---|---|
| 0 | Foundations, dock, `app` layout, input sizes | M | – |
| 1 | Header drawer, app switcher, sub-headers | M | 0 |
| 2 | FoodChat | L | 0, 1 |
| 3 | FoodScholar (guide detail, QA, map, hierarchy, catalog) | L | 0, 1 |
| 4 | Recipe Wrangler | M-L | 0, 1 |
| 5 | Browsing pages | M | 0, 1 |
| 6 | Console | S | 0 |
| 7 | Verification | S, ongoing | all |

Phases 2-5 are independent of each other and can run in parallel once 0 and 1 are
merged. Ship 0 and 1 first: they remove the empty hamburger, the input zoom and the
button pile-up on every page, which is most of what a mobile visitor notices today.

## 5. Decisions to confirm

1. **Threshold:** `lg` as the single-pane cutoff (matches Nuxt UI). Tablets in
   portrait get the phone layouts; landscape tablets get desktop. Alternative is
   `md`, which would need a separate tablet layout for FoodChat and the guide detail.
2. **Dock behaviour:** one speed-dial (accessibility, feedback, bug) on phones vs
   keeping the accessibility button separate for discoverability. Plan assumes the
   speed-dial, with the accessibility icon as the dial's face.
3. **Desktop app switcher in the header** (`#center`): included in Phase 1 because
   it is the same data as the drawer. Drop it if the dashboard is meant to stay the
   only entry point.
4. **Playwright** as a new dev dependency for the 375px smoke suite.

---

## 6. What shipped (2026-09-28)

Phases 0 to 5 are in the working tree. Verification: `pnpm build` passes;
`pnpm typecheck` reports no error that was not already there (total went from
150 to 110, because v2-era `:ui` props and invalid colours were fixed along the
way); ESLint shows no new non-stylistic finding in any changed file. The four
decisions in section 5 were taken as recommended, except Playwright, which is
not added as a dependency yet: a 375px pass was run against the production
build with a local headless Chromium instead (privacy, login and landing pages;
the header menu, the dock and its sheets at phone, tablet and desktop widths).
Pages behind login could not be exercised without a Keycloak realm, so FoodChat,
the guide detail, the filters drawers, the wizard and the profiles grid still
need a hands-on pass on a phone.

Departures from the plan, and things learned on the way:

- **Console scope dropped** (user decision). Nothing under `/console` changed.
- **Nuxt UI's own strings** are now localized: `useUiLocale()` feeds `UApp` the
  `en`/`hu`/`sl` locale from `@nuxt/ui/locale`, extended with `header.title`
  and `header.description`, which Nuxt UI 4.2 references from the header menu
  but never shipped. Screen readers were read raw keys before.
- **`AppPageHeader` gained a `compact` form** below `sm` (one row: back, title,
  subtitle, actions) for pages that own the whole screen; used by FoodChat and
  the hierarchy. The full form is unchanged elsewhere.
- **Viewport meta** also carries `interactive-widget=resizes-content`, so
  Android shrinks the layout for the keyboard and a composer pinned to the
  bottom stays above it. iOS ignores it; FoodChat re-pins the thread through
  `visualViewport` there.
- **`enterkeyhint`** is `send` only where Enter sends (fine pointers) and
  `enter` on coarse pointers, where Enter inserts a newline and the button
  sends. The plan asked for `send` everywhere, which would have labelled the
  key wrongly.
- **The landing hero has no `<video>`**; the two references the audit counted
  were placeholder comments. The rule (only at `sm`+, never under
  `prefers-reduced-data`) is noted on those comments for whoever adds one.
- **Dock and sheets:** the dock button also steps aside while one of its own
  bottom sheets is open. The Recipe Wrangler compare bar stops short of the
  dock's corner (`right-20`) rather than raising the dock.
- **`el.json`** is not registered in the i18n plugin (only en, hu, sl load).
  New Greek strings were added anyway where the namespace existed.
- **Playwright** remains a follow-up: the 375px smoke suite in Phase 7 needs a
  Keycloak test realm or a mocked auth store to reach the app pages.

Files of note added in Phase 0/1: `app/composables/useViewport.ts`,
`app/composables/useOverlayOpen.ts`, `app/composables/useSentryFeedback.ts`,
`app/composables/useUiLocale.ts`, `app/components/FloatingDock.client.vue`,
`app/components/dock/AccessibilityPanel.vue`,
`app/components/dock/FeedbackPanel.vue`, `app/layouts/app.vue`,
`app/types/page-meta.d.ts`. Removed: `AccessibilityToolbar.client.vue`,
`FeedbackButton.client.vue`, `ReportBugButton.client.vue` (folded into the dock).
