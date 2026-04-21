<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <FoodscholarMicroHeader
      :show-back="true"
      back-to="/foodscholar"
      back-label="Back to FoodScholar"
      back-icon="i-lucide-arrow-left"
      brand-title="FoodScholar"
      brand-lead="Dietary guides by country."
      section-title="Guides Atlas"
      section-subtitle="Europe"
    />

    <UPage class="mx-auto max-w-[92rem] px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <UPageBody class="space-y-10">
        <UAlert
          v-if="summaryError && !landingLoading"
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="summaryError"
        />

        <section
          v-if="landingLoading"
          class="grid gap-10 xl:grid-cols-[minmax(0,1.28fr)_18rem] xl:items-start"
        >
          <div class="relative min-h-[32rem] sm:min-h-[42rem]">
            <div class="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_48%_48%,rgba(255,255,255,0.55),rgba(255,255,255,0)_66%)] dark:bg-[radial-gradient(circle_at_48%_48%,rgba(255,255,255,0.08),rgba(255,255,255,0)_66%)]" />
          </div>

          <div class="space-y-6 pt-6">
            <div class="grid grid-cols-3 gap-4 border-b border-black/10 pb-6 dark:border-white/10">
              <div
                v-for="index in 3"
                :key="`atlas-stat-${index}`"
                class="h-16 animate-pulse rounded-3xl bg-white/55 dark:bg-white/6"
              />
            </div>

            <div class="h-20 animate-pulse rounded-[2rem] bg-white/55 dark:bg-white/6" />

            <div class="space-y-2 border-t border-black/10 pt-6 dark:border-white/10">
              <div
                v-for="index in 10"
                :key="`country-loading-${index}`"
                class="h-10 animate-pulse rounded-full bg-white/55 dark:bg-white/6"
              />
            </div>
          </div>
        </section>

        <section
          v-else-if="euRegionSummaries.length"
          class="grid gap-10 xl:grid-cols-[minmax(0,1.28fr)_18rem] xl:items-start"
        >
          <div class="min-w-0">
            <EuropeGuidesMap
              v-model:selected-region-code="selectedMapRegionCode"
              :regions="euRegionSummaries"
            />
          </div>

          <aside class="xl:pt-10">
            <div class="xl:sticky xl:top-24">
              <dl class="grid grid-cols-3 gap-4 border-b border-black/10 pb-6 dark:border-white/10">
                <div>
                  <dt class="text-[0.65rem] uppercase tracking-[0.18em] text-[#7a6657] dark:text-stone-500">
                    Countries
                  </dt>
                  <dd class="mt-1 text-2xl font-semibold tracking-tight text-[#1f1a15] dark:text-white">
                    {{ euRegionSummaries.length }}
                  </dd>
                </div>

                <div>
                  <dt class="text-[0.65rem] uppercase tracking-[0.18em] text-[#7a6657] dark:text-stone-500">
                    Guides
                  </dt>
                  <dd class="mt-1 text-2xl font-semibold tracking-tight text-[#1f1a15] dark:text-white">
                    {{ totalGuideCount.toLocaleString() }}
                  </dd>
                </div>

                <div>
                  <dt class="text-[0.65rem] uppercase tracking-[0.18em] text-[#7a6657] dark:text-stone-500">
                    Rules
                  </dt>
                  <dd class="mt-1 text-2xl font-semibold tracking-tight text-[#1f1a15] dark:text-white">
                    {{ hasGuidelineCounts ? totalGuidelineCount.toLocaleString() : '—' }}
                  </dd>
                </div>
              </dl>

              <div v-if="selectedMapRegion" class="mt-8">
                <h2 class="text-3xl font-serif font-semibold tracking-tight text-[#1f1a15] dark:text-white">
                  {{ `${selectedMapRegion.flag || ''} ${selectedMapRegion.label}`.trim() }}
                </h2>

                <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#5f5146] dark:text-stone-300">
                  <span>{{ selectedMapRegion.guideCount.toLocaleString() }} guide{{ selectedMapRegion.guideCount === 1 ? '' : 's' }}</span>
                  <span v-if="selectedMapRegion.guidelineCount !== null">{{ selectedMapRegion.guidelineCount.toLocaleString() }} rule{{ selectedMapRegion.guidelineCount === 1 ? '' : 's' }}</span>
                  <span v-if="selectedMapRegion.latestPublicationYear">{{ selectedMapRegion.latestPublicationYear }}</span>
                </div>

                <div v-if="selectedMapRegion.topics.length" class="mt-5 flex flex-wrap gap-2">
                  <span
                    v-for="topic in selectedMapRegion.topics"
                    :key="`${selectedMapRegion.region}-${topic}`"
                    class="rounded-full bg-black/[0.04] px-3 py-1 text-xs font-medium text-[#4f453b] dark:bg-white/[0.07] dark:text-stone-300"
                  >
                    {{ topic }}
                  </span>
                </div>

                <NuxtLink
                  :to="buildGuidesRegionPath(selectedMapRegion.region)"
                  class="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#173f35] transition-colors hover:text-[#0d241f] dark:text-emerald-200 dark:hover:text-emerald-100"
                >
                  <span>Open explorer</span>
                  <UIcon name="i-lucide-arrow-right" class="h-4 w-4" />
                </NuxtLink>
              </div>

              <div class="mt-8 border-t border-black/10 pt-6 dark:border-white/10">
                <div class="space-y-1">
                  <button
                    v-for="region in euRegionBrowseList"
                    :key="region.region"
                    type="button"
                    :class="[
                      'flex w-full items-center justify-between gap-3 rounded-full px-3 py-2.5 text-left text-sm transition-colors',
                      selectedMapRegionCode === getRegionPresentation(region.region).value.toUpperCase()
                        ? 'bg-[#173f35]/8 text-[#173f35] dark:bg-white/10 dark:text-white'
                        : 'text-[#4f453b] hover:bg-black/[0.03] dark:text-stone-300 dark:hover:bg-white/[0.04]'
                    ]"
                    @click="selectedMapRegionCode = getRegionPresentation(region.region).value.toUpperCase()"
                  >
                    <span class="truncate font-medium">
                      {{ `${region.flag || ''} ${region.label}`.trim() }}
                    </span>
                    <span class="shrink-0 text-xs text-[#7a6657] dark:text-stone-500">
                      {{ region.guideCount }}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <div
          v-else
          class="py-24 text-center"
        >
          <UIcon name="i-lucide-map" class="mx-auto h-8 w-8 text-[#8c7a6a] dark:text-stone-500" />
          <p class="mt-4 text-sm font-medium text-[#1f1a15] dark:text-white">
            No EU country records are available yet.
          </p>
        </div>
      </UPageBody>
    </UPage>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import EuropeGuidesMap from '~/components/foodscholar/guides/EuropeGuidesMap.vue'
