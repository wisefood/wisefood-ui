# Help companion, guided tours and the bug-report nudge

Three things that help people during the evaluation: a help panel for every
page, guided tours started from it, and a bug report offered when something
actually breaks.

## The help panel

- **Desktop:** a panel on the right, opened with the **Help** button in the
  header or the `?` key. It is not a dialog, so the page stays usable while it
  is open. From 1280 px up the page moves left to make room; between 1024 and
  1280 px it covers the right edge, below the header.
- **Phones and portrait tablets:** a sheet that slides up, opened from the
  round help button at the bottom right (first item in its menu).
- **It follows the page.** Leave it open, go to a recipe, and it explains the
  recipe. **All help topics** lists every topic, and picking one from that list
  keeps it until you navigate.
- **First-visit dot:** a small amber dot on the Help button (or the round
  button on phones) means this page's help has not been opened yet. This is
  remembered per browser.

### Where the words live

| File | What it holds |
|---|---|
| `app/help/topics.ts` | Which pages each topic covers, its features, and which features have a tour (`tour:`) or a video (`video:`). No language. |
| `app/help/content/en.ts`, `hu.ts`, `sl.ts` | The text, one file per interface language. Each file is typed against `HelpContent`, so a missing topic or feature fails the type check. |
| `app/help/types.ts` | The shapes and the writing conventions. |

**Writing conventions**

- **Name buttons by key.** Write a button as `[[i18n.key]]`. It renders as the
  label from the app's own locale file, so the help always matches the screen,
  even after a rename.
- **Hard-coded English labels.** Use `[[=Text]]` for the few labels still
  hard-coded in English in a template. Those show the same text in every
  language.
- **Keep it short.** A one-sentence `body`, then three to five imperative
  steps, one action per step. Add a `note` only for a real caveat, such as a
  precondition or a limit.
- **Hungarian and Slovenian.** Put the label after a colon or in brackets
  rather than inside the grammar of the sentence, because articles, suffixes
  and case endings can't agree with a label nobody knows in advance. The
  Slovenian text also avoids the gendered past tense.

**Hungarian and Slovenian need a native-speaker read** before the evaluation.
The English is the reference.

**Adding a topic:**

1. Add its id to `HelpTopicId`.
2. Add an entry to `HELP_TOPICS` (order matters: the first match wins).
3. Add the text to all three content files.

To check that every `[[key]]` exists, grep the keys and look them up in
`app/i18n/locales/*.json`. A missing key still renders, as its last segment,
but it reads badly.

## Videos

Clips are optional. A feature names its clip (`video: 'foodscholar-ask'`),
and the panel shows it only if the media manifest lists it. So features can
name clips before they are recorded, and clips can be published without a
rebuild.

- **Where clips live:** `<base>/manifest.json`. `<base>` is `HELP_MEDIA_BASE_URL`
  (runtime, via `docker-entrypoint.sh`) and defaults to `<app base>/help/media`,
  which is `public/help/media/` in this repo. On the demo it is the public
  `help-media` bucket on MinIO (`https://s3.wisefood-project.eu/help-media`),
  so clips are replaced with `mc cp` and no rebuild. MinIO's CORS rule must
  allow the app's origin, because the manifest is fetched with `fetch()`.
- **Manifest format:**

  ```json
  {
    "videos": {
      "foodscholar-ask": {
        "src": "foodscholar-ask.en.mp4",
        "poster": "foodscholar-ask.en.jpg",
        "duration": 31, "width": 1920, "height": 1080,
        "locales": {
          "hu": { "src": "foodscholar-ask.hu.mp4", "poster": "foodscholar-ask.hu.jpg", "duration": 33 },
          "sl": { "src": "foodscholar-ask.sl.mp4", "poster": "foodscholar-ask.sl.jpg", "duration": 32 }
        },
        "phone": {
          "src": "foodscholar-ask.en.phone.mp4",
          "poster": "foodscholar-ask.en.phone.jpg",
          "duration": 30, "width": 780, "height": 1688,
          "locales": { "hu": { "src": "foodscholar-ask.hu.phone.mp4", "poster": "foodscholar-ask.hu.phone.jpg" } }
        }
      }
    }
  }
  ```

  - Relative names resolve against `<base>`.
  - `locales` is the same clip recorded with the interface in another
    language. It brings its own poster and length; anything it leaves out
    comes from the default recording.
  - `phone` is a portrait recording of the phone layout. Phones (below
    640 px) play it instead, because a desktop recording shrunk to a phone's
    width can't be read. Without one, phones play the desktop clip.
  - `width` and `height` give the frame its shape. Without them the player
    assumes 16:9.
  - The older `sources` (a file per language) and `captions` (WebVTT per
    language, falling back to English) still work. Captions from another
    origin need that origin's CORS, because the player then asks for the
    video with `crossorigin`.
