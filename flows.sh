#!/usr/bin/env bash
#
# flows.sh — WiseFood guided tours (Flows.sh)
# ===========================================
#
# This is NOT an executable workflow. Flows.sh tours live in the Flows
# dashboard (app.flows.sh, organisation "wisefood"), not in code. This file is
# the spec for every tour: the steps, the DOM anchors they attach to, what each
# step waits for, and the English text. Hungarian and Slovenian translations
# live on each step in Flows. The tour sections below are generated from the
# same definitions that built the workflows; change both together.
#
# ── How a tour starts ─────────────────────────────────────────────────────────
#
# Automatically: "Nutrition preferences setup" (workflow ce0988c9), a start
# block with user-property targeting. See the end of this file.
#
# On request: every page has a Help panel (the "Help" button in the header on
# a desktop, the round button bottom right on a phone, or the ? key). A
# feature with a tour shows "Show me", which calls startWorkflow(<block key>)
# from @flows/js. The block key is the contract between this file and
# app/help/topics.ts (`tour:` on each feature); several features can share a
# tour. Every Help tour has frequency EVERY TIME, so the button always works.
#
# startWorkflow() resolves the same way whether or not a tour started, so the
# panel waits ~3.5 s for a new block to appear. If none does it says "This
# walkthrough isn't ready yet" and logs feature.used {feature: help, action:
# tour_unavailable, topic, item}.
#
# Flows only runs for signed-in users, guests included (02.flows.client.ts).
#
# ── Environments and languages ────────────────────────────────────────────────
#
# "production" is what the deployment uses (pim.libsonnet flows.ENVIRONMENT).
# "development" is for trying tours first: point VITE_FLOWS_ENVIRONMENT (or the
# runtime config) at it. Publish there, walk the tour, then publish to
# production.
#
# Language groups: English (default, en), Hungarian (hu, hu-HU), Slovenian
# (sl, sl-SI). 02.flows.client.ts passes the UI locale to init() and calls
# init() again when the user switches language. A step without a translation
# falls back to English. Wording follows the UI's own labels in each language
# (app/i18n/locales/*.json), informal "you" like the rest of the app.
#
# ── Rules for every workflow ──────────────────────────────────────────────────
#
# EVERY URL NEEDS THE /app PREFIX, and page conditions are regexes that allow a
#   trailing slash and a query string: ^/app/dashboard/?(\?.*)?$. Flows
#   compares pathname + search, so "equals /app/dashboard" misses
#   /app/dashboard?x=1 and the step silently never renders.
#
# ANCHORS ARE CSS SELECTORS: [data-flows="<name>"]. Flows takes the FIRST
#   match in the document. Controls rendered twice at once (desktop and phone)
#   get different names; a hidden copy earlier in the DOM wins otherwise.
#   Anchors on list items mark the first item only; a "wait for click" on a
#   name shared by every item advances on any of them (click waits check all
#   matches).
#
# LET THE USER DO THE THING. When a step asks for a click or a page, it waits
#   for it and has no Next. A step after a wait has no Back. Async results
#   (a plan, an answer, suggestions) get a wait step on the element they
#   create. Tours that need something to exist first (a plan, an answer) start
#   with a step that waits for it, which skips itself when it is already there.
#
# INSIDE APP DIALOGS, NO NEXT BUTTONS. An open UModal / UDropdownMenu makes
#   <body> pointer-events:none (flows.css opts the tooltip back in) and closes
#   on any click outside it, a tour button included. Steps inside dialogs move
#   on by what the user does there; a closing modal step is fine.
#
# A TARGET THAT MAY NOT EXIST STALLS THE TOUR silently. Data-dependent
#   elements are mentioned in text, not pointed at.
#
# CONSECUTIVE TOOLTIPS: @flows/js-components keys tour steps by their tour,
#   so two Tooltip steps in a row reuse one element whose target is resolved
#   only on connect. 02.flows.client.ts strips tourBlockId so every step mounts
#   fresh. Do not remove that without re-testing a multi-step tour.
#
# ── Verify before publishing to production ────────────────────────────────────
#   - Publish to development and point a local or test build at it.
#   - For each Help tour: open the page, Help, the feature, "Show me". The
#     tour must start within a couple of seconds.
#   - Walk interactive tours to the end (FoodChat plan/adapt, FoodScholar
#     ask/sources, recipe improve/servings, analyzer): their steps wait on
#     real results.
#   - Desktop and phone width; switch language to hu and sl once.
#
# ══ Dashboard tour ════════════════════════════════════════════════════════
#   Block key: tour-dashboard    Help: Dashboard
#
#    1  modal
#       page: ^/app/dashboard/?(\?.*)?$
#       “Welcome to WiseFood” — Three apps, one profile. This takes a minute.
#    2  tooltip on [data-flows="dashboard-app-foodscholar"] (bottom)
#       page: ^/app/dashboard/?(\?.*)?$
#       “FoodScholar” — Ask about food and nutrition, and see the studies behind every answer.
#    3  tooltip on [data-flows="dashboard-app-recipewrangler"] (bottom)
#       page: ^/app/dashboard/?(\?.*)?$
#       “RecipeWrangler” — Find recipes without your allergens, and see how healthy and green each one is.
#    4  tooltip on [data-flows="dashboard-app-foodchat"] (bottom)
#       page: ^/app/dashboard/?(\?.*)?$
#       “FoodChat” — Get a day or a week of meals for your household. Just say what you like.
#    5  tooltip on [data-flows="dashboard-schedule"] (top)
#       page: ^/app/dashboard/?(\?.*)?$
#       “Today's meals” — Once you have a plan, today's meals show up here.
#    6  tooltip on [data-flows="profile-dropdown-trigger"] (bottom)
#       page: ^/app/dashboard/?(\?.*)?$
#       “Your profile menu” — Switch profile, edit your food preferences and open My Library.
#    7  modal
#       page: ^/app/dashboard/?(\?.*)?$
#       “Help is on every page” — Use Help at the top (on a phone, the round button bottom right) or press ?. Most topics have a Show me button like this one.
#
# ══ Guest account ═════════════════════════════════════════════════════════
#   Block key: tour-guest    Help: You are trying WiseFood as a guest
#
#    1  tooltip on [data-flows="guest-keep-account"] (bottom)
#       page: ^/app/
#       “Keep what you made” — As a guest your data is temporary. Keep my account turns it into a real account, and nothing is lost.
#    2  tooltip on [data-flows="guest-erase"] (bottom)
#       page: ^/app/
#       “Leaving?” — Erase my data now deletes your guest data straight away.
#
# ══ FoodChat: get a meal plan ═════════════════════════════════════════════
#   Block key: tour-foodchat-plan    Help: FoodChat → Get a meal plan
#
#    1  tooltip on [data-flows="foodchat-composer"] (top)
#       page: ^/app/foodchat/?(\?.*)?$
#       “Say what you'd like” — In your own words: “a gluten-free week, high protein” or “dinner under 20 minutes”. On a new chat you can also tap Plan my day or Plan my week.
#    2  tooltip on [data-flows="foodchat-send"] (top)
#       page: ^/app/foodchat/?(\?.*)?$
#       waits until [data-flows="foodchat-send"] .animate-spin is on the page
#       “Send it” — Press Enter or the arrow. The tour carries on when your plan arrives.
#    3  wait step   waits until [data-flows="foodchat-plan-ready"] is on the page
#    4  tooltip on [data-flows="foodchat-plan"] (left)
#       page: ^/app/foodchat/?(\?.*)?$
#       “Your plan” — A day plan lists the meals; a week plan has a row per day. Open a meal for its recipe, or use ⋮ to swap or adapt it.
#    5  tooltip on [data-flows="foodchat-save-plan"] (bottom)
#       page: ^/app/foodchat/?(\?.*)?$
#       “Save this plan” — Keeps it in My Library.
#    6  tooltip on [data-flows="foodchat-share-plan"] (bottom)
#       page: ^/app/foodchat/?(\?.*)?$
#       “Share it” — Send a link or an email. No account is needed to open it.
#    7  tooltip on [data-flows="foodchat-composer"] (top)
#       page: ^/app/foodchat/?(\?.*)?$
#       “Want changes?” — Just ask: “lighter dinners”, “no fish on Monday”, “add a dessert”.
#
# ══ FoodChat: adapt or swap a meal ════════════════════════════════════════
#   Block key: tour-foodchat-adapt    Help: FoodChat → Adapt a recipe / change the plan
#
#    1  tooltip on [data-flows="foodchat-composer"] (top)
#       page: ^/app/foodchat/?(\?.*)?$
#       waits until [data-flows="foodchat-plan-ready"] is on the page
#       “First, a plan” — Ask for one, for example “Plan my day”. The tour carries on once it is here.
#    2  tooltip on [data-flows="foodchat-meal-menu"] (left)
#       page: ^/app/foodchat/?(\?.*)?$
#       waits for a click on [data-flows="foodchat-meal-menu"]
#       “Open a meal's menu” — Every meal has a ⋮ menu. Open one.
#    3  tooltip on [data-flows="foodchat-meal-adapt"] (right)
#       page: (any page)
#       waits for a click on [data-flows="foodchat-meal-adapt"]
#       “Adapt recipe” — Choose Adapt recipe to make this meal healthier. (Replace… swaps it for something else through the chat.)
#    4  wait step   waits until [data-flows="foodchat-adapt-save"] is on the page
#    5  tooltip on [data-flows="foodchat-adapt-save"] (left)
#       page: (any page)
#       waits for a click on [data-flows="foodchat-adapt-save"]
#       “Pick a version” — Each suggestion says what changes and why. Save the one you like.
#    6  modal
#       page: ^/app/foodchat/?(\?.*)?$
#       “Saved” — Your plan uses this version from its next update. For anything else, just ask in the chat.
#
# ══ FoodChat: plan actions ════════════════════════════════════════════════
#   Block key: tour-foodchat-tools    Help: FoodChat → Summaries, totals and a shopping list
#
#    1  tooltip on [data-flows="foodchat-composer"] (top)
#       page: ^/app/foodchat/?(\?.*)?$
#       waits until [data-flows="foodchat-plan-ready"] is on the page
#       “First, a plan” — Ask for one, for example “Plan my day”. The tour carries on once it is here.
#    2  tooltip on [data-flows="foodchat-plan-tools"] (bottom)
#       page: ^/app/foodchat/?(\?.*)?$
#       waits for a click on [data-flows="foodchat-plan-tools"]
#       “Actions” — One-click answers about your plan. Open Actions.
#    3  tooltip on [data-flows^="foodchat-tool-"] (right)
#       page: (any page)
#       waits for a click on [data-flows^="foodchat-tool-"]
#       “Pick one” — What to buy makes a shopping list; the summary and the totals explain the plan.
#    4  wait step   waits until [data-flows="foodchat-tool-result"] is on the page
#    5  tooltip on [data-flows="foodchat-tool-result"] (bottom)
#       page: ^/app/foodchat/?(\?.*)?$
#       “Your answer” — It stays above the plan until you close it with ×. In a week plan, each day has its own menu to summarise or replace that day.
#
# ══ FoodChat: plan settings ═══════════════════════════════════════════════
#   Block key: tour-foodchat-settings    Help: FoodChat → Plan settings
#
#    1  tooltip on [data-flows="foodchat-composer"] (top)
#       page: ^/app/foodchat/?(\?.*)?$
#       waits until [data-flows="foodchat-plan-ready"] is on the page
#       “First, a plan” — Ask for one, for example “Plan my day”. The tour carries on once it is here.
#    2  tooltip on [data-flows="foodchat-plan-settings"] (bottom)
#       page: ^/app/foodchat/?(\?.*)?$
#       waits for a click on [data-flows="foodchat-plan-settings"]
#       “Plan settings” — Open the settings of this plan.
#    3  tooltip on [data-flows="foodchat-plan-settings-panel"] (bottom)
#       page: (any page)
#       “Tune the plan” — Cooking time, effort, goal, food waste and repeated meals. Each change updates the plan straight away.
#
# ══ FoodScholar: ask a question ═══════════════════════════════════════════
#   Block key: tour-foodscholar-ask    Help: FoodScholar → Ask a question
#
#    1  tooltip on [data-flows="foodscholar-tab-ask"] (bottom)
#       page: ^/app/foodscholar/?(\?.*)?$
#       “Ask FoodScholar” — Anything about food, nutrition or health. Answers come from studies and official guidelines.
#    2  tooltip on [data-flows="foodscholar-qa-input"] (bottom)
#       page: ^/app/foodscholar/?(\?.*)?$
#       “Your question” — Type it in your own words, or pick a suggestion under the box.
#    3  tooltip on [data-flows="foodscholar-qa-submit"] (left)
#       page: ^/app/foodscholar/?(\?.*)?$
#       waits until [data-flows="foodscholar-qa-submit"]:disabled is on the page
#       “Ask” — Press Enter or the arrow. An answer takes a few seconds.
#    4  wait step   waits until [data-flows="foodscholar-qa-answer"] is on the page
#    5  tooltip on [data-flows="foodscholar-qa-answer"] a[data-citation-urn] (top)
#       page: ^/app/foodscholar/?(\?.*)?$
#       waits until [data-flows="foodscholar-qa-passage-peek"], [data-flows="foodscholar-qa-guideline-peek"] is on the page
#       “See the evidence” — The names in the answer are its sources. Point at one (tap it on a phone) to read the passage it rests on.
#    6  modal
#       page: ^/app/foodscholar/?(\?.*)?$
#       “That's the passage” — The highlighted words are exactly what the answer used. Open article takes you to the whole study, and every source is listed next to the answer.
#    7  tooltip on [data-flows="foodscholar-qa-new-thread"] (bottom)
#       page: ^/app/foodscholar/?(\?.*)?$
#       “Keep going” — Ask a follow-up, tell us under the answer whether it helped, or start a New conversation for a new topic.
#
# ══ FoodScholar: check the sources ════════════════════════════════════════
#   Block key: tour-foodscholar-sources    Help: FoodScholar → Check the sources
#
#    1  tooltip on [data-flows="foodscholar-qa-input"] (bottom)
#       page: ^/app/foodscholar/?(\?.*)?$
#       waits until [data-flows="foodscholar-qa-answer"] a[data-citation-urn] is on the page
#       “Start with a question” — Ask anything, for example “Is coffee good for the heart?”. The tour carries on when the answer arrives.
#    2  tooltip on [data-flows="foodscholar-qa-answer"] a[data-citation-urn] (top)
#       page: ^/app/foodscholar/?(\?.*)?$
#       waits until [data-flows="foodscholar-qa-passage-peek"], [data-flows="foodscholar-qa-guideline-peek"] is on the page
#       “See the evidence” — The names in the answer are its sources. Point at one (tap it on a phone) to read the passage it rests on.
#    3  modal
#       page: ^/app/foodscholar/?(\?.*)?$
#       “That's the passage” — The highlighted words are exactly what the answer used. Open article takes you to the whole study, and every source is listed next to the answer.
#    4  tooltip on [data-flows="foodscholar-qa-new-thread"] (bottom)
#       page: ^/app/foodscholar/?(\?.*)?$
#       “Keep going” — Ask a follow-up, tell us under the answer whether it helped, or start a New conversation for a new topic.
#
# ══ FoodScholar: advanced settings ════════════════════════════════════════
#   Block key: tour-foodscholar-advanced    Help: FoodScholar → Advanced settings
#
#    1  tooltip on [data-flows="foodscholar-qa-advanced"] (bottom)
#       page: ^/app/foodscholar/?(\?.*)?$
#       waits until [data-flows="foodscholar-qa-advanced-panel"] is on the page
#       “Advanced settings” — For researchers and professionals. Open this menu and tick Advanced.
#    2  tooltip on [data-flows="foodscholar-qa-advanced-panel"] (bottom)
#       page: ^/app/foodscholar/?(\?.*)?$
#       “Choose how it researches” — Pick the method, the model, how many sources to read and how answers are explained. Your next question uses these.
#
# ══ FoodScholar: the library ══════════════════════════════════════════════
#   Block key: tour-foodscholar-library    Help: FoodScholar → Browse the library
#
#    1  tooltip on [data-flows="foodscholar-tab-library"] (bottom)
#       page: ^/app/foodscholar/?(\?.*)?$
#       waits for a click on [data-flows="foodscholar-tab-library"]
#       “The library” — Search articles, dietary guides and textbooks directly. Open the Library tab.
#    2  tooltip on [data-flows="foodscholar-library-search"] (bottom)
#       page: ^/app/foodscholar/?(\?.*)?$
#       “Search everything” — Type a topic and press Enter.
#    3  tooltip on [data-flows="foodscholar-library-nav"] (top)
#       page: ^/app/foodscholar/?(\?.*)?$
#       “Or browse a section” — Scientific articles, national dietary guides, textbooks and the knowledge hierarchy.
#
# ══ FoodScholar: search articles ══════════════════════════════════════════
#   Block key: tour-foodscholar-catalog    Help: Search scientific articles
#
#    1  tooltip on [data-flows="foodscholar-catalog-search"] (bottom)
#       page: ^/app/foodscholar/catalog/?(\?.*)?$
#       waits until [data-flows="foodscholar-catalog-summary"] is on the page
#       “Search in plain words” — Describe the topic, for example “gut health and probiotics”, or pick an example below. Press Enter.
#    2  wait step   waits until [data-flows="foodscholar-catalog-summary"] .answer-reveal-ltr is on the page
#    3  tooltip on [data-flows="foodscholar-catalog-summary"] (bottom)
#       page: ^/app/foodscholar/catalog/?(\?.*)?$
#       “AI summary” — What the top studies say, in a few lines. Click it to read more and to search related topics.
#    4  tooltip on [data-flows="foodscholar-catalog-first-result"] (right)
#       page: ^/app/foodscholar/catalog/?(\?.*)?$
#       “Open a study” — Each card shows the journal, year and study type. Open one for a plain-language version.
#    5  tooltip on [data-flows="foodscholar-catalog-filters-toggle"] (bottom)
#       page: ^/app/foodscholar/catalog/?(\?.*)?$
#       waits for a click on [data-flows="foodscholar-catalog-filters-toggle"]
#       “Narrow it down” — Show Filters lets you pick a topic, year, study type, age group or country.
#    6  tooltip on [data-flows="foodscholar-catalog-filters-panel"] (right)
#       page: (any page)
#       “Pick filters” — The list updates straight away. Reset All Filters starts again.
#
# ══ FoodScholar: dietary guides by map ════════════════════════════════════
#   Block key: tour-foodscholar-guides    Help: Dietary guides by country → Explore by map
#
#    1  tooltip on [data-flows="foodscholar-guides-tab-catalog"] (bottom)
#       page: ^/app/foodscholar/guides/?(\?.*)?$
#       “Dietary guides” — Every national dietary guide, searchable here.
#    2  tooltip on [data-flows="foodscholar-guides-tab-map"] (bottom)
#       page: ^/app/foodscholar/guides/?(\?.*)?$
#       waits for a click on [data-flows="foodscholar-guides-tab-map"]
#       “Explore on a map” — Open the map.
#    3  wait step   waits until [data-flows="foodscholar-guides-map"] is on the page
#    4  tooltip on [data-flows="foodscholar-guides-map"] (right)
#       page: ^/app/foodscholar/guides/?(\?.*)?$
#       “Pick a country” — Click a country to select it.
#    5  tooltip on [data-flows="foodscholar-guides-region-list"] (left)
#       page: ^/app/foodscholar/guides/?(\?.*)?$
#       “Or use the list” — Pick it from the list, then Open explorer to read its guides and filter their rules.
#
# ══ FoodScholar: a country's rules ════════════════════════════════════════
#   Block key: tour-foodscholar-explorer    Help: Dietary guides by country → Filter a country's rules
#
#    1  modal
#       page: ^/app/foodscholar/guides(/|\?|$)
#       waits until [data-flows="foodscholar-guides-explorer-tabs"] is on the page
#       “Open a country first” — Pick a country on the map or in the list, then Open explorer. The tour carries on there.
#    2  tooltip on [data-flows="foodscholar-guides-explorer-tabs"] [id$="-trigger-guidelines"] (bottom)
#       page: ^/app/foodscholar/guides/[^/?]+/?(\?.*)?$
#       waits for a click on [data-flows="foodscholar-guides-explorer-tabs"] [id$="-trigger-guidelines"]
#       “The rules” — This tab lists every rule from this country's guides. Open it.
#    3  tooltip on [data-flows="foodscholar-guideline-filters"] (bottom)
#       page: ^/app/foodscholar/guides/[^/?]+/?(\?.*)?$
#       “Filter the rules” — By topic, audience, source guide or year.
#    4  tooltip on [data-flows="foodscholar-guideline-facets"] (right)
#       page: ^/app/foodscholar/guides/[^/?]+/?(\?.*)?$
#       “Narrow further” — By life stage, food group or nutrient, or the age a rule applies at. Clear filters starts again.
#
# ══ FoodScholar: textbooks ════════════════════════════════════════════════
#   Block key: tour-foodscholar-textbooks    Help: Textbooks → Find a textbook
#
#    1  tooltip on [data-flows="foodscholar-textbooks-search"] (bottom)
#       page: ^/app/foodscholar/textbooks/?(\?.*)?$
#       “Find a textbook” — Search by title, author or topic.
#    2  tooltip on [data-flows="foodscholar-textbooks-filters-toggle"] (bottom)
#       page: ^/app/foodscholar/textbooks/?(\?.*)?$
#       “Filters” — Filter by language, audience or region.
#    3  tooltip on [data-flows="foodscholar-textbooks-first-card"] (right)
#       page: ^/app/foodscholar/textbooks/?(\?.*)?$
#       waits for navigation to ^/app/foodscholar/textbooks/[^/?]+/?(\?.*)?$
#       “Look inside” — Open a textbook.
#    4  tooltip on [data-flows="foodscholar-textbook-save"] (bottom)
#       page: ^/app/foodscholar/textbooks/[^/?]+/?(\?.*)?$
#       “Excerpts, PDF, save” — The excerpts show what's inside, and the PDF gets you the whole book. Save keeps it in My Library.
#
# ══ FoodScholar: knowledge hierarchy ══════════════════════════════════════
#   Block key: tour-foodscholar-hierarchy    Help: Knowledge hierarchy
#
#    1  tooltip on [data-flows="foodscholar-graph-search"] (bottom)
#       page: ^/app/foodscholar/hierarchy/?(\?.*)?$
#       “Search the hierarchy” — Jump straight to a food, a nutrient or a health topic.
#    2  tooltip on [data-flows="foodscholar-graph-tree"] [role="treeitem"] (right)
#       page: ^/app/foodscholar/hierarchy/?(\?.*)?$
#       waits for a click on [data-flows="foodscholar-graph-tree"] [role="treeitem"]
#       “Or browse” — Click any row to see what is known about it.
#    3  tooltip on [data-flows="foodscholar-graph-scope"] (bottom)
#       page: ^/app/foodscholar/hierarchy/?(\?.*)?$
#       “Focus, ask, check” — Narrow to this shows only what sits under it, Ask about this sends a question to FoodScholar, and Source passages show the evidence.
#
# ══ RecipeWrangler: find recipes ══════════════════════════════════════════
#   Block key: tour-recipes-search    Help: RecipeWrangler → Search for recipes
#
#    1  tooltip on [data-flows="recipes-search-input"] (bottom)
#       page: ^/app/recipe-wrangler/?(\?.*)?$
#       “Search recipes” — Say what you feel like eating: “quick vegan dinners”.
#    2  tooltip on [data-flows="recipes-personalized-toggle"] (bottom)
#       page: ^/app/recipe-wrangler/?(\?.*)?$
#       “Personalized” — When it's on, results respect this profile's diet and allergies.
#    3  tooltip on [data-flows="recipes-filters-button"] (bottom)
#       page: ^/app/recipe-wrangler/?(\?.*)?$
#       “Filters” — Leave out allergens, pick a diet or cuisine, or start from a quick filter.
#    4  tooltip on [data-flows="recipes-first-card"] (right)
#       page: ^/app/recipe-wrangler/?(\?.*)?$
#       “Open a recipe” — For its Nutri-Score, environmental impact and nutrition.
#    5  tooltip on [data-flows="recipes-card-favorite"] (left)
#       page: ^/app/recipe-wrangler/?(\?.*)?$
#       “Keep the ones you like” — The heart keeps a recipe in My Library.
#    6  tooltip on [data-flows="recipes-analyzer-tab"] (bottom)
#       page: ^/app/recipe-wrangler/?(\?.*)?$
#       “Got your own recipe?” — Paste it under Analyze Recipe for the same analysis.
#
# ══ RecipeWrangler: analyse your own recipe ═══════════════════════════════
#   Block key: tour-recipes-analyze    Help: RecipeWrangler → Analyse your own recipe
#
#    1  tooltip on [data-flows="recipes-analyzer-tab"] (bottom)
#       page: ^/app/recipe-wrangler/?(\?.*)?$
#       waits for a click on [data-flows="recipes-analyzer-tab"]
#       “Analyse your own recipe” — Open Analyze Recipe.
#    2  tooltip on [data-flows="recipes-analyzer-input"] (bottom)
#       page: ^/app/recipe-wrangler/?(\?.*)?$
#       “Paste it” — Ingredients with amounts work best. Paste the text, not a link.
#    3  tooltip on [data-flows="recipes-analyzer-region"] (bottom)
#       page: ^/app/recipe-wrangler/?(\?.*)?$
#       “Your region” — Nutrition and prices come from the food tables of the region you pick.
#    4  tooltip on [data-flows="recipes-analyzer-analyze"] (bottom)
#       page: ^/app/recipe-wrangler/?(\?.*)?$
#       waits until [data-flows="recipes-analyzer-analyze"] .animate-spin is on the page
#       “Analyze” — Click Analyze Recipe.
#    5  wait step   waits until [data-flows="recipes-analyzer-analyze"] .animate-spin is gone
#    6  tooltip on [data-flows="recipes-analyzer-results"] (top)
#       page: ^/app/recipe-wrangler/?(\?.*)?$
#       “Your results” — Nutrition, Nutri-Score, CO₂ and cost: the same analysis every recipe gets.
#
# ══ RecipeWrangler: sources ═══════════════════════════════════════════════
#   Block key: tour-recipes-sources    Help: RecipeWrangler → Where the recipes and numbers come from
#
#    1  tooltip on [data-flows="recipes-collections-first-card"] (top)
#       page: ^/app/recipe-wrangler/?(\?.*)?$
#       “Where recipes come from” — Every recipe comes from a published collection. Open one to see its source and contents.
#    2  tooltip on [data-flows="recipes-fctables-first-card"] (top)
#       page: ^/app/recipe-wrangler/?(\?.*)?$
#       “Where the numbers come from” — Nutrition values come from national food composition tables.
#
# ══ RecipeWrangler: compare recipes ═══════════════════════════════════════
#   Block key: tour-recipes-compare    Help: RecipeWrangler → Compare recipes
#
#    1  tooltip on [data-flows="recipes-card-compare"] (right)
#       page: ^/app/recipe-wrangler/?(\?.*)?$
#       waits for a click on [data-flows="recipes-card-compare"]
#       “Compare recipes” — Tick this box to add a recipe to the comparison.
#    2  modal
#       page: ^/app/recipe-wrangler/?(\?.*)?$
#       waits until [data-flows="recipes-compare-button"] is on the page
#       “Pick a few more” — Tick one to three more recipes.
#    3  tooltip on [data-flows="recipes-compare-button"] (bottom)
#       page: ^/app/recipe-wrangler/?(\?.*)?$
#       waits for navigation to ^/app/recipe-wrangler/compare/?(\?.*)?$
#       “Compare them” — See them side by side.
#    4  modal
#       page: ^/app/recipe-wrangler/compare/?(\?.*)?$
#       “Side by side” — Each row compares one thing: Nutri-Score, time, calories and nutrients. Clear All starts over.
#
# ══ RecipeWrangler: the comparison ════════════════════════════════════════
#   Block key: tour-recipes-compare-page    Help: Comparing recipes
#
#    1  modal
#       page: ^/app/recipe-wrangler/compare/?(\?.*)?$
#       “Side by side” — Each row compares one thing: Nutri-Score, time, servings, calories and nutrients. Open a recipe from its column.
#    2  tooltip on [data-flows="recipes-compare-clear-all"] (bottom)
#       page: ^/app/recipe-wrangler/compare/?(\?.*)?$
#       “Start over” — Clear All empties the comparison. To add others, go back and tick them.
#
# ══ A recipe up close ═════════════════════════════════════════════════════
#   Block key: tour-recipe-detail    Help: A recipe up close → Scores at a glance
#
#    1  tooltip on [data-flows="recipes-detail-nutriscore"] (bottom)
#       page: ^/app/recipe-wrangler/(?!(?:compare|collections|fctables)(?:[/?]|$))[^/?]+/?(\?.*)?$
#       “Nutri-Score” — From A (healthiest) to E. The ? explains how it was worked out.
#    2  tooltip on [data-flows="recipes-detail-nutrition"] (top)
#       page: ^/app/recipe-wrangler/(?!(?:compare|collections|fctables)(?:[/?]|$))[^/?]+/?(\?.*)?$
#       “Nutrition” — Calories and nutrients, per serving or per 100 g.
#    3  tooltip on [data-flows="recipes-detail-improve"] (left)
#       page: ^/app/recipe-wrangler/(?!(?:compare|collections|fctables)(?:[/?]|$))[^/?]+/?(\?.*)?$
#       “Make it better” — Improve suggests healthier, greener or smaller versions you can save.
#    4  tooltip on [data-flows="recipes-detail-save"] (bottom)
#       page: ^/app/recipe-wrangler/(?!(?:compare|collections|fctables)(?:[/?]|$))[^/?]+/?(\?.*)?$
#       “Save it” — Keeps the recipe in My Library.
#    5  tooltip on [data-flows="recipes-report-problem"] (bottom)
#       page: ^/app/recipe-wrangler/(?!(?:compare|collections|fctables)(?:[/?]|$))[^/?]+/?(\?.*)?$
#       “Something wrong?” — Tell our curators about wrong allergens, odd amounts or steps that don't work.
#
# ══ Recipe: make it better ════════════════════════════════════════════════
#   Block key: tour-recipe-improve    Help: A recipe up close → Make it healthier or greener
#
#    1  tooltip on [data-flows="recipes-detail-improve"] (left)
#       page: ^/app/recipe-wrangler/(?!(?:compare|collections|fctables)(?:[/?]|$))[^/?]+/?(\?.*)?$
#       waits for a click on [data-flows="recipes-detail-improve"]
#       “Make it better” — Click Improve for concrete swaps: healthier, greener, or using less.
#    2  wait step   waits until [data-flows="recipes-adapt-results"] is on the page
#    3  tooltip on [data-flows="recipes-adapt-save"] (left)
#       page: (any page)
#       waits for a click on [data-flows="recipes-adapt-save"]
#       “Pick a version” — Each suggestion shows the swap and how the numbers change. Try Sustainability or Use less above, then save the one you like.
#    4  modal
#       page: ^/app/recipe-wrangler/(?!(?:compare|collections|fctables)(?:[/?]|$))[^/?]+/?(\?.*)?$
#       “Saved” — Your version now shows next to the ingredients.
#
# ══ Recipe: servings and substitutes ══════════════════════════════════════
#   Block key: tour-recipe-servings    Help: A recipe up close → Servings and substitutes
#
#    1  tooltip on [data-flows="recipes-detail-servings"] (bottom)
#       page: ^/app/recipe-wrangler/(?!(?:compare|collections|fctables)(?:[/?]|$))[^/?]+/?(\?.*)?$
#       “Cooking for more or fewer?” — Use + and −; every amount updates.
#    2  tooltip on [data-flows="recipes-detail-substitute"] (left)
#       page: ^/app/recipe-wrangler/(?!(?:compare|collections|fctables)(?:[/?]|$))[^/?]+/?(\?.*)?$
#       waits for a click on [data-flows="recipes-detail-substitute"]
#       “Missing something?” — Click the swap icon next to an ingredient to find a substitute.
#    3  wait step   waits until [data-flows="recipes-substitute-result"] is on the page
#    4  modal
#       page: ^/app/recipe-wrangler/(?!(?:compare|collections|fctables)(?:[/?]|$))[^/?]+/?(\?.*)?$
#       “Your substitute” — The best match and what it changes in the nutrition, with other options below.
#
# ══ My Library ════════════════════════════════════════════════════════════
#   Block key: tour-library    Help: My Library
#
#    1  tooltip on [data-flows="library-saved-recipes"] (top)
#       page: ^/app/library/?(\?.*)?$
#       “Everything you saved” — Recipes, articles, guides and textbooks, grouped by type. Saved items belong to the profile in use.
#    2  tooltip on [data-flows="library-saved-plans"] (top)
#       page: ^/app/library/?(\?.*)?$
#       “Saved meal plans” — Plans you kept in FoodChat. Open in FoodChat carries on with one.
#
# ══ My profile preferences ════════════════════════════════════════════════
#   Block key: tour-profile-preferences    Help: My Profile → Quick setup
#
#    1  tooltip on [data-flows="preferences-quick-setup"] (bottom)
#       page: ^/app/my-profile/?(\?.*)?$
#       “Quick setup” — The fastest way: a few questions set everything at once.
#    2  tooltip on [data-flows="card-dietary-preferences"] (top)
#       page: ^/app/my-profile/?(\?.*)?$
#       “Your diet” — Every app respects it.
#    3  tooltip on [data-flows="card-allergies"] (top)
#       page: ^/app/my-profile/?(\?.*)?$
#       “Allergies” — WiseFood never suggests food that conflicts with these.
#    4  tooltip on [data-flows="card-food-likes"] (top)
#       page: ^/app/my-profile/?(\?.*)?$
#       “Foods you love” — These get favoured.
#    5  tooltip on [data-flows="card-food-dislikes"] (top)
#       page: ^/app/my-profile/?(\?.*)?$
#       “Foods to avoid” — …and these stay off your plate.
#    6  tooltip on [data-flows="card-memory"] (top)
#       page: ^/app/my-profile/?(\?.*)?$
#       “What WiseFood remembers” — What it learned from your chats, with your permission. Correct or remove anything.
#
# ══ My profile: memory and privacy ════════════════════════════════════════
#   Block key: tour-profile-privacy    Help: My Profile → Memory, details and privacy
#
#    1  tooltip on [data-flows="card-profile-details"] (top)
#       page: ^/app/my-profile/?(\?.*)?$
#       “Profile details” — Name, age group and picture. Edit changes them.
#    2  tooltip on [data-flows="card-memory"] (top)
#       page: ^/app/my-profile/?(\?.*)?$
#       “What WiseFood remembers” — Things you allowed it to remember in a chat. ? shows why, the pencil corrects, Forget this deletes.
#    3  tooltip on [data-flows="card-privacy"] (top)
#       page: ^/app/my-profile/?(\?.*)?$
#       “Privacy & Data” — You decide what is collected. Switch Help improve WiseFood on or off any time.
#    4  tooltip on [data-flows="card-danger-zone"] (top)
#       page: ^/app/my-profile/?(\?.*)?$
#       “Danger Zone” — Delete a profile, the household or your whole account. This cannot be undone.
#    5  tooltip on [data-flows="card-data-kept"] (top)
#       page: ^/app/my-profile/?(\?.*)?$
#       “What WiseFood keeps” — The full list of what is stored, and why.
#
# ══ Profiles in your household ════════════════════════════════════════════
#   Block key: tour-profiles    Help: Profiles in your household
#
#    1  tooltip on [data-flows="profiles-first-member"] (bottom)
#       page: ^/app/profiles/?(\?.*)?$
#       “Choose who's eating” — Everything you do next is for this person: their diet, allergies and saved items.
#    2  tooltip on [data-flows="profiles-add-member"] (bottom)
#       page: ^/app/profiles/?(\?.*)?$
#       “Add someone” — A profile for each person you plan meals for. Set their diet and allergies afterwards on My Profile.
#    3  tooltip on [data-flows="profiles-manage"] (bottom)
#       page: ^/app/profiles/?(\?.*)?$
#       “Manage” — Remove profiles you no longer need. Switch later from your picture at the top right.
#
# ══ Nutrition preferences setup (automatic) ═════════════════════════════════
#   Workflow ce0988c9. Start block: hasDietGroup = true AND
#   nutritionProfileComplete = false (both set in 02.flows.client.ts for the
#   selected member at init). Tour trigger: navigation to the dashboard.
#   Frequency ONCE; "when the session ends" keeps progress.
#
#    1  modal (dashboard)        “Let's finish your food profile” [Start] [Skip]
#    2  tooltip on [data-flows="profile-dropdown-trigger"], any page but My Profile
#       waits for a click on it   “Open your profile menu”
#    3  wait step                 navigation to /app/my-profile
#    4  tooltip on [data-flows="card-allergies"] (My Profile)     “Allergies”
#    5  tooltip on [data-flows="card-food-likes"] (My Profile)    “Foods you love”
#    6  tooltip on [data-flows="card-food-dislikes"] (My Profile) “Foods to avoid”
#    7  modal (My Profile)        “Your profile is ready” [Finish]
#
echo "flows.sh is the spec for WiseFood's guided tours — they live in app.flows.sh."
echo "Block keys must match the tour: entries in app/help/topics.ts; anchors are data-flows attributes."