import catalogApi from '~/services/catalogApi'
import {
  buildGuidesRegionPath,
  buildRegionSummaries,
  getRegionPresentation
} from '~/utils/guidesCatalog'
import { euCountryCodes } from '~/utils/countries'

definePageMeta({
  middleware: ['auth', 'profile']
})

useHead({
  title: 'Dietary Guides Atlas'
})

useSeoMeta({
  description: 'Browse European dietary guides by country, source publication, and guideline rule.'
})

const EU_COUNTRY_CODE_SET = new Set<string>(euCountryCodes)

const selectedMapRegionCode = ref<string | null>(null)
const landingLoading = ref(true)
const summaryError = ref<string | null>(null)
const regionSummaries = ref<ReturnType<typeof buildRegionSummaries>>([])

const euRegionSummaries = computed(() => {
  return regionSummaries.value.filter((region) => {
    return EU_COUNTRY_CODE_SET.has(getRegionPresentation(region.region).value.toUpperCase())
  })
})

const euRegionBrowseList = computed(() => {
  return euRegionSummaries.value
    .slice()
    .sort((left, right) => left.label.localeCompare(right.label))
})

const selectedMapRegion = computed(() => {
  return euRegionSummaries.value.find((region) => {
    return getRegionPresentation(region.region).value.toUpperCase() === selectedMapRegionCode.value
  })
})

const totalGuideCount = computed(() => {
  return regionSummaries.value.reduce((sum, region) => sum + region.guideCount, 0)
})

const totalGuidelineCount = computed(() => {
  return regionSummaries.value.reduce((sum, region) => sum + (region.guidelineCount ?? 0), 0)
})

const hasGuidelineCounts = computed(() => {
  return regionSummaries.value.some(region => region.guidelineCount !== null)
})

async function loadLandingSummary() {
  landingLoading.value = true
  summaryError.value = null

  try {
    const [guideResponse, guidelineResponse] = await Promise.all([
      catalogApi.searchGuides({
        limit: 250,
        offset: 0,
        sort: 'publication_year desc',
        facet_limit: 100
      }),
      catalogApi.searchGuidelines({
        limit: 1,
        offset: 0,
        fields: ['region'],
        facet_limit: 100
      }).catch(() => ({
        guidelines: [],
        total: 0,
        facets: {} as Record<string, Array<{ value: string, count: number }>>
      }))
    ])

    regionSummaries.value = buildRegionSummaries(
      guideResponse.guides,
      guideResponse.facets.region || [],
      guidelineResponse.facets.region || []
    )
  } catch (error) {
    console.error('[GuidesCatalogLanding] Failed to load catalog summary:', error)
    summaryError.value = 'The dietary guides catalog could not be loaded right now.'
    regionSummaries.value = []
  } finally {
    landingLoading.value = false
  }
}

watch(euRegionSummaries, (regions) => {
  if (!selectedMapRegionCode.value) {
    return
  }

  if (!regions.some(region => getRegionPresentation(region.region).value.toUpperCase() === selectedMapRegionCode.value)) {
    selectedMapRegionCode.value = null
  }
})

onMounted(async () => {
  await loadLandingSummary()
})
</script>
