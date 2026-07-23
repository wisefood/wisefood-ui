# FoodScholar QA — wisefood-ui Implementation Plan

Plan/spec for surfacing four new FoodScholar backend capabilities in the Nuxt UI.
No code has been written yet — this is for review.

**Backend is ready.** All four capabilities are live on `POST /qa/ask` and
`GET /qa/questions`. The UI's API-client types (`app/services/foodscholarApi.ts`)
already declare every field involved (`qa_thread_id`, `expertise_level`,
`language`, `clarification_response`). **No type changes are required** — the
work is state + payload logic, almost entirely in
`app/pages/foodscholar/index.vue` plus the Pinia store `app/stores/foodscholarQa.ts`.

Base path in the client is `/foodscholar/qa` (proxied to the backend `/qa`).

---

## Capability 1 — Language passing  *(smallest, highest-leverage)*

**Problem.** `buildBasePayload()` hardcodes `language: 'en'` (`index.vue:2248`).
So answers, follow-ups, clarifications, and starter questions always come back in
English regardless of the app locale — this is the root of the "clarification in
English / Slovene answer" and "~10% untranslated" reports (the backend now honors
`language`, but the UI never sends it).

**Backend contract.** `POST /qa/ask` accepts `language` (ISO 639-1, default `en`).
`GET /qa/questions` accepts `?language=` (default `en`). Supported app locales are
`en | hu | sl` (`app/plugins/i18n.ts:6`) — all valid ISO 639-1 codes, so a direct
pass-through works.

**Changes.**
1. `index.vue:2248` — replace `language: 'en'` with the resolved locale
   (`locale.value` from `useI18n()`, already imported at `index.vue:1092`).
2. `loadQaQuestions()` (`index.vue:2233`) — pass `language` to `listQuestions()`.
   Add a `language` query param to `FoodScholarApiService.listQuestions()`
   (`foodscholarApi.ts:163`).
3. `dashboard.vue:846` (tips) — out of scope for language (the tips endpoint has
   no `language` param yet); note only.

**Decision to resolve — locale source of truth.** There are TWO locale keys:
- cookie `wisefood_locale` (read by the i18n plugin, `i18n.ts:24`)
- localStorage `wisefood-locale` (via `useLocale.ts:5`)

`useI18n().locale.value` is the reactive truth the plugin drives, so **use
`locale.value`** and treat the storage keys as persistence details. Confirm the
two stay in sync (they should, since the selector sets `locale.value`).

**Effort:** ~S. **Risk:** low. No new UI. Ship this first.

---

## Capability 2 — Expert / beginner control

**Problem.** `expertiseLevel` (`index.vue:1842`, values `beginner|intermediate|expert`)
is only exposed inside the collapsible Advanced panel, and in simple mode the
payload builder **force-overrides it to `'intermediate'`** (`index.vue:2261`) — so
the average (non-advanced) user's register choice is impossible to set. With the
backend now producing genuinely divergent beginner vs expert wording (register
specs), this control is worth surfacing.

**Backend contract.** `expertise_level: "beginner" | "intermediate" | "expert"`,
default `"intermediate"`, on `POST /qa/ask`.

**Changes.**
1. Surface the control outside the Advanced panel — a compact segmented toggle
   (Beginner / Expert, with Intermediate as the implicit middle or a third
   segment) near the composer in both idle (`index.vue:~166`) and session
   (`index.vue:~300`) states. Reuse `expertiseOptions` (`index.vue:1907`) and the
   `selectedExpertiseValue` computed (`index.vue:2182`).
2. Remove/relax the simple-mode override at `index.vue:2261` so the chosen
   `expertiseLevel` is always sent (advanced panel keeps its own menu bound to the
   same ref — single source of truth).
3. Persist the choice: add `expertiseLevel` to the QA store save/restore (already
   partially there — `foodscholarQa.ts` stores `expertiseLevel`) and optionally to
   localStorage for cross-session stickiness.

**Decision to resolve — toggle shape.** Two-way (Beginner/Expert) is what Claire's
feedback implies ("clearly differentiate"); Intermediate is the default when
untouched. A three-segment control is more faithful to the API. Recommend
**two visible options + Intermediate as the default/unset state**, but flag for
product.

**Effort:** ~M (new UI element + wiring). **Risk:** low-medium (touches the
default-mode payload path — verify caching still keys correctly per level).

---

## Capability 3 — Thread continuity  *(prerequisite for #4)*

**Problem.** Today `qaThreadId` is deliberately nulled after a normal answer
(`index.vue:2316`, and reset again in the follow-up path `:2339`). The thread id is
used ONLY to bridge a single clarification round-trip. So follow-ups are stateless
and each replaces the previous answer.

