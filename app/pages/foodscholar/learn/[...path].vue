<template>
  <div />
</template>

<script setup lang="ts">
/**
 * FoodScholar no longer has Learn pages: everything is asked in its question
 * box. Their addresses stay so a saved link opens FoodScholar instead of a
 * "not found" page. A claim sent to the old check page is still checked.
 */
definePageMeta({
  middleware: [
    (to) => {
      const page = Array.isArray(to.params.path) ? to.params.path.join('/') : String(to.params.path ?? '')
      const query: Record<string, string> = {}
      if (page === 'check') {
        const claim = typeof to.query.claim === 'string' ? to.query.claim.trim() : ''
        if (claim) query.claim = claim
        else query.tool = 'claim'
      }
      return navigateTo({ path: '/foodscholar', query }, { replace: true })
    }
  ]
})
</script>
