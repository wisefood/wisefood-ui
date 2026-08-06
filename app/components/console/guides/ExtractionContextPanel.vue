<template>
  <UCard
    v-if="context || documentProfile || pageSummaries.length"
    :ui="{ body: 'p-5 sm:p-6', header: 'p-5 sm:px-6' }"
    class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
            Extraction context
          </h3>
          <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
            What the pipeline understood this document to be. Every rule it extracted inherited this.
          </p>
        </div>
        <UBadge
          :color="schemaVersion >= 2 ? 'success' : 'neutral'"
          variant="subtle"
        >
          {{ schemaVersion >= 2 ? 'Context-aware run' : 'Legacy run (no context)' }}
        </UBadge>
      </div>
    </template>

    <div class="space-y-5">
      <UAlert
        v-if="schemaVersion < 2"
        color="neutral"
        variant="soft"
        icon="i-lucide-info"
        title="This guide was extracted before context capture"
        description="Its rules carry no guide context from extraction. Enrichment can still recover it by reading this guide's PDF — run it below."
      />

      <!-- Guide context -->
      <div
        v-if="contextRows.length"
        class="space-y-2"
      >
        <h4 class="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
          Guide context
        </h4>
        <dl class="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          <div
            v-for="row in contextRows"
            :key="row.label"
            class="min-w-0"
          >
            <dt class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              {{ row.label }}
              <UTooltip
                v-if="row.derived"
                text="Read from the document itself, not from the catalog record"
              >
                <UBadge
                  color="warning"
                  variant="subtle"
                  size="xs"
                >
                  from PDF
                </UBadge>
              </UTooltip>
            </dt>
            <dd class="mt-0.5 text-sm text-gray-800 dark:text-gray-100">
              {{ row.value }}
            </dd>
          </div>
        </dl>
      </div>

      <!-- Evidence -->
      <div
        v-if="evidence.length"
        class="space-y-2"
      >
        <h4 class="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
          Evidence quoted from the document
        </h4>
        <ul class="space-y-1">
          <li
            v-for="(quote, index) in evidence"
            :key="index"
            class="border-l-2 border-gray-200 pl-3 text-xs italic text-gray-600 dark:border-white/10 dark:text-gray-300"
          >
            “{{ quote }}”
          </li>
        </ul>
      </div>

      <!-- Page summaries -->
      <div v-if="pageSummaries.length">
        <UCollapsible>
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            trailing-icon="i-lucide-chevron-down"
            class="-ml-2"
          >
            Page summaries ({{ pageSummaries.length }})
          </UButton>

          <template #content>
            <div class="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
              <div
                v-for="page in pageSummaries"
                :key="page.page"
                class="rounded-lg border border-gray-200/70 p-3 dark:border-white/10"
              >
                <div class="mb-1 flex items-center gap-2">
                  <span class="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Page {{ page.page }}
                  </span>
                  <UBadge
                    color="neutral"
                    variant="subtle"
                    size="xs"
                  >
                    {{ page.guideline_count }} rule{{ page.guideline_count === 1 ? '' : 's' }}
                  </UBadge>
                  <UBadge
                    v-if="page.continues_from_previous"
                    color="info"
                    variant="subtle"
                    size="xs"
                  >
                    continues previous page
                  </UBadge>
                </div>
                <p class="text-xs leading-5 text-gray-600 dark:text-gray-300">
                  {{ page.page_summary }}
                </p>
              </div>
            </div>
          </template>
        </UCollapsible>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
/**
 * What extraction understood the guide to be.
 *
 * Rules are extracted page by page, so the context assembled at run time —
 * which guide, which population, which pages continued a table — is the only
 * record of *why* a given rule was interpreted the way it was. Without showing
 * it, a reviewer looking at a wrong facet has no way to tell whether the rule
 * was misread or the guide was misidentified.
 */
import { computed } from 'vue'
import type {
  FoodScholarGuideContext,
  FoodScholarProcessedPage
} from '~/services/foodscholarGuidelinesApi'
import { formatAgeRange } from '~/utils/guidelineFacets'

const props = withDefaults(
  defineProps<{
    context?: FoodScholarGuideContext | null
    documentProfile?: FoodScholarGuideContext | null
    processedPages?: FoodScholarProcessedPage[]
    continuationPages?: number[]
    schemaVersion?: number
  }>(),
  {
    context: null,
    documentProfile: null,
    processedPages: () => [],
    continuationPages: () => [],
    schemaVersion: 1
  }
)

const derivedFields = computed(() => new Set(props.context?.derived_fields ?? []))

const contextRows = computed(() => {
  const ctx = props.context ?? props.documentProfile
  if (!ctx) return []

  const rows: Array<{ label: string, value: string, derived: boolean }> = []
  const push = (label: string, value: unknown, field: string) => {
    if (value === null || value === undefined || value === '') return
    rows.push({ label, value: String(value), derived: derivedFields.value.has(field) })
  }

  push('Title', ctx.title, 'title')
  push('Issuing authority', ctx.issuing_authority, 'issuing_authority')
  push('Region', ctx.region, 'region')
  push('Published', ctx.publication_year, 'publication_year')
  push('Language', ctx.language, 'language')
  push('Audience', ctx.audience, 'audience')
  // The single most important line: it is what every context-free rule inherits.
  push('Guidance is for', ctx.population_note, 'population_note')

  const ageRange = formatAgeRange(ctx.age_min_months, ctx.age_max_months)
  if (ageRange) {
    rows.push({
      label: 'Age range covered',
      value: ageRange,
      derived: derivedFields.value.has('age_min_months')
        || derivedFields.value.has('age_max_months')
    })
  }

  push('Scope', ctx.scope_note, 'scope_note')
  return rows
})

const evidence = computed(() => props.context?.evidence ?? props.documentProfile?.evidence ?? [])

const pageSummaries = computed(() => {
  const continuations = new Set(props.continuationPages ?? [])
  return (props.processedPages ?? [])
    .filter(page => Boolean(page.page_summary?.trim()))
    .map(page => ({
      ...page,
      continues_from_previous:
        page.continues_from_previous ?? continuations.has(page.page)
    }))
    .sort((a, b) => a.page - b.page)
})
</script>
