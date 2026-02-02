/**
 * Profile selection middleware
 * Ensures authenticated users have selected a profile before accessing protected routes.
 * This middleware should be applied to routes that require a profile (e.g., dashboard, my-profile).
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip for public pages and the profiles page itself
  if (to.path === '/login' || to.path === '/profiles' || to.path === '/') {
    return
  }

  const householdStore = useHouseholdStore()

  // Initialize household store if not already done
  if (!householdStore.initialized) {
    await householdStore.initialize()
  }

  // If user has profiles but none selected, redirect to profile selection
  // Skip if user has no household or skipped setup
  if (householdStore.hasHousehold && householdStore.householdMembers.length > 0 && !householdStore.currentMember) {
    return navigateTo('/profiles')
  }
})