- **The player:** the panel shows the poster in the clip's own shape, and
  pressing it opens `HelpVideoPlayer` full screen: the frame as large as the
  screen allows, 44 px controls, a scrubber you can drag, and tap to pause.
  On a phone on its side the title row folds away. It is a Nuxt UI modal, so
  it stacks above the help sheet on phones; Escape closes the clip only.
- **Clip ids named in `topics.ts`:**
  - FoodScholar: `foodscholar-ask`, `foodscholar-sources`,
    `foodscholar-catalog-search`, `foodscholar-article`,
    `foodscholar-guides-map`, `foodscholar-guides-explorer`,
    `foodscholar-hierarchy`, `foodscholar-textbooks`
  - FoodChat: `foodchat-generate-plan`, `foodchat-refine`
  - RecipeWrangler: `recipes-search`, `recipes-analyze`, `recipe-improve`
- **Making clips:** `scripts/help-clips/` records them against the demo
  (see its README).
  - Silent, one task per clip, 20–40 seconds.
  - The instructions are drawn into the page in the interface language, so
    each language is its own recording and plays the same in any player.
  - Waiting for the AI stays in the clip, sped up, with a badge saying so.
  - Desktop clips are 1920×1080 (a 1440×810 page). Phone clips are 780×1688
    (a 390×844 page). Both are H.264 MP4 with a JPG poster of the result.
  - The recorder uses one guest per language. The demo allows 5 new guests
    per IP per hour and 20 FoodScholar questions per guest per day.
- **Loading:** nothing is fetched until the panel opens. After that only the
  posters load, and a video loads when someone presses play.

## Guided tours (Flows)

`flows.sh` is the spec for every tour: steps, anchors, and the rules that
keep a tour from stalling. Tours are built in the Flows dashboard.

- **"Show me" buttons.** A feature with `tour: '<key>'` gets a **Show me**
  button that calls `startWorkflow('<key>')`. The workflow needs a *manual
  start* block with exactly that key and frequency *every time*.
- **Missing tours.** If no tour appears within ~3.5 s, the panel says the
  walkthrough isn't ready, and logs `feature.used {feature: 'help', action:
  'tour_unavailable'}`. Those events list the keys still missing in the
  dashboard.
- **Anchors.** Anchors are `data-flows="…"` attributes. The table in
  `flows.sh` says which page each one is on and when it exists (some appear
  only after a plan, an answer or a search).

## The bug-report nudge

When the platform fails in a way the person didn't cause, a bubble next to
the bug button offers the Sentry report form there and then.
`app/composables/useTroubleSignal.ts` decides what counts:

| Offers a report | Never offers one |
|---|---|
| HTTP 5xx from our own APIs | 404s, other 4xx, images and media, analytics ingest, the Flows proxy |
| 401/403 that is still failing 4 s later (the services refresh the token and retry once; a success on the same request cancels it) | a 401 the refresh fixed; being sent to `/login` |
| a request that failed outright, while online | aborted requests; offline; page unloading |
| uncaught script errors, unhandled rejections that aren't HTTP errors, errors caught by a Vue boundary | ResizeObserver noise, browser-extension errors, stale chunks after a deploy |

**Limits:**

- At most 3 bubbles per page load.
- 2 minutes of quiet after a bubble.
- 10 minutes of quiet after **Not now**.
- Each bubble disappears by itself after 45 s.

**Report tags.** A report sent from the bubble carries these tags:

- `source: nudge`
- `trouble_kind`
- `trouble_status`
- `trouble_request` (method and path, no query string)
- `trouble_page` (the route pattern)

The Sentry replay of the last minute is attached as usual. The bubble appears
only where Sentry feedback is enabled, because otherwise there is nowhere to
send the report.

This detector records nothing. It is separate from the RUM error capture,
which only installs when the gateway switches `capture.errors` on.

## What gets measured

Help usage goes out as the existing `feature.used` event (the gateway's
allowlist rejects unknown event types, together with the whole batch). Every
event carries `{feature: 'help', action, …}`:

| `action` | When |
|---|---|
| `open` | The panel opened (`via`: header, dock, keyboard or link). |
| `topic` | A topic was picked from the list. |
| `expand` | A feature was opened. |
| `video` | A clip was played. |
| `tour` | **Show me** was pressed. |
| `tour_unavailable` | **Show me** was pressed but no tour appeared. |
| `still_stuck` | **Send feedback** or **Report a bug** was used from the panel. |
