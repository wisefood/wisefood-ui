<template>
  <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbItems"
      class="mb-4"
    />
    <ConsoleInsightsNav
      :loaded-at="loadedAt"
      :refreshing="busy"
      @refresh="reload"
    />
    <UPageHeader
      title="Q&A review"
      description="Every question asked of FoodScholar, the answer it gave, and what people thought of it."
      :ui="{ root: 'relative py-8 border-b-0' }"
    />

    <UPageBody>
      <div class="space-y-6">
        <!--
          The judgements this page collects, added up. Without it the console
          can take a verdict but cannot say what has been judged — which makes
          it a form rather than a review tool.

          Nothing at all while the first load is in flight: the panel's own
          zeros would read as "nobody has reviewed anything", and a failure
          must not read that way either.
        -->
        <UCard
          v-if="failed"
          :ui="{ body: 'p-0' }"
          class="border border-gray-200/70 dark:border-white/10"
        >
          <ConsoleInsightsEmptyState
            failed
            title="The review tally could not be loaded"
            hint="The request to the API failed. Verdicts may well have been recorded — retry, and if it persists check the gateway."
          />
        </UCard>
        <ConsoleInsightsReviewSummaryPanel
          v-else-if="!loading"
          :summary="reviewSummary"
          :days="range.days"
        >
          <template #actions>
            <!--
              A quarter by default: expert review is episodic, and a week of
              it is usually empty. The console's remembered range wins over
              that, so the tally can be read against the same window as the
              rest of the analytics.
            -->
            <ConsoleInsightsRangePicker v-model="range.days" />
            <ConsoleInsightsExportButton
              report="reviewers"
              :days="range.days"
              label="Reviewers CSV"
            />
          </template>
        </ConsoleInsightsReviewSummaryPanel>

        <div
          class="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter the questions"
        >
          <UInput
            v-model="search"
            placeholder="Search the questions…"
            aria-label="Search the questions"
            icon="i-lucide-search"
            class="w-72"
            @keydown.enter="applyFilters"
          />
          <UButton
            :color="negativeOnly ? 'error' : 'neutral'"
            :variant="negativeOnly ? 'solid' : 'outline'"
            :aria-pressed="negativeOnly"
            size="sm"
            icon="i-lucide-thumbs-down"
            @click="toggleNegative"
          >
            Criticised only
          </UButton>
          <UButton
            :color="withFeedback ? 'primary' : 'neutral'"
            :variant="withFeedback ? 'solid' : 'outline'"
            :aria-pressed="withFeedback"
            size="sm"
            icon="i-lucide-message-square"
            @click="toggleWithFeedback"
          >
            Has feedback
          </UButton>
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            @click="applyFilters"
          >
            Apply
          </UButton>
        </div>

        <div class="grid gap-6 lg:grid-cols-5">
          <!-- List -->
          <UCard
            :ui="{ body: 'p-0' }"
            class="overflow-hidden border border-gray-200/70 lg:col-span-2 dark:border-white/10"
          >
            <div class="border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                Questions
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ total }} matching
              </p>
            </div>
            <div
              v-if="loading"
              class="animate-pulse divide-y divide-gray-100 px-5 dark:divide-zinc-800"
              role="status"
              aria-live="polite"
              aria-label="Loading the questions"
            >
              <div
                v-for="n in 6"
                :key="n"
                class="space-y-2 py-3"
              >
                <span class="block h-3 w-full rounded bg-gray-200 dark:bg-zinc-800" />
                <span class="block h-3 w-2/3 rounded bg-gray-200 dark:bg-zinc-800" />
                <span class="block h-2.5 w-24 rounded bg-gray-200 dark:bg-zinc-800" />
              </div>
            </div>
            <ConsoleInsightsEmptyState
              v-else-if="failed"
              failed
              title="The questions could not be loaded"
              hint="The request to the API failed. This is not an empty list — retry, and if it persists check the gateway."
            />
            <ConsoleInsightsEmptyState
              v-else-if="!items.length"
              title="No questions match."
              hint="Questions asked through FoodScholar and inside FoodChat both appear here."
              icon="i-lucide-message-circle-question"
            />
            <ul
              v-else
              class="max-h-[32rem] divide-y divide-gray-100 overflow-y-auto dark:divide-zinc-800"
            >
              <li
                v-for="row in items"
                :key="row.request_id"
              >
                <button
                  type="button"
                  class="w-full px-5 py-3 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 dark:hover:bg-white/5"
                  :class="selectedId === row.request_id ? 'bg-brand-50 dark:bg-brand-500/10' : ''"
                  :aria-current="selectedId === row.request_id ? 'true' : undefined"
                  @click="select(row.request_id)"
                >
                  <!-- Two lines here; the full question is in the detail pane. -->
                  <p
                    class="line-clamp-2 text-sm font-medium text-gray-900 dark:text-white"
                    :title="row.question"
                  >
                    {{ row.question }}
                  </p>
                  <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                    <span>{{ formatWhen(row.created_at) }}</span>
                    <UBadge
                      v-if="row.has_negative_feedback"
                      color="error"
                      variant="subtle"
                      size="sm"
                    >
                      criticised
                    </UBadge>
                    <UBadge
                      v-else-if="row.feedback_count"
                      color="success"
                      variant="subtle"
                      size="sm"
                    >
                      {{ row.feedback_count }} feedback
                    </UBadge>
                    <span v-if="!row.user_id && row.correlation_id">via chat</span>
                  </div>
                </button>
              </li>
            </ul>
            <template
              v-if="total > pageSize"
              #footer
            >
              <UPagination
                v-model:page="page"
                :items-per-page="pageSize"
                :total="total"
              />
            </template>
          </UCard>

          <!-- Detail -->
          <div class="space-y-6 lg:col-span-3">
            <UCard
              v-if="!detail"
              :ui="{ body: 'p-0' }"
              class="border border-gray-200/70 dark:border-white/10"
            >
              <ConsoleInsightsEmptyState
                title="Pick a question to review."
                hint="You will see the answer, its sources and any feedback, and can record a verdict."
                icon="i-lucide-hand-pointer"
              />
            </UCard>

            <template v-else>
              <UCard
                :ui="{ body: 'p-5' }"
                class="border border-gray-200/70 dark:border-white/10"
              >
                <p class="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Question
                </p>
                <p class="mt-1 break-words text-lg font-semibold text-gray-900 dark:text-white">
                  {{ detail.question }}
                </p>
                <div class="mt-3 flex flex-wrap gap-2 text-xs">
                  <UBadge
                    color="neutral"
                    variant="subtle"
                  >
                    {{ detail.model }}
                  </UBadge>
                  <UBadge
                    color="neutral"
                    variant="subtle"
                  >
                    {{ detail.language }}
                  </UBadge>
                  <UBadge
                    v-if="detail.confidence"
                    color="neutral"
                    variant="subtle"
                  >
                    confidence: {{ detail.confidence }}
                  </UBadge>
                  <UBadge
                    v-if="detail.cache_hit"
                    color="info"
                    variant="subtle"
                  >
                    from cache
                  </UBadge>
                  <UBadge
                    color="neutral"
                    variant="subtle"
                  >
                    {{ detail.articles_consulted }} sources consulted
                  </UBadge>
                </div>
                <p class="mt-3 break-all text-xs text-gray-400 dark:text-gray-500">
                  {{ formatWhen(detail.created_at) }} ·
                  <template v-if="detail.user_id">
                    {{ detail.user_id }}
                  </template>
                  <template v-else-if="detail.correlation_id">
                    asked inside a chat turn — attributed through session {{ detail.correlation_id }}
                  </template>
                  <template v-else>
                    not attributed
                  </template>
                </p>
              </UCard>

              <UCard
                :ui="{ body: 'p-5' }"
                class="border border-gray-200/70 dark:border-white/10"
              >
                <p class="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Answer
                </p>
                <p class="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-800 dark:text-gray-200">
                  {{ answerText || 'No answer text stored.' }}
                </p>
                <div
                  v-if="detail.retrieved_article_urns?.length"
                  class="mt-4"
                >
                  <p class="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Sources
                  </p>
                  <!--
                    URNs wrap rather than truncate: the distinguishing part of
                    one is its tail, which is exactly what an ellipsis removes.
                  -->
                  <ul class="mt-2 space-y-1">
                    <li
                      v-for="urn in detail.retrieved_article_urns"
                      :key="urn"
                      class="break-all font-mono text-xs text-gray-500 dark:text-gray-400"
                    >
                      {{ urn }}
                    </li>
                  </ul>
                </div>
              </UCard>

              <UCard
                v-if="detail.feedback?.length"
                :ui="{ body: 'p-5' }"
                class="border border-gray-200/70 dark:border-white/10"
              >
                <p class="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  What people said
                </p>
                <ul class="mt-2 space-y-2">
                  <li
                    v-for="(entry, index) in detail.feedback"
                    :key="index"
                    class="text-sm"
                  >
                    <UBadge
                      :color="entry.helpfulness === 'not_helpful' ? 'error' : 'success'"
                      variant="subtle"
                    >
                      {{ entry.helpfulness || entry.preferred_answer || 'feedback' }}
                    </UBadge>
                    <span
                      v-if="entry.reason"
                      class="ml-2 break-words text-gray-700 dark:text-gray-300"
                    >{{ entry.reason }}</span>
                  </li>
                </ul>
              </UCard>

              <!-- The point of the page: leave a verdict. -->
              <UCard
                :ui="{ body: 'p-5' }"
                class="border border-gray-200/70 dark:border-white/10"
              >
                <p class="text-base font-semibold text-gray-900 dark:text-white">
                  Your verdict
                </p>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Recorded against your name, and visible to other reviewers.
                </p>

                <div
                  class="mt-4 flex flex-wrap gap-2"
                  role="group"
                  aria-label="Verdict"
                >
                  <UButton
                    v-for="option in verdicts"
                    :key="option.value"
                    :color="verdict === option.value ? option.color : 'neutral'"
                    :variant="verdict === option.value ? 'solid' : 'outline'"
                    :aria-pressed="verdict === option.value"
                    size="sm"
                    @click="verdict = option.value"
                  >
                    {{ option.label }}
                  </UButton>
                </div>

                <UTextarea
                  v-model="notes"
                  class="mt-3 w-full"
                  :rows="3"
                  aria-label="Notes on this verdict"
                  placeholder="What was wrong, or what would a good answer have said?"
                />

                <div class="mt-3 flex items-center gap-3">
                  <UButton
                    color="primary"
                    icon="i-lucide-check"
                    :disabled="!verdict"
                    :loading="savingReview"
                    @click="saveReview"
                  >
                    Record verdict
                  </UButton>
                  <span
                    v-if="reviewSaved"
                    class="text-sm text-emerald-600 dark:text-emerald-400"
                    role="status"
                  >Saved.</span>
                  <span
                    v-else-if="reviewError"
                    class="text-sm text-red-600 dark:text-red-400"
                    role="alert"
                  >{{ reviewError }}</span>
                </div>

                <div
                  v-if="existingReviews.length"
                  class="mt-5 border-t border-gray-100 pt-4 dark:border-zinc-800"
                >
                  <p class="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Existing verdicts
                  </p>
                  <ul class="mt-2 space-y-2">
                    <li
                      v-for="review in existingReviews"
                      :key="review.id"
                      class="text-sm"
                    >
                      <UBadge
                        color="neutral"
                        variant="subtle"
                      >
                        {{ review.verdict.replace('_', ' ') }}
                      </UBadge>
                      <span class="ml-2 text-gray-500 dark:text-gray-400">
                        {{ review.reviewer_name || review.reviewer_id }} · {{ formatWhen(review.created_at) }}
                      </span>
                      <p
                        v-if="review.notes"
                        class="mt-1 break-words text-gray-700 dark:text-gray-300"
                      >
                        {{ review.notes }}
                      </p>
                    </li>
                  </ul>
                </div>
              </UCard>
            </template>
          </div>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import insightsApi, {
  type QaRequestDetail,
  type QaRequestRow,
  type ReviewRow,
  type ReviewSummary
} from '~/services/insightsApi'
import { consoleBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })
useHead({ title: 'Q&A review · Console' })

