#!/usr/bin/env bash
#
# flows.sh — WiseFood guided tours (Flows.sh)
# ===========================================
#
# This is NOT an executable workflow. Flows.sh tours are authored in the Flows
# dashboard (app.flows.sh), not in code. This file is the source-of-truth spec
# for every tour: the blocks to create, the DOM anchors they attach to, the
# targeting rules, and the small amount of app code that backs them.
#
#   Workflow 1   Nutrition preferences setup     automatic (targeted)
#   Workflow 2   Dashboard tour                  manual    tour-dashboard
#   Workflow 3   FoodChat: get a meal plan       manual    tour-foodchat-plan
#   Workflow 4   FoodScholar: ask a question     manual    tour-foodscholar-ask
#   Workflow 5   FoodScholar: search articles    manual    tour-foodscholar-catalog
#   Workflow 6   FoodScholar: guides by map      manual    tour-foodscholar-guides
#   Workflow 7   RecipeWrangler: find recipes    manual    tour-recipes-search
#   Workflow 8   RecipeWrangler: compare         manual    tour-recipes-compare
#   Workflow 9   A recipe up close               manual    tour-recipe-detail
#   Workflow 10  My profile preferences          manual    tour-profile-preferences
#
#
# ── How a tour starts ─────────────────────────────────────────────────────────
#
# Automatically: a start block with user-property targeting (workflow 1 only).
#
# On request: every page has a Help panel (the "Help" button in the header on
# a desktop, the round button bottom right on a phone, or the ? key). A
# feature in that panel with a tour shows a "Show me" button, which calls
# startWorkflow(<block key>) from @flows/js. The block keys are the contract
# between this file and app/help/topics.ts (`tour:` on each feature):
#
#   1. Give each workflow below a MANUAL START block whose block key is exactly
#      the key in the table above. If the dashboard generates the key instead
#      of letting you type it, copy the generated key into the matching
#      `tour:` in app/help/topics.ts.
#   2. Set the workflow's frequency to EVERY TIME. People come back to a tour
#      when they forget; "once" makes the button silently do nothing the
#      second time.
#   3. No user-property conditions on manual start blocks unless you mean
#      them — a user who fails them gets no tour.
#   4. Publish in the environment the deployment uses (VITE_FLOWS_ENVIRONMENT).
#
# startWorkflow() resolves the same way whether or not a tour started, so the
# panel waits ~3.5 s for a new block to appear. If none does it says "This
# walkthrough isn't ready yet" and logs feature.used {feature: help, action:
# tour_unavailable, topic, item} — that event in the console is the list of
# keys still missing from the dashboard.
#
# Flows only runs for signed-in users, guests included (02.flows.client.ts).
# "Show me" is hidden when Flows is not initialised (no org id configured).
#
#
# ── Rules for every workflow ──────────────────────────────────────────────────
#
# EVERY URL IN THE DASHBOARD NEEDS THE /app PREFIX.
#   The container runs with CONTEXT_PATH=/app, so the app is served from
#   /app and there is no route at the origin root: the dashboard page is
#   /app/dashboard, the profile page /app/my-profile, and so on. A page
#   condition or navigation gate written as "/my-profile" matches nothing,
#   and the step it guards silently never renders — the tour reaches that
#   point and stops, with no error anywhere. Every Page: line below is
#   written with the prefix for this reason; carry it into any new workflow.
#
# ANCHORS ARE CSS SELECTORS: [data-flows="<name>"].
#   Flows takes the first match in the document. Where the same control
#   exists twice on one page at once (a desktop and a phone variant, one of
#   them hidden by CSS), the two have DIFFERENT names, so a step never lands
#   on the invisible one: `<name>` is the desktop variant, `<name>-phone` or
#   `<name>-inline` the narrow one. Where two variants never coexist (the
#   FoodChat composer before and after the first message), they share a name.
#
# WAIT FOR WHAT A USER ACTION CREATES.
#   Some anchors only exist after the person does something (a plan after
#   they send a request, an answer after they ask). Put a wait step with
#   "Element is on the page" and the anchor's selector before the step that
#   points at it. The anchor table below says which ones.
#
# A STEP ANCHORED TO SOMETHING THAT MAY NOT BE THERE STALLS THE TOUR.
#   Anchors marked "conditional" below depend on data (API suggestions, a
#   household with several members) and are deliberately NOT used as tour
#   steps. Mention them in a modal step instead.
#
# LANGUAGE.
#   init() does not pass `language`, so every user sees the organisation's
#   default language group. To serve hu/sl translations, add language groups
#   in Flows and pass `language: <ui locale>` to init() in 02.flows.client.ts.
#
#
# ── Anchor reference ──────────────────────────────────────────────────────────
#
# name                              page (no /app)              present when
# --------------------------------  --------------------------  -------------------------------------
# help-button                       every page with help        desktop (lg+) only
# profile-dropdown-trigger          every page with the header  signed in
# guest-keep-account                pages with the header       guests only
# guest-erase                       pages with the header       guests only
# claim-signin-notice               /login                      after a claim
# dashboard-app-foodscholar         /dashboard                  always
# dashboard-app-recipewrangler      /dashboard                  always
# dashboard-app-foodchat            /dashboard                  always
# dashboard-spotlight               /dashboard                  always (fades in when scrolled to)
# dashboard-schedule                /dashboard                  always (fades in when scrolled to)
# foodchat-composer                 /foodchat                   always (welcome screen and chat view)
# foodchat-send                     /foodchat                   always
# foodchat-suggestions              /foodchat                   welcome screen only (new users)
# foodchat-sessions                 /foodchat                   chat view; welcome only with past sessions
# foodchat-new-chat                 /foodchat                   chat view
# foodchat-pane-switch              /foodchat                   chat view, below lg (Chat/Plan tabs)
# foodchat-plan                     /foodchat                   chat view; hidden on phones on the Chat tab
# foodchat-plan-settings            /foodchat                   AFTER A PLAN
# foodchat-plan-tools               /foodchat                   AFTER A PLAN (conditional: tool list)
# foodchat-save-plan                /foodchat                   AFTER A PLAN
# foodchat-share-plan               /foodchat                   AFTER A PLAN
# foodchat-planning-rail            /foodchat                   lg+, conditional (planning state)
# foodchat-planning-rail-phone      /foodchat                   below lg, conditional (planning state)
# foodscholar-tab-ask               /foodscholar                always
# foodscholar-tab-library           /foodscholar                always
# foodscholar-qa-input              /foodscholar                Ask tab
# foodscholar-qa-submit             /foodscholar                Ask tab
# foodscholar-qa-advanced           /foodscholar                Ask tab
# foodscholar-qa-suggestions        /foodscholar                conditional (API suggestions, idle)
# foodscholar-qa-answer             /foodscholar                AFTER AN ANSWER
# foodscholar-qa-followups          /foodscholar                AFTER AN ANSWER, conditional
# foodscholar-qa-sources            /foodscholar                AFTER AN ANSWER, xl+ (right rail)
# foodscholar-qa-sources-inline     /foodscholar                AFTER AN ANSWER, below xl
# foodscholar-library-search        /foodscholar                Library tab
# foodscholar-library-nav           /foodscholar                Library tab
# foodscholar-catalog-search        /foodscholar/catalog        always
# foodscholar-catalog-examples      /foodscholar/catalog        always
# foodscholar-catalog-filters-toggle /foodscholar/catalog       always
# foodscholar-catalog-summary       /foodscholar/catalog        AFTER A SEARCH
# foodscholar-guides-tab-catalog    /foodscholar/guides         always (the default tab)
# foodscholar-guides-tab-map        /foodscholar/guides         always
# foodscholar-guides-map            /foodscholar/guides         AFTER the Map tab is opened
# foodscholar-guides-region-list    /foodscholar/guides         AFTER the Map tab is opened
# foodscholar-guides-explorer-tabs  /foodscholar/guides/<c>     always (root holds tabs AND content:
#                                                               target `[data-flows="…"] > [role=tablist]`)
# foodscholar-article-save          /foodscholar/<id>           always (fades in when scrolled to)
# foodscholar-guide-save            /foodscholar/guides/<c>/guides/<g>  guide loaded
# foodscholar-textbook-save         /foodscholar/textbooks/<u>  textbook loaded
# foodscholar-graph-search          /foodscholar/hierarchy      when the graph is available
# recipes-search-input              /recipe-wrangler            Search tab (default)
# recipes-analyzer-tab              /recipe-wrangler            always
# recipes-analyzer-input            /recipe-wrangler            Analyze tab
# recipes-personalized-toggle       /recipe-wrangler            Search tab
# recipes-filters-button            /recipe-wrangler            Search tab
# recipes-first-card                /recipe-wrangler            once results load (they load on open)
# recipes-card-compare              /recipe-wrangler            on the first card
# recipes-card-favorite             /recipe-wrangler            on the first card
# recipes-compare-button            /recipe-wrangler            AFTER 2+ recipes are ticked
# recipes-compare-bar               /recipe-wrangler            AFTER 2+ ticked, phones only
# recipes-compare-table             /recipe-wrangler/compare    sm+ (desktop table)
# recipes-compare-table-phone       /recipe-wrangler/compare    below sm
# recipes-detail-nutriscore         /recipe-wrangler/<id>       recipe loaded
# recipes-detail-save               /recipe-wrangler/<id>       recipe loaded
# recipes-detail-nutrition          /recipe-wrangler/<id>       recipe loaded
# recipes-detail-improve            /recipe-wrangler/<id>       recipe loaded (may be disabled)
# recipes-report-problem            /recipe-wrangler/<id>       recipe loaded (appears after hydration)
# library-saved-recipes             /library                    profile selected
# library-saved-plans               /library                    profile selected
# preferences-quick-setup           /my-profile                 profile selected
# card-dietary-preferences          /my-profile                 profile selected
# card-allergies                    /my-profile                 profile selected
# card-food-likes                   /my-profile                 profile selected
# card-food-dislikes                /my-profile                 profile selected
# card-memory                       /my-profile                 profile selected
# memory-why, memory-edit           /my-profile                 conditional (memories exist)
# delete-household, delete-account  /my-profile                 profile selected
# profiles-first-member             /profiles                   at least one member
# profiles-add-member               /profiles                   always
# profiles-manage                   /profiles                   at least one member
#
#
# ══ Workflow 1 — Nutrition preferences setup (automatic) ════════════════════
#
# Scenario
# --------
#   The user is logged in, a household member profile is selected, and that
#   profile has a diet group but NO other preferences (no allergies, no food
#   likes, no food dislikes). We guide them from the dashboard to My Profile and
#   highlight each preference card so they fill it in using the EXISTING controls
#   (which already save on click — Flows does NOT store any profile data).
#
# Why a tour and not headless slots
# ---------------------------------
#   The preference editors already exist on /my-profile and persist on click via
#   householdStore.updateMemberProfile(). A tour reuses them in place; headless
#   slot components would duplicate that UI. Nutrition macro targets are
#   intentionally NOT in this tour — there is no macro-targets card on
#   /my-profile yet to anchor a step to. Add the tour step once that card exists.
#
# App-side code backing this tour
# -------------------------------
#   NOTE: the "My Profile" menu item lives inside a <UDropdownMenu> and is
#   rendered in a teleported popover only AFTER the trigger is opened, so it has
#   no stable data-flows anchor. Step 2 (below) is a WAIT/HINT step on the
#   trigger, not a click-target on the item itself.
#
#   Targeting properties, set in app/plugins/02.flows.client.ts and passed to
#   init({ userProperties }) for the SELECTED member:
#     hasDietGroup            : boolean  — member.dietary_groups is non-empty
#     nutritionProfileComplete: boolean  — member has >=1 allergy, like, OR dislike
#   These are resolved once at init from the household store. They refresh on the
#   next full load (e.g. after the user finishes and reloads), so a completed
#   profile stops matching the start target and the tour will not replay.
#
# Dashboard configuration
# -----------------------
#   Type:   Tour (built-in tour components; setupJsComponents already registers them)
#   Slot:   default tour overlay (no custom slot id needed for a tour)
#
#   START BLOCK targeting — trigger only for members who have a diet group but
#   have not added any other preference yet:
#       hasDietGroup             is  true
#       AND nutritionProfileComplete is false
#   Trigger: automatic on app load.
#
#   TOUR STEPS (in order):
#
#     Step 1 — Welcome (modal / no anchor)
#       Title:  "Let's finish your food profile"
#       Body:   "You've picked a diet. Add a few likes, dislikes and any
#                allergies so we can tailor recommendations."
#       Footer: [ Skip ]  [ Start ]
#
#     Step 2 — Open the profile menu
#       Anchor:    [data-flows="profile-dropdown-trigger"]   (in the header)
#       Placement: bottom
#       Body:      "Open your profile menu and choose 'My Profile'."
#       Wait:      User navigates to a page — /app/my-profile
#
#     Step 3 — Allergies
#       Page:      /app/my-profile
#       Anchor:    [data-flows="card-allergies"]
#       Placement: top
#       Body:      "Add anything you're allergic to or can't tolerate. Tap +."
#       Advance:   Next (manual). The card's controls save on click already.
#
#     Step 4 — Food likes
#       Page:      /app/my-profile
#       Anchor:    [data-flows="card-food-likes"]
#       Body:      "Pick a few foods you love — we'll favour them."
#
#     Step 5 — Food dislikes
#       Page:      /app/my-profile
#       Anchor:    [data-flows="card-food-dislikes"]
#       Body:      "Add foods to avoid — we'll keep them off your plate."
#
#     Step 6 — Done (modal / no anchor)
#       Body:      "Nice! Your profile is ready. You can change these anytime."
#       Footer:    [ Finish ]  → END block.
#
#   END BLOCK: marks the tour complete for this userId in Flows.
#
#
# ══ Workflow 2 — Dashboard tour ═════════════════════════════════════════════
#   Manual start block key: tour-dashboard        Frequency: every time
#   Help panel: Dashboard → "Open an app"
#
#     1  modal       "Welcome to WiseFood" — "Three apps, one profile. This
#                    takes a minute."
#     2  Page /app/dashboard   Anchor dashboard-app-foodscholar   bottom
#                    "FoodScholar answers food and nutrition questions, and
#                    shows the studies behind every answer."
#     3  Anchor dashboard-app-recipewrangler   bottom
#                    "RecipeWrangler finds recipes, leaves out your allergens
#                    and shows how healthy and green each one is."
#     4  Anchor dashboard-app-foodchat   bottom
#                    "FoodChat plans meals for your household. Just tell it
#                    what you like."
#     5  Anchor dashboard-schedule   top
#                    "Today's meals show up here once you have a plan."
#     6  Anchor profile-dropdown-trigger   bottom
#                    "Switch profile, edit your food preferences and open My
#                    Library from here."
#     7  modal       "Help is on every page: the Help button at the top (on a
#                    phone, the round button at the bottom right), or press ?."
#                    [ Finish ] → END
#
#
# ══ Workflow 3 — FoodChat: get a meal plan ══════════════════════════════════
#   Manual start block key: tour-foodchat-plan    Frequency: every time
#   Help panel: FoodChat → "Get a meal plan"
#   Needs a household and a selected profile; without them the page shows a
#   set-up card instead and the composer anchor does not exist.
#
#     1  Page /app/foodchat   Anchor foodchat-composer   top
#                    "Describe what you'd like, in your own words: 'a
#                    gluten-free week, high protein', 'dinner under 20
#                    minutes'."
#     2  Anchor foodchat-send   top
#                    "Send it when you're ready."
#                    Wait: User clicks on an element — [data-flows="foodchat-send"]
#     3  wait step   Element is on the page — [data-flows="foodchat-save-plan"]
#                    (the plan has arrived; if FoodChat asks a question first,
#                    this waits until it has been answered)
#     4  Anchor foodchat-plan   left
#                    "Your plan. Open a meal for its recipe, or use ⋮ on a meal
#                    to swap or adapt it."
#                    PHONES: the plan sits behind the Plan tab. If most
#                    evaluators use phones, insert before this step:
#                    Anchor foodchat-pane-switch "Switch to Plan to see it",
#                    Wait: User clicks on an element — that anchor.
#     5  Anchor foodchat-save-plan   bottom
#                    "Keep it in My Library."
#     6  Anchor foodchat-share-plan   bottom
#                    "Share it with anyone by link or email — no account
#                    needed to open it."
#     7  Anchor foodchat-composer   top
#                    "Want changes? Ask here: 'lighter dinners', 'no fish on
#                    Monday', 'add a dessert'." [ Finish ] → END
#
#
# ══ Workflow 4 — FoodScholar: ask a question ════════════════════════════════
#   Manual start block key: tour-foodscholar-ask  Frequency: every time
#   Help panel: FoodScholar → "Ask a question"
#
#     1  Page /app/foodscholar   Anchor foodscholar-tab-ask   bottom
#                    "Ask anything about food, nutrition or health."
#     2  Anchor foodscholar-qa-input   bottom
#                    "Type a question in your own words — or pick a suggested
#                    one under the box."
#     3  Anchor foodscholar-qa-submit   left
#                    "Ask."
#                    Wait: User clicks on an element — [data-flows="foodscholar-qa-submit"]
#     4  wait step   Element is on the page — [data-flows="foodscholar-qa-answer"]
#     5  Anchor foodscholar-qa-answer   top
#                    "The numbers in the answer are its sources. Click one to
#                    read the passage it rests on. All sources are listed next
#                    to the answer (below it on smaller screens)."
#     6  modal       "Keep going: follow-up questions appear under the answer,
#                    and 'New conversation' starts a fresh topic."
#                    [ Finish ] → END
#
#
# ══ Workflow 5 — FoodScholar: search articles ═══════════════════════════════
#   Manual start block key: tour-foodscholar-catalog   Frequency: every time
#   Help panel: Search scientific articles → "Search in plain words"
#
#     1  Page /app/foodscholar/catalog   Anchor foodscholar-catalog-search   bottom
#                    "Describe what you're looking for — no exact keywords
#                    needed."
#     2  Anchor foodscholar-catalog-examples   bottom
#                    "Or start from an example."
#     3  Anchor foodscholar-catalog-filters-toggle   bottom
#                    "Narrow the results by topic, year, study type, age group
#                    or country."
#     4  modal       "After a search, an AI summary above the results sums up
#                    what the top studies say." [ Finish ] → END
#
#
# ══ Workflow 6 — FoodScholar: dietary guides by map ═════════════════════════
#   Manual start block key: tour-foodscholar-guides    Frequency: every time
#   Help panel: Dietary guides by country → "Explore by map"
#
#     1  Page /app/foodscholar/guides   Anchor foodscholar-guides-tab-catalog   bottom
#                    "Every national dietary guide, searchable here."
#     2  Anchor foodscholar-guides-tab-map   bottom
#                    "Or explore them on a map."
#                    Wait: User clicks on an element — [data-flows="foodscholar-guides-tab-map"]
#     3  wait step   Element is on the page — [data-flows="foodscholar-guides-map"]
#     4  Anchor foodscholar-guides-map   right
#                    "Click a country to select it."
#     5  Anchor foodscholar-guides-region-list   left
#                    "…or pick it from the list, then 'Open explorer' to read
#                    its guides and filter their rules." [ Finish ] → END
#
#
# ══ Workflow 7 — RecipeWrangler: find recipes ═══════════════════════════════
#   Manual start block key: tour-recipes-search   Frequency: every time
#   Help panel: RecipeWrangler → "Search for recipes"
#
#     1  Page /app/recipe-wrangler   Anchor recipes-search-input   bottom
#                    "Say what you feel like eating: 'quick vegan dinners'."
#     2  Anchor recipes-personalized-toggle   bottom
#                    "With Personalized on, results respect this profile's diet
#                    and allergies."
#     3  Anchor recipes-filters-button   bottom
#                    "Exclude allergens, pick a diet or cuisine, or start from a
#                    quick filter."
#     4  Anchor recipes-first-card   right
#                    "Open a recipe for its Nutri-Score, environmental impact
#                    and nutrition."
#     5  Anchor recipes-card-favorite   left
#                    "The heart keeps it in My Library."
#     6  Anchor recipes-analyzer-tab   bottom
#                    "Have your own recipe? Paste it here for the same
#                    analysis." [ Finish ] → END
#
#
# ══ Workflow 8 — RecipeWrangler: compare recipes ════════════════════════════
#   Manual start block key: tour-recipes-compare  Frequency: every time
#   Help panel: RecipeWrangler → "Compare recipes"
#
#     1  Page /app/recipe-wrangler   Anchor recipes-card-compare   right
#                    "Tick this box to add a recipe to the comparison."
#                    Wait: User clicks on an element — [data-flows="recipes-card-compare"]
#     2  modal       "Now tick one to three more recipes."
#                    Wait: Element is on the page — [data-flows="recipes-compare-button"]
#     3  Anchor recipes-compare-button   bottom
#                    "Compare them side by side."
#                    Wait: User navigates to a page — /app/recipe-wrangler/compare
#     4  Page /app/recipe-wrangler/compare   modal
#                    "Each row compares one thing: Nutri-Score, time, calories
#                    and nutrients. Click a name to open the recipe."
#                    (A modal rather than an anchor: the table is
#                    recipes-compare-table on wider screens and
#                    recipes-compare-table-phone below sm.) [ Finish ] → END
#
#
# ══ Workflow 9 — A recipe up close ══════════════════════════════════════════
#   Manual start block key: tour-recipe-detail    Frequency: every time
#   Help panel: A recipe up close → "Scores at a glance" (shown only on a
#   recipe page; there is no fixed URL to send anyone to)
#
#     Page condition for every step: /app/recipe-wrangler/* (any recipe). Do
#     not let it match /app/recipe-wrangler/compare.
#     1  Anchor recipes-detail-nutriscore   bottom
#                    "Nutri-Score from A (healthiest) to E. The ? explains how
#                    it was worked out."
#     2  Anchor recipes-detail-nutrition   top
#                    "Calories and nutrients, per serving or per 100 g."
#     3  Anchor recipes-detail-improve   left
#                    "Get suggestions to make it healthier, greener or use less,
#                    and save your own version."
#     4  Anchor recipes-detail-save   bottom
#                    "Keep it in My Library."
#     5  Anchor recipes-report-problem   bottom
#                    "Something wrong with the recipe? Tell our curators."
#                    [ Finish ] → END
#
#
# ══ Workflow 10 — My profile preferences (manual) ═══════════════════════════
#   Manual start block key: tour-profile-preferences   Frequency: every time
#   Help panel: My Profile → "Quick setup"
#   Separate from workflow 1, which starts on the dashboard and is targeted.
#
#     1  Page /app/my-profile   Anchor preferences-quick-setup   bottom
#                    "The fastest way: a few questions set everything at once."
#     2  Anchor card-dietary-preferences   top
#                    "Your diet. Every app respects it."
#     3  Anchor card-allergies   top
#                    "WiseFood never suggests food that conflicts with these."
#     4  Anchor card-food-likes   top
#                    "Foods you love get favoured."
#     5  Anchor card-food-dislikes   top
#                    "…and these stay off your plate."
#     6  Anchor card-memory   top
#                    "What WiseFood has learned from your chats, with your
#                    permission. Correct or remove anything here."
#                    [ Finish ] → END
#
#
# ── Verify before publishing ──────────────────────────────────────────────────
#   - Debug panel auto-enables on localhost: Ctrl+Alt+Shift+F (Cmd+Opt+Shift+F).
#   - For each manual tour: open the page, open Help, expand the feature and
#     click "Show me". The tour must start within a couple of seconds; "This
#     walkthrough isn't ready yet" means the key, the frequency or the
#     publish state is wrong.
#   - Walk every tour once at desktop width and once at phone width; a step
#     that never appears is an anchor that is hidden at that width.
#   - Workflow 1: log in as a member with a diet group and empty preferences;
#     confirm the tour auto-starts and each anchor resolves. Add an allergy,
#     reload: confirm the tour no longer starts. A member WITHOUT a diet group
#     must not get it.
#   - Run through every step in a non-production Flows environment first.
#
echo "flows.sh is the spec for WiseFood's guided tours — configure them in app.flows.sh."
echo "Block keys must match the tour: entries in app/help/topics.ts; anchors are data-flows attributes."