**Backend contract.** `qa_thread_id` is now **returned on every answer** (minted on
the first turn). Re-send it on the next `/qa/ask` (with a new `question`, no
`clarification_response`) and the backend loads a running conversation summary,
answers with that context, and updates the summary. Omit it to start fresh.
Carrying context is entirely the UI's choice.

**Changes.**
1. Stop nulling `qaThreadId` on a normal answer — in `handleQaResponse()`
   (`index.vue:2306`), always capture `result.qa_thread_id` into `qaThreadId`
   (remove the null-out at `:2316`).
2. `buildBasePayload()` — include `qa_thread_id: qaThreadId.value` whenever it is
   set (mirror what `submitClarification` already does at `index.vue:2374`).
3. Persist `qaThreadId` in the QA store (`foodscholarQa.ts`) alongside
   `question/result/expertiseLevel`, with the same 30-min TTL, so a thread survives
   navigation. (Backend conversation TTL is 1h; UI 30-min is a safe subset.)
4. Define a **"new conversation" affordance** that clears `qaThreadId` (and the
   store) — e.g. the existing reset path / a "Start new" button — so users can
   deliberately drop context.

**Decision to resolve — when does a thread continue vs reset?**
- **Follow-up chips** (`askScholarQA(suggestion)`, `index.vue:2327`): should now
  CONTINUE the thread (send `qa_thread_id`) instead of resetting (`:2336-2340`).
- **Typing a brand-new unrelated question** in the main composer: ambiguous — does
  it continue the thread or start fresh? Recommend: **the main composer continues
  the current thread** while a session is active, and an explicit "New conversation"
  control resets. This matches the backend's "UI decides" model. Flag for product.

**Effort:** ~M. **Risk:** medium — this changes the core ask lifecycle. Needs the
reset/branch logic in `askScholarQA` (`index.vue:2327`) untangled carefully.

---

## Capability 4 — Free-form follow-up input  *(the Green Point ask)*

**Problem.** There is no free-text follow-up box — only clickable suggestion chips
(`index.vue:553`) and the clarification panel's free_text field. The Green Point
request is to let users type their OWN follow-up in addition to the suggestions.

**Backend contract.** No special field — a free-form follow-up is just a normal
`POST /qa/ask` with the user's `question` text plus the echoed `qa_thread_id`
(Capability 3). The running summary makes "what about for kids?" resolve.

**Changes.**
1. Add a persistent follow-up composer in the **session/answer** view (below the
   answer + suggestion chips, `index.vue:~553-562`). Can reuse `FoodscholarNLInput`
   (`app/components/foodscholar/NLInput.vue`), bound to a new `followUpQuery` ref,
   submitting through the threaded ask path.
2. Route both the free-form submit AND the suggestion chips through a single
   **threaded ask** function (a variant of `askScholarQA` that does NOT reset
   `qaThreadId`/prior result the way the current one does at `:2336-2340`, and that
   appends to a visible turn history rather than replacing).
3. **Conversation history rendering (open question).** Today the page shows a single
   Q→A. Free-form follow-ups imply a thread. Options:
   - (a) Keep single-answer view, just replace-in-place but keep context server-side
     (minimal; the "thread" is invisible to the user).
   - (b) Render an actual turn list (question → answer → follow-up → answer …).
   Recommend **(b)** for a real conversational feel, but it's the largest UI change
   here. Flag for product — this is where the "short-horizon conversational
   character rethink" (Dimitris's note) gets decided.

**Effort:** S (input box) + M/L (turn-history rendering, if chosen). **Risk:** medium.
**Depends on:** Capability 3.

---

## Suggested sequencing

1. **Capability 1 (language)** — isolated, high-value, low-risk. Ship alone.
2. **Capability 2 (expert/beginner)** — independent, self-contained.
3. **Capability 3 (thread continuity)** — plumbing; no user-visible feature alone
   but unlocks #4.
4. **Capability 4 (free-form follow-up)** — builds on #3; decide history-rendering
   depth with product first.

## Cross-cutting notes

- **HTTP timeout.** QA calls use the generic `wisefoodRestApi.ts` wrapper with no
  long timeout, unlike FoodChat's 3-min `MESSAGE_TIMEOUT`. Free-form follow-ups are
  the same latency profile as asks; if slow `/ask` calls are timing out, consider a
  longer timeout for the QA path (`app/services/foodchatApi.ts:8` is the precedent).
- **No API-client type work needed** — `QaAskRequest`/`QaAskResult`
  (`foodscholarApi.ts:11-98`) already cover all fields.
- **Product decisions to confirm before build:** expertise toggle shape (2 vs 3
  segments); thread continue-vs-reset semantics for the main composer;
  conversation-history rendering depth (replace-in-place vs turn list).
</content>