const breadcrumbItems = consoleBreadcrumb(
  { label: 'Analytics', icon: 'i-lucide-chart-column', to: '/console/insights' },
  { label: 'Q&A review', icon: 'i-lucide-message-circle-question' }
)

const verdicts = [
  { value: 'correct', label: 'Correct', color: 'success' as const },
  { value: 'partially_correct', label: 'Partly correct', color: 'warning' as const },
  { value: 'incorrect', label: 'Incorrect', color: 'error' as const },
  { value: 'unsafe', label: 'Unsafe', color: 'error' as const },
  { value: 'off_topic', label: 'Off topic', color: 'neutral' as const },
  { value: 'unclear', label: 'Unclear', color: 'neutral' as const }
]

const route = useRoute()
const pageSize = 25

const search = ref('')
const negativeOnly = ref(route.query.negative === '1')
const withFeedback = ref(false)
const page = ref(1)
const total = ref(0)
const items = ref<QaRequestRow[]>([])

// The review tally's window. Ninety days is this page's default — a week of
// expert review is usually empty — but a range chosen elsewhere in the
// console is kept, and `?request=` and `?negative=` survive it untouched.
const range = useInsightsRange(90)
const reviewSummary = ref<ReviewSummary | null>(null)

const selectedId = ref<string | null>(null)
const detail = ref<QaRequestDetail | null>(null)
const existingReviews = ref<ReviewRow[]>([])

