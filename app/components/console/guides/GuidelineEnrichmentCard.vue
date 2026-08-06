<template>
  <UCard
    :ui="{ body: 'p-5 sm:p-6', header: 'p-5 sm:px-6' }"
    class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
            Facet enrichment
          </h3>
          <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
            Assigns life stage, age range, setting and nutrients to this guide's rules — no re-extraction needed.
          </p>
        </div>
        <UBadge
          v-if="progress"
          :color="progressColor"
          variant="subtle"
        >
          {{ progressLabel }}
        </UBadge>
      </div>
    </template>

    <div class="space-y-4">
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :title="error"
      />

      <p class="text-xs leading-5 text-gray-600 dark:text-gray-400">
        Rules were extracted one page at a time, so most carry no population of their own.
        Enrichment reads this guide's context — from its catalog record, from the extraction
        run, or by reading the PDF's opening pages when neither says — and pushes it down
        onto each rule. Rules already at the current version are skipped, so this is safe to
        re-run.
      </p>

      <div class="flex flex-wrap gap-2">
        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          icon="i-lucide-eye"
          :loading="previewPending"
          :disabled="enqueuePending"
          @click="runPreview"
        >
          Preview on {{ previewLimit }} rules
        </UButton>

        <UButton
          v-if="isAdmin"
          size="sm"
          color="primary"
          variant="soft"
          icon="i-lucide-sparkles"
          :loading="enqueuePending"
          :disabled="previewPending"
          @click="runEnrichment(false)"
        >
          Enrich this guide
        </UButton>

        <UButton
          v-if="isAdmin && preview"
          size="sm"
          color="neutral"
          variant="ghost"
          :loading="enqueuePending"
          @click="runEnrichment(true)"
        >
          Re-enrich (force)
        </UButton>
      </div>

      <!-- Preview -->
      <div
        v-if="preview"
        class="space-y-3 rounded-xl border border-gray-200/70 p-4 dark:border-white/10"
      >
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <UBadge
            color="neutral"
            variant="subtle"
          >
            {{ preview.would_enrich }} of {{ preview.examined }} would gain facets
          </UBadge>
          <UBadge
            v-if="preview.no_facets"
            color="warning"
            variant="subtle"
          >
            {{ preview.no_facets }} yielded nothing
          </UBadge>
          <UBadge
            v-for="source in preview.context_sources"
            :key="source"
            color="info"
            variant="subtle"
          >
            context: {{ formatSource(source) }}
          </UBadge>
        </div>

        <div v-if="preview.guide_context">
          <p class="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-200">
            Context the facets were inferred from
          </p>
          <pre class="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-[11px] leading-5 text-gray-600 dark:bg-white/5 dark:text-gray-300">{{ preview.guide_context }}</pre>
          <p class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            If this is wrong, every facet under this guide will be wrong the same way — fix the guide record before enriching.
          </p>
        </div>

        <div
          v-if="preview.proposals.length"
          class="max-h-72 space-y-2 overflow-y-auto pr-1"
        >
          <div
            v-for="proposal in preview.proposals"
            :key="proposal.id"
            class="rounded-lg border border-gray-200/70 p-3 dark:border-white/10"
          >
            <p class="text-xs leading-5 text-gray-700 dark:text-gray-200">
              {{ proposal.rule_text }}
            </p>
            <div class="mt-2 flex flex-wrap gap-1">
              <span
                v-for="chip in facetChips(proposal.facets)"
                :key="chip"
                class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300"
              >{{ chip }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Progress -->
      <dl
        v-if="progress"
        class="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <div
          v-for="tile in progressTiles"
          :key="tile.label"
        >
          <dt class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {{ tile.label }}
          </dt>
          <dd class="mt-0.5 text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
            {{ tile.value }}
          </dd>
        </div>
      </dl>
    </div>
  </UCard>
</template>

<script setup lang="ts">
/**
 * Manual facet enrichment for a guide whose rules are already extracted.
 *
 * Preview is open to curators — seeing what the model proposes, and crucially
 * which context it inferred from, is how you tell whether enrichment can be
 * trusted for this guide. Actually writing is admin-only, since it queues model
 * work across the guide's whole rule set.
 */
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import foodscholarGuidelinesApi, {
  type FoodScholarEnrichmentGuideProgress,
  type FoodScholarEnrichmentPreview
} from '~/services/foodscholarGuidelinesApi'
import { useAuthStore } from '~/stores/auth'

const props = defineProps<{
  guideUrn: string
  progress?: FoodScholarEnrichmentGuideProgress | null
}>()

const emit = defineEmits<{ enqueued: [] }>()

const authStore = useAuthStore()
const { isAdmin } = storeToRefs(authStore)
const toast = useToast()

const previewLimit = 8
const previewPending = ref(false)
const enqueuePending = ref(false)
const error = ref<string | null>(null)
const preview = ref<FoodScholarEnrichmentPreview | null>(null)

const progressColor = computed(() => {
  const status = props.progress?.status
  if (status === 'succeeded') return 'success'
  if (status === 'failed') return 'error'
  if (status === 'running') return 'info'
  return 'neutral'
})

const progressLabel = computed(() => {
  const progress = props.progress
  if (!progress) return 'Not run'
  if (progress.status === 'running') return 'Running'
  if (progress.status === 'failed') return 'Failed'
  if (progress.status === 'queued') return 'Queued'
  return `v${progress.version} · ${progress.enriched} enriched`
})

const progressTiles = computed(() => {
  const progress = props.progress
  if (!progress) return []
  return [
    { label: 'Rules', value: progress.total.toLocaleString() },
    { label: 'Enriched', value: progress.enriched.toLocaleString() },
    { label: 'Skipped', value: progress.skipped_version.toLocaleString() },
    { label: 'Failed', value: progress.failed.toLocaleString() }
  ]
})

function formatSource(source: string): string {
  if (source === 'document_profile') return 'read from PDF'
  if (source === 'extraction_result') return 'extraction run'
  return source
}

function facetChips(facets: Record<string, unknown>): string[] {
  const chips: string[] = []
  for (const [key, value] of Object.entries(facets)) {
    if (key === 'enrichment_version' || key === 'enrichment_confidence') continue
    if (Array.isArray(value)) {
      if (value.length) chips.push(`${key}: ${value.join(', ')}`)
    } else if (value !== null && value !== undefined && value !== '') {
      chips.push(`${key}: ${value}`)
    }
  }
  return chips
}

async function runPreview() {
  previewPending.value = true
  error.value = null
  try {
    const result = await foodscholarGuidelinesApi.previewEnrichment({
      guide_urn: props.guideUrn,
      limit: previewLimit
    })
    preview.value = typeof result === 'string' ? null : result
    if (typeof result === 'string') error.value = result
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Preview failed.'
  } finally {
    previewPending.value = false
  }
}

async function runEnrichment(force = false) {
  enqueuePending.value = true
  error.value = null
  try {
    await foodscholarGuidelinesApi.enqueueEnrichment({
      guide_urns: [props.guideUrn],
      force
    })
    toast.add({
      title: 'Enrichment queued',
      description: 'The worker will process this guide in the background.',
      color: 'success'
    })
    emit('enqueued')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not queue enrichment.'
  } finally {
    enqueuePending.value = false
  }
}
</script>
