<template>
  <!--
    Exactly the screen below the site header, so the search bar stays in view
    and the tree and the details scroll inside their own panels rather than
    the page growing with every branch opened. The minimum keeps a short
    screen from squeezing the tree to nothing; below it the page scrolls.
  -->
  <div class="flex h-[calc(100dvh-var(--ui-header-height))] min-h-[32rem] flex-col bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <AppPageHeader
      back-to="/foodscholar?tab=resources"
      :back-label="t('foodScholarHome.qa.tabs.library')"
      brand-title="FoodScholar"
      brand-class="text-brand-500 dark:text-brand-400"
      subtitle="Hierarchy"
    />
    <div class="flex min-h-0 flex-1 flex-col">
      <FoodscholarGraphBrowser @ask="askFromGraph" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { track } from '~/composables/useTelemetry'

const { t } = useI18n()

definePageMeta({ middleware: ['auth', 'profile'] })

useHead({ title: 'Hierarchy – FoodScholar' })

/**
 * A question raised from the graph, asked on FoodScholar.
 *
 * The graph browser ends at "this is what the evidence covers"; the answer is
 * on the QA tab. `?q=` is the bridge that page already honours for FoodChat —
 * it prefills the composer and asks once — and asking immediately rather than
 * only prefilling is the point, since the user already pressed a button that
 * said Ask.
 */
function askFromGraph(question: string) {
  const q = question?.trim()
  if (!q) return
  track('graph.ask_bridge', { length: q.length }, 'foodscholar')
  navigateTo({ path: '/foodscholar', query: { q } })
}
</script>