const verdict = ref('')
const notes = ref('')
const savingReview = ref(false)
const reviewSaved = ref(false)
const reviewError = ref('')

// The stored answer is a JSON blob whose text key differs by pipeline version.
const answerText = computed(() => {
  const answer = detail.value?.primary_answer as Record<string, unknown> | null
  if (!answer) return ''
  for (const key of ['answer', 'text', 'content', 'summary']) {
    const value = answer[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return ''
})

const formatWhen = (value: unknown) => {
  if (!value) return ''
  const when = new Date(String(value))
  return Number.isNaN(when.getTime()) ? '' : when.toLocaleString()
}

function applyFilters() {
  page.value = 1
  void reload()
}
function toggleNegative() {
  negativeOnly.value = !negativeOnly.value
  applyFilters()
}
function toggleWithFeedback() {
  withFeedback.value = !withFeedback.value
  applyFilters()
}

async function loadReviewSummary() {
  reviewSummary.value = await insightsApi.getReviewSummary(range.value.days)
}

async function loadQuestions() {
  const result = await insightsApi.getQaRequests({
    limit: pageSize,
    offset: (page.value - 1) * pageSize,
    negativeOnly: negativeOnly.value,
    hasFeedback: withFeedback.value ? true : undefined,
    search: search.value || undefined
  })
  total.value = result.total
  items.value = result.items
}

// One load for the page, so one "as of" and one failure state cover both the
// list and the tally: the two are read together, and a reader told the list
// is fresh would assume the tally above it is too.
async function load() {
  await Promise.all([loadQuestions(), loadReviewSummary()])
}

const { loading, failed, loadedAt, reload, busy } = useInsightsLoad(load, () =>
  !items.value.length && !(reviewSummary.value?.agreement.targets_reviewed ?? 0)
)

async function select(requestId: string) {
  selectedId.value = requestId
  verdict.value = ''
  notes.value = ''
  reviewSaved.value = false
  reviewError.value = ''
  const [found, reviews] = await Promise.all([
    insightsApi.getQaRequest(requestId),
    insightsApi.getReviews('qa_answer', requestId)
  ])
  detail.value = found
  existingReviews.value = reviews
}

async function saveReview() {
  if (!detail.value || !verdict.value) return
  savingReview.value = true
  reviewError.value = ''
  const ok = await insightsApi.recordReview({
    target_type: 'qa_answer',
    target_id: detail.value.request_id,
    verdict: verdict.value,
    notes: notes.value || undefined,
    request_id: detail.value.correlation_id || undefined
  })
  savingReview.value = false
  if (ok) {
    reviewSaved.value = true
    // The verdict just recorded is part of the tally above; leaving it stale
    // would show a reviewer a count that does not include what they just did.
    await loadReviewSummary()
    existingReviews.value = await insightsApi.getReviews('qa_answer', detail.value.request_id)
  } else {
    reviewError.value = 'Could not save that verdict.'
  }
}

watch(page, () => {
  void reload()
})
watch(range, () => {
  void reload()
}, { deep: true })
onMounted(async () => {
  await reload()
  const requested = route.query.request
  if (typeof requested === 'string' && requested) await select(requested)
})
</script>
