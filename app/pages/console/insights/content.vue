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
      title="Content & answers"
      description="What the answers, chats and pages actually look like — not how many there were."
      :ui="{ root: 'relative py-8 border-b-0' }"
    >
      <template #links>
        <ConsoleInsightsRangeControl v-model="range" />
        <ConsoleInsightsExportButton
          report="pages"
          :days="range.days"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="space-y-6">
        <!-- A dropped answer is a fault, not a statistic: FoodScholar answered
             someone and then lost the answer, so it is missing from review and
             from that person's history. It goes above everything else. -->
        <UAlert
          v-if="qa.persist_failed"
          color="error"
          variant="subtle"
          icon="i-lucide-database-backup"
          :title="`${qa.persist_failed.toLocaleString()} answers were produced and then not stored`"
          description="The person saw a reply, but nothing was written down. Those answers are
            absent from Q&A review and from the asker's own history, and no retry recovers them.
            Check the API logs for qa.persist_failed and the database's health before reading
            anything else on this page — every count below is short by at least this many."
        />

        <!-- Only once the fetch has settled: a null report during the fetch, or
             after a failed one, is not "analytics is off". -->
        <UAlert
          v-if="settled && !report"
          color="info"
          variant="subtle"
          icon="i-lucide-power-off"
          title="No content report came back"
          description="Either activity analytics is switched off on the API or the analytics
            schema has not been applied. Nothing on this page is a measurement until it is on —
            an empty page here is not the same as a quiet week."
        />

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <ConsoleStatsStatTile
            label="Questions asked"
            :value="settled ? qa.asked : null"
            icon="i-lucide-message-circle-question"
          />
          <ConsoleStatsStatTile
            label="Answered"
            :value="settled ? qa.answered : null"
            icon="i-lucide-message-square-reply"
          />
          <ConsoleStatsStatTile
            label="No answer recorded"
            :value="settled ? qa.unanswered : null"
            icon="i-lucide-message-square-off"
          />
          <ConsoleStatsStatTile
            label="Chat turns"
            :value="settled ? chat.turns : null"
            icon="i-lucide-messages-square"
          />
          <ConsoleStatsStatTile
            label="Recipe searches"
            :value="settled ? searchCache.searches : null"
            icon="i-lucide-search"
          />
        </div>

        <!--
          Two columns from lg up. What was produced — answers, turns, the pages
          people actually read — takes the wide side; the splits that say how it
          was produced are shares of it and read fine in a narrow list. Stacked
          as one column these breakdowns pushed the page tables below the fold
          on every screen.
        -->
        <div class="grid gap-6 lg:grid-cols-3">
          <div class="space-y-6 lg:col-span-2">
            <UCard
              :ui="{ body: 'p-5' }"
              class="border border-gray-200/70 dark:border-white/10"
            >
              <div class="flex flex-wrap items-baseline justify-between gap-2">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  How the answers were made
                </h3>
                <p
                  v-if="settled"
                  class="text-xs text-gray-500 dark:text-gray-400"
                >
                  Every figure is over the {{ qa.answered.toLocaleString() }} answers in this period
                </p>
              </div>

              <div
                v-if="loading"
                class="mt-4 grid animate-pulse gap-4 sm:grid-cols-3"
                role="status"
                aria-live="polite"
                aria-label="Loading how the answers were made"
              >
                <span
                  v-for="n in 3"
                  :key="n"
                  class="block h-8 rounded bg-gray-200 dark:bg-zinc-800"
                />
              </div>

              <ConsoleInsightsEmptyState
                v-else-if="failed"
                failed
                title="Answer figures could not be loaded"
                hint="The request to the API failed. This is not an empty period — retry, and if it persists check the gateway."
              />

              <ConsoleInsightsEmptyState
                v-else-if="!qa.answered"
                title="No questions were answered in this period."
                :hint="qa.asked
                  ? 'Questions were asked, so collection is working — the answers are the gap.'
                  : 'Nobody asked FoodScholar anything. Q&A events are recorded by default.'"
                icon="i-lucide-message-circle-question"
              />

              <!-- Three across rather than five: the card is two thirds of the
                   page now, and each figure carries a sentence under it. -->
              <dl
                v-else
                class="mt-4 grid gap-4 sm:grid-cols-3"
              >
                <div
                  v-for="figure in answerFigures"
                  :key="figure.label"
                >
                  <dt class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {{ figure.label }}
                  </dt>
                  <dd class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    {{ figure.value }}
                  </dd>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {{ figure.note }}
                  </p>
                </div>
              </dl>
            </UCard>

            <!-- The gap is real but it is not all loss, and presenting it as loss
                 would send someone hunting a bug that is a clock boundary. -->
            <p
              v-if="qa.unanswered"
              class="text-xs text-gray-500 dark:text-gray-400"
            >
              {{ qa.unanswered.toLocaleString() }} questions in this window have no answer event
              against them. Some of those are simply still in flight: a question asked in the last
              minutes of the period is answered outside it, and the two events land in different
              windows. Treat the gap as a trend to watch rather than a count of failures — a figure
              that stays near a handful is the window edge, one that grows with the period is not.
            </p>

            <UCard
              :ui="{ body: 'p-5' }"
              class="border border-gray-200/70 dark:border-white/10"
            >
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                FoodChat
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Turns taken and how long each one kept somebody waiting
              </p>

              <div
                v-if="loading"
                class="mt-4 grid animate-pulse gap-4 sm:grid-cols-3"
                role="status"
                aria-live="polite"
                aria-label="Loading FoodChat"
              >
                <span
                  v-for="n in 3"
                  :key="n"
                  class="block h-8 rounded bg-gray-200 dark:bg-zinc-800"
                />
              </div>

              <ConsoleInsightsEmptyState
                v-else-if="failed"
                failed
                title="FoodChat figures could not be loaded"
                hint="The request to the API failed. This is not an empty period — retry, and if it persists check the gateway."
              />

              <ConsoleInsightsEmptyState
                v-else-if="!chat.turns"
                title="No chat turns in this period."
                hint="Chat turns are recorded by default; an empty panel here means nobody chatted."
                icon="i-lucide-messages-square"
              />

              <dl
                v-else
                class="mt-4 grid gap-4 sm:grid-cols-3"
              >
                <div>
                  <dt class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Turns
                  </dt>
                  <dd class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    {{ chat.turns.toLocaleString() }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Median reply
                  </dt>
                  <dd class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    {{ duration(chat.p50_ms) }}
                  </dd>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    What a normal turn feels like
                  </p>
                </div>
                <div>
                  <dt class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    95th percentile
                  </dt>
                  <dd class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    {{ duration(chat.p95_ms) }}
                  </dd>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    The worst one turn in twenty
                  </p>
                </div>
              </dl>
            </UCard>

            <ConsoleInsightsTablePanel
              title="Most read pages"
              :subtitle="`${pageViews.toLocaleString()} views across the pages listed`"
              :rows="pages"
              :columns="pageColumns"
              :loading="loading"
              :failed="failed"
              empty="No page views recorded."
              empty-hint="Page views are recorded by default — an empty table means nobody opened a page."
              empty-icon="i-lucide-file-text"
            >
              <template #cell-path="{ row }">
                <span class="break-all font-mono text-xs">{{ row.path }}</span>
              </template>
            </ConsoleInsightsTablePanel>

            <ConsoleInsightsTablePanel
              title="Where people land"
              subtitle="First page of a session — a view with no route before it"
              :rows="entryPages"
              :columns="entryColumns"
              :loading="loading"
              :failed="failed"
              empty="No entry pages recorded."
              empty-hint="Every recorded view followed another one, which usually means no fresh sessions."
              empty-icon="i-lucide-door-open"
            >
              <template #cell-path="{ row }">
                <span class="break-all font-mono text-xs">{{ row.path }}</span>
              </template>
            </ConsoleInsightsTablePanel>
          </div>

          <aside class="space-y-6">
            <UCard
              v-if="loading"
              :ui="{ body: 'p-4' }"
              class="border border-gray-200/70 dark:border-white/10"
            >
              <div
                class="animate-pulse space-y-3"
                role="status"
                aria-live="polite"
                aria-label="Loading answer breakdowns"
              >
                <span class="block h-3 w-1/3 rounded bg-gray-200 dark:bg-zinc-800" />
                <span
                  v-for="n in 4"
                  :key="n"
                  class="block h-2 rounded bg-gray-200 dark:bg-zinc-800"
                />
              </div>
            </UCard>

            <UCard
              v-else-if="failed"
              :ui="{ body: 'p-0' }"
              class="border border-gray-200/70 dark:border-white/10"
            >
              <ConsoleInsightsEmptyState
                failed
                title="Answer breakdowns could not be loaded"
                hint="The request to the API failed. This is not an empty period — retry, and if it persists check the gateway."
              />
            </UCard>

            <template v-else>
              <ConsoleInsightsContentBreakdown
                title="By mode"
                icon="i-lucide-sliders-horizontal"
                :rows="qa.by_mode"
                mono
                empty="No answer modes recorded."
                empty-hint="Answers are recorded with the mode they ran in; none were answered here."
                empty-icon="i-lucide-sliders-horizontal"
              />
              <ConsoleInsightsContentBreakdown
                title="By language"
                icon="i-lucide-languages"
                :rows="qa.by_language"
                empty="No languages recorded."
                empty-hint="The language of a question is recorded on the answer, so an empty split means no answers."
                empty-icon="i-lucide-languages"
              />
              <ConsoleInsightsContentBreakdown
                title="By model"
                icon="i-lucide-cpu"
                :rows="qa.by_model"
                mono
                empty="No models recorded."
                empty-hint="A cached answer still names the model that first produced it."
                empty-icon="i-lucide-cpu"
              />

              <ConsoleInsightsContentBreakdown
                title="What people chat about"
                icon="i-lucide-tags"
                :rows="chat.by_intent"
                empty="No intents recorded."
                empty-hint="A turn carries an intent only once the classifier has labelled it."
                empty-icon="i-lucide-tags"
              />
            </template>

            <UCard
              :ui="{ body: 'p-5' }"
              class="border border-gray-200/70 dark:border-white/10"
            >
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                Recipe search cache
              </h3>

              <div
                v-if="loading"
                class="mt-4 animate-pulse space-y-4"
                role="status"
                aria-live="polite"
                aria-label="Loading recipe search cache"
              >
                <span
                  v-for="n in 3"
                  :key="n"
                  class="block h-8 w-1/2 rounded bg-gray-200 dark:bg-zinc-800"
                />
              </div>

              <ConsoleInsightsEmptyState
                v-else-if="failed"
                failed
                title="Recipe search cache could not be loaded"
                hint="The request to the API failed. This is not an empty period — retry, and if it persists check the gateway."
              />

              <ConsoleInsightsEmptyState
                v-else-if="!searchCache.searches"
                title="No recipe searches in this period."
                hint="Searches are recorded by default, so this is quiet rather than unrecorded."
                icon="i-lucide-search"
              />

              <!-- Stacked in this column: three figures across roughly 310px
                   would each be narrower than their own label. -->
              <dl
                v-else
                class="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-1"
              >
                <div>
                  <dt class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Searches
                  </dt>
                  <dd class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    {{ searchCache.searches.toLocaleString() }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Served from cache
                  </dt>
                  <dd class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    {{ searchCache.from_cache.toLocaleString() }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Hit rate
                  </dt>
                  <dd class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    {{ percent(searchCache.cache_hit_rate) }}
                  </dd>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Searches answered without touching the index
                  </p>
                </div>
              </dl>
            </UCard>
          </aside>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import insightsApi, { type ContentReport } from '~/services/insightsApi'
import { consoleBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })
useHead({ title: 'Content & answers · Console' })

const breadcrumbItems = consoleBreadcrumb(
  { label: 'Analytics', icon: 'i-lucide-chart-column', to: '/console/insights' },
  { label: 'Content & answers', icon: 'i-lucide-file-text' }
)

// The period is shared across the insights pages and mirrored into the URL so
// a view can be pasted into a conversation — "the week the model changed" is a
// link, not instructions.
const range = useInsightsRange(7)
const report = ref<ContentReport | null>(null)

const EMPTY_QA: ContentReport['qa'] = {
  asked: 0,
  answered: 0,
  unanswered: 0,
  answer_rate: 0,
  persist_failed: 0,
  cache_hits: 0,
  cache_hit_rate: 0,
  with_retrieval: 0,
  retrieval_rate: 0,
  avg_confidence: null,
  avg_articles: null,
  by_mode: [],
  by_language: [],
  by_model: []
}

const qa = computed(() => report.value?.qa ?? EMPTY_QA)
const chat = computed(
  () => report.value?.chat ?? { turns: 0, by_intent: [], p50_ms: null, p95_ms: null }
)
const searchCache = computed(
  () => report.value?.search_cache ?? { searches: 0, from_cache: 0, cache_hit_rate: 0 }
)
const pages = computed(() => report.value?.pages ?? [])
const entryPages = computed(() => report.value?.entry_pages ?? [])

// The server caps the page list, so this is the total over the rows shown and
// the subtitle says as much rather than claiming to be every view taken.
const pageViews = computed(() => pages.value.reduce((sum, row) => sum + row.views, 0))

const percent = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : `${value.toFixed(1)}%`

const duration = (ms: number | null | undefined) => {
  if (ms === null || ms === undefined) return '—'
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`
}

const answerFigures = computed(() => [
  {
    label: 'Answer rate',
    value: percent(qa.value.answer_rate),
    note: 'Answers recorded against questions asked'
  },
  {
    label: 'From cache',
    value: percent(qa.value.cache_hit_rate),
    note: `${qa.value.cache_hits.toLocaleString()} answers cost nothing to produce`
  },
  {
    label: 'Used retrieval',
    value: percent(qa.value.retrieval_rate),
    note: 'The rest answered from the model alone'
  },
  {
    label: 'Confidence',
    value: qa.value.avg_confidence === null ? '—' : qa.value.avg_confidence.toFixed(2),
    note: 'Mean of the score the model gave itself, not a measure of correctness'
  },
  {
    label: 'Articles used',
    value: qa.value.avg_articles === null ? '—' : qa.value.avg_articles.toFixed(1),
    note: 'Average sources consulted per answer'
  }
])

const pageColumns = [
  { key: 'path', label: 'Page' },
  { key: 'views', label: 'Views', align: 'right' as const },
  { key: 'sessions', label: 'Sessions', align: 'right' as const }
]
const entryColumns = [
  { key: 'path', label: 'Entry page' },
  { key: 'sessions', label: 'Sessions', align: 'right' as const }
]

async function load() {
  report.value = await insightsApi.getContent(range.value.days, 20)
}

const { loading, failed, loadedAt, reload, busy } = useInsightsLoad(
  load,
  () => !qa.value.asked
    && !qa.value.answered
    && !chat.value.turns
    && !searchCache.value.searches
    && !pages.value.length
    && !entryPages.value.length
)

// A tile reading 0 while the fetch is in flight is the false quiet week in
// miniature, so the figures are withheld until there is something to trust.
const settled = computed(() => !loading.value && !failed.value)

watch(range, () => {
  void reload()
}, { deep: true })

onMounted(() => {
  void reload()
})
</script>
