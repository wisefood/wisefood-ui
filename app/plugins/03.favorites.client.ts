import { defineNuxtPlugin } from '#app'

// Load persisted favorites on startup and keep them synced with the selected
// household member. Without this the store's favorites start empty on every
// page load and hearts silently reset.
export default defineNuxtPlugin(() => {
  useRecipeStore().startFavoritesSync()
})
