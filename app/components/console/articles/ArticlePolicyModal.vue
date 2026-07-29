<script setup lang="ts">
/**
 * Batch editor for the two editorial controls on an article:
 *
 * - reader_visibility — which readers reach it (`public`, `expert_only`, `hidden`)
 * - indexing_tier — retrieval priority, with `prime` reserved for influential
 *   work an editor wants surfaced ahead of better-matching ordinary articles
 *
 * Scope is either the rows the editor ticked, or every article matching the
 * search they are currently looking at. A query-scoped change must be previewed
 * before it can be applied: the preview is a server-side dry run that reports
 * the true match count, so nobody rewrites 4000 articles believing it was 40.
 */
import { computed, ref, watch } from 'vue'
import articlesApi, {
  INDEXING_TIERS,
  INDEXING_TIER_HINTS,
  INDEXING_TIER_LABELS,
  READER_VISIBILITIES,
  READER_VISIBILITY_HINTS,
  READER_VISIBILITY_LABELS,
  type ArticlePolicyRequest,
  type ArticlePolicyResult,
  type IndexingTier,
  type ReaderVisibility
} from '~/services/articlesApi'

const props = defineProps<{
  /** URNs the editor ticked in the table. */
  selectedUrns: string[]
  /** The search currently applied to the table. */
  query: string | null
  filters: string[]
  /** Total the table is reporting for that search, used for the scope label. */
  queryTotal: number
}>()

const emit = defineEmits<{
  applied: [result: ArticlePolicyResult]
  close: []
}>()

const open = defineModel<boolean>('open', { required: true })

type Scope = 'selection' | 'query'

const scope = ref<Scope>('selection')
const readerVisibility = ref<ReaderVisibility | null>(null)
const indexingTier = ref<IndexingTier | null>(null)
const clearIndexingTier = ref(false)
const maxDocs = ref<number | null>(null)

const preview = ref<ArticlePolicyResult | null>(null)
const previewPending = ref(false)
const applyPending = ref(false)
const error = ref<string | null>(null)

const hasSelection = computed(() => props.selectedUrns.length > 0)
const hasQuery = computed(() => Boolean(props.query?.trim()) || props.filters.length > 0)

const visibilityOptions = READER_VISIBILITIES.map(value => ({
  value,
  label: READER_VISIBILITY_LABELS[value],
  hint: READER_VISIBILITY_HINTS[value]
}))

const tierOptions = INDEXING_TIERS.map(value => ({
  value,
  label: INDEXING_TIER_LABELS[value],
  hint: INDEXING_TIER_HINTS[value]
}))

const hasChange = computed(
  () => Boolean(readerVisibility.value) || Boolean(indexingTier.value) || clearIndexingTier.value
)

const scopeLabel = computed(() => {
  if (scope.value === 'selection') {
    const n = props.selectedUrns.length
    return `${n} selected article${n === 1 ? '' : 's'}`
  }
  if (!hasQuery.value) return 'every article — not allowed'
  return `all articles matching the current search (~${props.queryTotal})`
})

/** A query-scoped change is only applied after the editor has seen the count. */
const requiresPreview = computed(() => scope.value === 'query')
const canPreview = computed(
  () => hasChange.value && (scope.value === 'selection' ? hasSelection.value : hasQuery.value)
)
const canApply = computed(() => {
  if (!canPreview.value) return false
  if (!requiresPreview.value) return true
  return preview.value !== null && preview.value.matched > 0
})

function buildRequest(dryRun: boolean): ArticlePolicyRequest {
  const request: ArticlePolicyRequest = { dry_run: dryRun }

  if (scope.value === 'selection') {
    request.urns = [...props.selectedUrns]
  } else {
    request.q = props.query?.trim() || null
    request.fq = props.filters.length ? [...props.filters] : null
  }

  if (readerVisibility.value) request.reader_visibility = readerVisibility.value
  if (clearIndexingTier.value) request.clear_indexing_tier = true
  else if (indexingTier.value) request.indexing_tier = indexingTier.value
  if (maxDocs.value) request.max_docs = maxDocs.value

  return request
}

function resolveError(err: unknown): string {
  const detail = err as { data?: { detail?: unknown }, message?: string }
  if (typeof detail?.data?.detail === 'string') return detail.data.detail
  if (detail?.message) return detail.message
  return 'The editorial policy change failed.'
}

async function runPreview() {
  error.value = null
  previewPending.value = true
  try {
    preview.value = await articlesApi.setArticlePolicy(buildRequest(true))
  } catch (err) {
    error.value = resolveError(err)
    preview.value = null
  } finally {
    previewPending.value = false
  }
}

async function apply() {
  error.value = null
  applyPending.value = true
  try {
    const result = await articlesApi.setArticlePolicy(buildRequest(false))
    emit('applied', result)
    open.value = false
  } catch (err) {
    error.value = resolveError(err)
  } finally {
    applyPending.value = false
  }
}

function reset() {
  readerVisibility.value = null
  indexingTier.value = null
  clearIndexingTier.value = false
  maxDocs.value = null
  preview.value = null
  error.value = null
  scope.value = hasSelection.value ? 'selection' : 'query'
}

