#!/usr/bin/env bash
#
# flows.sh — Nutrition preferences setup TOUR (WiseFood)
# ======================================================
#
# This is NOT an executable workflow. Flows.sh tours are authored in the Flows
# dashboard (app.flows.sh), not in code. This file is the source-of-truth spec
# for the tour: the blocks to create, the DOM anchors they attach to, the
# targeting rule, and the small amount of app code that backs it.
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
#
# ── App-side code backing this tour (already implemented in this repo) ────────
#
# 1. DOM anchors (data-flows attributes) the tour points at:
#      app/components/WHeader.vue   button[data-flows="profile-dropdown-trigger"]
#      app/pages/my-profile.vue     UCard[data-flows="card-allergies"]
#      app/pages/my-profile.vue     UCard[data-flows="card-food-likes"]
#      app/pages/my-profile.vue     UCard[data-flows="card-food-dislikes"]
#    CSS selectors for the dashboard: [data-flows="<name>"]
#
#    NOTE: the "My Profile" menu item lives inside a <UDropdownMenu> and is
#    rendered in a teleported popover only AFTER the trigger is opened, so it has
#    no stable data-flows anchor. Step 2 (below) is a WAIT/HINT step on the
#    trigger, not a click-target on the item itself. See step config.
#
# 2. Targeting properties, set in app/plugins/02.flows.client.ts and passed to
#    init({ userProperties }) for the SELECTED member:
#      hasDietGroup            : boolean  — member.dietary_groups is non-empty
#      nutritionProfileComplete: boolean  — member has >=1 allergy, like, OR dislike
#    These are resolved once at init from the household store. They refresh on the
#    next full load (e.g. after the user finishes and reloads), so a completed
#    profile stops matching the start target and the tour will not replay.
#
#
# ── Dashboard configuration (do this in app.flows.sh) ─────────────────────────
#
# Workflow: "Nutrition preferences setup"
#   Type:   Tour (built-in tour components; setupJsComponents already registers them)
#   Slot:   default tour overlay (no custom slot id needed for a tour)
#
#   START BLOCK targeting — trigger only for members who have a diet group but
#   have not added any other preference yet:
#       hasDietGroup             is  true
#       AND nutritionProfileComplete is false
#   Trigger: automatic on app load (or manual, if you prefer a "Set up profile"
#   button — see RemoteTrigger note at the bottom).
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
#       Advance:   on element click (user opens the dropdown). The dropdown's
#                  'My Profile' item routes to /my-profile via the app's
#                  onNavigate handler. Use a "wait for navigation to /my-profile"
#                  / page-match condition before showing step 3, OR set step 3 to
#                  only render on the /my-profile URL.
#
#     Step 3 — Allergies
#       Page:      /my-profile
#       Anchor:    [data-flows="card-allergies"]
#       Placement: top
#       Body:      "Add anything you're allergic to or can't tolerate. Tap +."
#       Advance:   Next (manual). The card's controls save on click already.
#
#     Step 4 — Food likes
#       Page:      /my-profile
#       Anchor:    [data-flows="card-food-likes"]
#       Body:      "Pick a few foods you love — we'll favour them."
#       Advance:   Next
#
#     Step 5 — Food dislikes
#       Page:      /my-profile
#       Anchor:    [data-flows="card-food-dislikes"]
#       Body:      "Add foods to avoid — we'll keep them off your plate."
#       Advance:   Next
#
#     Step 6 — Done (modal / no anchor)
#       Body:      "Nice! Your profile is ready. You can change these anytime."
#       Footer:    [ Finish ]  → END block.
#
#   END BLOCK: marks the tour complete for this userId in Flows.
#
#
# ── Verify before publishing ──────────────────────────────────────────────────
#   - Debug panel auto-enables on localhost: Ctrl+Alt+Shift+F (Cmd+Opt+Shift+F).
#   - Log in as a member with a diet group and empty preferences; confirm the
#     tour auto-starts and each anchor resolves (no "element not found").
#   - Add an allergy, reload: confirm nutritionProfileComplete flips to true and
#     the tour no longer starts.
#   - Walk a member WITHOUT a diet group: confirm the tour does NOT start.
#   - Run through every step in a non-production Flows environment first.
#
#
# ── Optional: manual trigger instead of auto-start ────────────────────────────
#   If you'd rather start it from a button, expose a "Set up my profile" CTA and
#   call the Flows manual-trigger for this workflow on click, keeping the same
#   start-block targeting as a guard.
#
echo "flows.sh is a spec for the 'Nutrition preferences setup' tour — configure it in app.flows.sh."
echo "See the comments in this file and the data-flows anchors in app/components/WHeader.vue and app/pages/my-profile.vue."