// Any change to the scope or the edit invalidates a preview taken before it.
watch([scope, readerVisibility, indexingTier, clearIndexingTier, maxDocs], () => {
  preview.value = null
})

watch(clearIndexingTier, (value) => {
  if (value) indexingTier.value = null
})

watch(open, (value) => {
  if (value) reset()
  else emit('close')
})
</script>

<template>
  <UModal
    v-model:open="open"
    :ui="{ content: 'w-[calc(100vw-2rem)] max-w-2xl' }"
  >
    <template #content>
      <UCard
        class="flex w-full max-h-[calc(100vh-2.5rem)] flex-col"
        :ui="{ body: 'min-h-0 flex-1 overflow-y-auto p-4 sm:p-5', footer: 'p-4 sm:p-5' }"
      >
        <template #header>
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Editorial policy
              </h3>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Control who can read these articles and how strongly they are favoured as evidence.
              </p>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              :disabled="applyPending"
              @click="open = false"
            />
          </div>
        </template>

        <div class="space-y-6">
          <!-- Scope -->
          <div class="space-y-2">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              Apply to
            </p>
            <div class="space-y-2">
              <URadioGroup
                v-model="scope"
                :items="[
                  {
                    value: 'selection',
                    label: `${selectedUrns.length} selected article${selectedUrns.length === 1 ? '' : 's'}`,
                    disabled: !hasSelection
                  },
                  {
                    value: 'query',
                    label: 'Every article matching the current search',
                    disabled: !hasQuery
                  }
                ]"
              />
              <p
                v-if="scope === 'query' && !hasQuery"
                class="text-xs text-amber-600 dark:text-amber-400"
              >
                Narrow the search first — applying a policy to the entire corpus is not allowed.
              </p>
              <p
                v-else-if="scope === 'query'"
                class="text-xs text-gray-500 dark:text-gray-400"
              >
                Scope: {{ scopeLabel }}. Preview to get the exact count.
              </p>
            </div>
          </div>

          <!-- Reader visibility -->
          <div class="space-y-2">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              Reader visibility
            </p>
            <USelectMenu
              v-model="readerVisibility"
              :items="visibilityOptions"
              value-key="value"
              label-key="label"
              placeholder="Leave unchanged"
              class="w-full"
            />
            <p
              v-if="readerVisibility"
              class="text-xs text-gray-500 dark:text-gray-400"
            >
              {{ READER_VISIBILITY_HINTS[readerVisibility] }}
            </p>
          </div>

          <!-- Indexing tier -->
          <div class="space-y-2">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              Indexing tier
            </p>
            <USelectMenu
              v-model="indexingTier"
              :items="tierOptions"
              value-key="value"
              label-key="label"
              placeholder="Leave unchanged"
              :disabled="clearIndexingTier"
              class="w-full"
            />
            <p
              v-if="indexingTier"
              class="text-xs text-gray-500 dark:text-gray-400"
            >
              {{ INDEXING_TIER_HINTS[indexingTier] }}
            </p>
            <UCheckbox
              v-model="clearIndexingTier"
              label="Clear the editorial tier"
              help="Falls back to the tier the enrichment agent proposed."
            />
          </div>

          <!-- Cap -->
          <div class="space-y-2">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              Limit
              <span class="font-normal text-gray-500 dark:text-gray-400">(optional)</span>
            </p>
            <UInput
              v-model.number="maxDocs"
              type="number"
              :min="1"
              :max="10000"
              placeholder="Maximum articles to change (server cap: 10000)"
              class="w-full"
            />
          </div>

          <UAlert
            v-if="error"
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            :title="error"
          />

          <!-- Preview -->
          <div
            v-if="preview"
            class="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700"
          >
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-eye"
                class="h-4 w-4 text-gray-500"
              />
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ preview.matched }} article{{ preview.matched === 1 ? '' : 's' }} would change
              </p>
            </div>

            <UAlert
              v-if="preview.capped"
              color="warning"
              variant="soft"
              icon="i-lucide-alert-triangle"
              :title="`Only the first ${preview.max_docs} will be changed`"
              :description="'The selection matches more articles than the limit allows. Raise the limit or narrow the search.'"
            />

            <ul
              v-if="preview.sample.length"
              class="space-y-1 text-xs text-gray-600 dark:text-gray-400"
            >
              <li
                v-for="item in preview.sample"
                :key="item.urn"
                class="truncate"
              >
                {{ item.title || item.urn }}
              </li>
              <li
                v-if="preview.matched > preview.sample.length"
                class="italic"
              >
                and {{ preview.matched - preview.sample.length }} more…
              </li>
            </ul>
          </div>
        </div>

        <template #footer>
          <div class="flex flex-wrap justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              :disabled="applyPending"
              @click="open = false"
            >
              Cancel
            </UButton>
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-eye"
              :disabled="!canPreview || previewPending || applyPending"
              :loading="previewPending"
              @click="runPreview"
            >
              Preview
            </UButton>
            <UButton
              color="primary"
              icon="i-lucide-check"
              :disabled="!canApply || applyPending || previewPending"
              :loading="applyPending"
              @click="apply"
            >
              Apply
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
