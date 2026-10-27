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
      title="Journeys"
      description="How conversations, questions and searches unfold — and the step people stop at."
      :ui="{ root: 'relative py-8 border-b-0' }"
    >
      <template #links>
        <ConsoleInsightsRangeControl v-model="range" />
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="space-y-10">
        <UCard
          v-if="failed"
          :ui="{ body: 'p-0' }"
          class="border border-gray-200/70 dark:border-white/10"
        >
          <ConsoleInsightsEmptyState
            failed
            title="The journey report could not be loaded"
            hint="The request to the API failed. This is not an empty period — retry, and if it persists check the gateway."
          />
        </UCard>

        <div
          v-else-if="loading && !report"
          class="animate-pulse space-y-6"
          role="status"
          aria-live="polite"
          aria-label="Loading journeys"
        >
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div
              v-for="n in 8"
              :key="n"
              class="h-20 rounded-lg bg-gray-200 dark:bg-zinc-800"
            />
          </div>
          <div class="h-72 rounded-lg bg-gray-200 dark:bg-zinc-800" />
        </div>

        <template v-else-if="report">
          <!-- FoodChat ------------------------------------------------------ -->
          <section
            class="space-y-6"
            aria-labelledby="journeys-foodchat"
          >
            <div class="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="journeys-foodchat"
                  class="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  FoodChat conversations
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ chatSentence }}
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <UButton
                  color="neutral"
                  variant="outline"
                  size="xs"
                  icon="i-lucide-monitor-smartphone"
                  :to="boardLink({ app: 'foodchat', did: 'plans' })"
                >
                  Sessions that made a plan
                </UButton>
                <UButton
                  color="neutral"
                  variant="outline"
                  size="xs"
                  icon="i-lucide-monitor-smartphone"
                  :to="boardLink({ app: 'foodchat', did: 'chat' })"
                >
                  All FoodChat sessions
                </UButton>
              </div>
            </div>

            <UAlert
              v-if="chat.truncated"
              color="warning"
              variant="subtle"
              icon="i-lucide-scissors"
              title="Only the start of this period was read"
              description="The period holds more chat activity than one report reads. Narrow the range for exact figures."
            />

            <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <ConsoleStatsStatTile
                v-for="tile in chatTiles"
                :key="tile.label"
                :label="tile.label"
                :value="tile.value"
                :icon="tile.icon"
              />
            </div>

            <div class="grid gap-6 lg:grid-cols-3">
              <UCard
                :ui="{ body: 'p-0' }"
                class="overflow-hidden border border-gray-200/70 lg:col-span-2 dark:border-white/10"
              >
                <div class="border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
                  <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                    The common paths
                  </h3>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Conversations as the steps they took, first six steps, repeats folded. The green share kept a plan.
                  </p>
                </div>
                <ConsoleInsightsEmptyState
                  v-if="!chat.paths.length"
                  title="No conversations in this period."
                  hint="A conversation appears here once FoodChat reports its first turn."
                  icon="i-lucide-route"
                />
                <ul
                  v-else
                  class="divide-y divide-gray-100 dark:divide-zinc-800"
                >
                  <li
                    v-for="(row, index) in chat.paths"
                    :key="index"
                    class="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div class="min-w-0 flex-1">
                      <ConsoleInsightsJourneyPath
                        :steps="row.path"
                        :more="row.more"
                      />
                    </div>
                    <div class="flex shrink-0 items-center gap-3 sm:w-48">
                      <!-- The bar is the share of all conversations; the green
                           part of it is the share that ended with a kept plan. -->
                      <div
                        class="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800"
                        :title="`${row.saved} of ${row.conversations} kept a plan`"
                      >
                        <div
                          class="flex h-full"
                          :style="{ width: `${Math.max(row.share, 2)}%` }"
                        >
                          <div
                            class="h-full bg-emerald-500"
                            :style="{ width: `${row.conversations ? (row.saved / row.conversations) * 100 : 0}%` }"
                          />
                          <div class="h-full flex-1 bg-gray-400 dark:bg-zinc-500" />
                        </div>
                      </div>
                      <span class="w-16 text-right text-xs tabular-nums text-gray-600 dark:text-gray-300">
                        {{ row.conversations.toLocaleString() }} · {{ row.share }}%
                      </span>
                    </div>
                  </li>
                </ul>
              </UCard>

              <div class="min-w-0 space-y-6">
                <ConsoleInsightsTablePanel
                  title="Where conversations end"
                  subtitle="The last step before they left. A path that ends on a failure or a question is one to read."
                  :rows="exitRows"
                  :columns="exitColumns"
                  empty="No conversations in this period."
                  empty-icon="i-lucide-door-open"
                >
                  <template #cell-step="{ row }">
                    <span :class="stepTone(String(row.step))">{{ chatStepLabel(row.step) }}</span>
                  </template>
                </ConsoleInsightsTablePanel>

                <ConsoleInsightsTablePanel
                  title="How they start"
                  subtitle="What the first turn of a conversation asked for"
                  :rows="entryRows"
                  :columns="entryColumns"
                  empty="No conversations in this period."
                  empty-icon="i-lucide-door-closed"
                >
                  <template #cell-step="{ row }">
                    {{ chatStepLabel(row.step) }}
                  </template>
                </ConsoleInsightsTablePanel>
              </div>
            </div>

            <div class="grid gap-6 lg:grid-cols-3">
              <ConsoleInsightsTablePanel
                class="lg:col-span-1"
                title="What follows what"
                subtitle="Each step and the one after it, most frequent first"
                :rows="transitionRows"
                :columns="transitionColumns"
                empty="No conversations in this period."
                empty-icon="i-lucide-git-branch"
              >
                <template #cell-from="{ row }">
                  {{ chatStepLabel(row.from) }}
                </template>
                <template #cell-to="{ row }">
                  <span :class="stepTone(String(row.to))">{{ chatStepLabel(row.to) }}</span>
                </template>
              </ConsoleInsightsTablePanel>

              <UCard
                v-for="dist in distributions"
                :key="dist.title"
                :ui="{ body: 'p-0' }"
                class="border border-gray-200/70 dark:border-white/10"
              >
                <div class="border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
                  <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                    {{ dist.title }}
                  </h3>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ dist.subtitle }}
                  </p>
                </div>
                <ConsoleInsightsEmptyState
                  v-if="!dist.total"
                  :title="dist.empty"
                  icon="i-lucide-utensils"
                />
                <ul
                  v-else
                  class="space-y-2.5 px-5 py-4"
                >
                  <li
                    v-for="bar in dist.rows"
                    :key="bar.bucket"
                  >
                    <div class="flex items-baseline justify-between text-sm">
                      <span class="text-gray-700 dark:text-gray-200">{{ bar.bucket }} plan{{ bar.bucket === '1' ? '' : 's' }}</span>
                      <span class="tabular-nums text-gray-500 dark:text-gray-400">
                        {{ bar.count.toLocaleString() }}
                      </span>
                    </div>
                    <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
                      <div
                        class="h-full rounded-full bg-brand-500"
                        :style="{ width: `${dist.total ? (bar.count / dist.total) * 100 : 0}%` }"
                      />
                    </div>
                  </li>
                </ul>
              </UCard>
            </div>
          </section>

          <!-- FoodScholar --------------------------------------------------- -->
          <section
            class="space-y-6"
            aria-labelledby="journeys-foodscholar"
          >
            <div class="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="journeys-foodscholar"
                  class="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  FoodScholar questions
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  A second question in the same visit is a follow-up or a first answer that missed — both worth reading.
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <UButton
                  color="neutral"
                  variant="outline"
                  size="xs"
                  icon="i-lucide-monitor-smartphone"
                  :to="boardLink({ did: 'questions' })"
                >
                  Sessions that asked
                </UButton>
                <UButton
                  color="neutral"
                  variant="outline"
                  size="xs"
                  icon="i-lucide-message-circle-question"
                  to="/console/insights/qa"
                >
                  Review the answers
                </UButton>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <ConsoleStatsStatTile
                v-for="tile in scholarTiles"
                :key="tile.label"
                :label="tile.label"
                :value="tile.value"
                :icon="tile.icon"
              />
            </div>
          </section>

          <!-- Recipes ------------------------------------------------------- -->
          <section
            class="space-y-6"
            aria-labelledby="journeys-recipes"
          >
            <div class="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="journeys-recipes"
                  class="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  Recipe search
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Whether a search led anywhere, and how often FoodChat came back empty-handed when it looked for recipes itself.
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <UButton
                  color="neutral"
                  variant="outline"
                  size="xs"
                  icon="i-lucide-monitor-smartphone"
                  :to="boardLink({ did: 'searches' })"
                >
                  Sessions that searched
                </UButton>
                <UButton
                  color="neutral"
                  variant="outline"
                  size="xs"
                  icon="i-lucide-search-x"
                  to="/console/insights/queries"
                >
                  What was not found
                </UButton>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <ConsoleStatsStatTile
                v-for="tile in recipeTiles"
                :key="tile.label"
                :label="tile.label"
                :value="tile.value"
                :icon="tile.icon"
              />
            </div>
          </section>
        </template>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import insightsApi, { type JourneyReport } from '~/services/insightsApi'
import { consoleBreadcrumb } from '~/utils/consoleBreadcrumbs'
import { chatStepLabel } from '~/utils/labels'

/**
 * How visits unfold, product by product.
 *
 * Every other report counts. This one follows: a conversation from its first
 * turn to the step it ended on, a question to whether a second came after it,
 * a search to whether anything was opened. A FoodChat that generates plans
 * nobody keeps, or a search always followed by another search, looks healthy
 * in every count and only shows up here.
 */

definePageMeta({ layout: 'default' })
useHead({ title: 'Journeys · Console' })

const breadcrumbItems = consoleBreadcrumb(
  { label: 'Analytics', icon: 'i-lucide-chart-column', to: '/console/insights' },
  { label: 'Journeys', icon: 'i-lucide-route' }
)

const range = useInsightsRange(30)
const report = ref<JourneyReport | null>(null)

const EMPTY_CHAT: JourneyReport['foodchat'] = {
  conversations: 0,
  turns: 0,
  median_turns: null,
  p90_turns: null,
  failed_turns: 0,
  busy_turns: 0,
  with_plan: 0,
  plans_generated: 0,
  plans_refined: 0,
  plans_saved: 0,
  conversations_saved: 0,
  save_rate: 0,
  sessions_linked: 0,
  truncated: false,
  paths: [],
  entries: [],
  exits: [],
  transitions: [],
  plans_per_conversation: [],
  plans_per_session: []
}

const chat = computed(() => report.value?.foodchat ?? EMPTY_CHAT)

const pct = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : `${value.toFixed(0)}%`

const chatTiles = computed(() => {
  const c = chat.value
  return [
    { label: 'Conversations', value: c.conversations, icon: 'i-lucide-messages-square' },
    { label: 'Turns, median', value: c.median_turns ?? '—', icon: 'i-lucide-repeat' },
    { label: 'Made a plan', value: pct(c.conversations ? (c.with_plan / c.conversations) * 100 : null), icon: 'i-lucide-utensils' },
    { label: 'Kept a plan', value: pct(c.with_plan ? c.save_rate : null), icon: 'i-lucide-bookmark-check' },
    { label: 'Plans made', value: c.plans_generated, icon: 'i-lucide-chef-hat' },
    { label: 'Refinements', value: c.plans_refined, icon: 'i-lucide-wand-sparkles' },
    { label: 'Plans saved', value: c.plans_saved, icon: 'i-lucide-bookmark' },
    { label: 'Failed turns', value: c.failed_turns, icon: 'i-lucide-triangle-alert' }
  ]
})

// The one sentence the tiles add up to, so the page says what it found.
const chatSentence = computed(() => {
  const c = chat.value
  if (!c.conversations) return 'No conversations in this period.'
  const refined = c.plans_generated ? Math.round((c.plans_refined / c.plans_generated) * 100) : 0
  return `${c.conversations.toLocaleString()} conversations; ${pct(c.conversations ? (c.with_plan / c.conversations) * 100 : 0)} made a plan, `
    + `${pct(c.save_rate)} of those kept one, and ${refined}% of plans were refinements of an earlier one.`
})

const exitColumns = [
  { key: 'step', label: 'Last step' },
  { key: 'conversations', label: 'Ended here', align: 'right' as const },
  { key: 'share', label: 'Share', align: 'right' as const, format: (v: unknown) => `${v}%` },
  { key: 'avg_turns', label: 'Turns', align: 'right' as const }
]
const entryColumns = [
  { key: 'step', label: 'First step' },
  { key: 'conversations', label: 'Conversations', align: 'right' as const },
  { key: 'share', label: 'Share', align: 'right' as const, format: (v: unknown) => `${v}%` }
]
const transitionColumns = [
  { key: 'from', label: 'After' },
  { key: 'to', label: 'Came' },
  { key: 'count', label: 'Times', align: 'right' as const }
]

const exitRows = computed(() => chat.value.exits.slice(0, 10))
const entryRows = computed(() => chat.value.entries.slice(0, 8))
// "Start → x" is the entries table again; it is left out here so the table
// is about what happens inside a conversation.
const transitionRows = computed(() =>
  chat.value.transitions.filter(row => row.from !== 'start').slice(0, 12)
)

const stepTone = (step: string) => {
  if (step === 'saved') return 'text-emerald-700 dark:text-emerald-300'
  if (step === 'error' || step === 'busy') return 'text-red-700 dark:text-red-300'
  return ''
}

const distributions = computed(() => {
  const c = chat.value
  const sum = (rows: Array<{ count: number }>) => rows.reduce((n, row) => n + row.count, 0)
  return [
    {
      title: 'Plans per conversation',
      subtitle: 'How many plans one conversation produced, refinements included',
      rows: c.plans_per_conversation,
      total: sum(c.plans_per_conversation),
      empty: 'No conversations in this period.'
    },
    {
      title: 'Plans per visit',
      subtitle: `Across every conversation in one browser session — ${c.sessions_linked.toLocaleString()} sessions linked`,
      rows: c.plans_per_session,
      total: sum(c.plans_per_session),
      empty: 'No conversations linked to a session yet.'
    }
  ]
})

const scholarTiles = computed(() => {
  const q = report.value?.foodscholar
  if (!q) return []
  return [
    { label: 'Questions', value: q.questions, icon: 'i-lucide-message-circle-question' },
    { label: 'Sessions asking', value: q.sessions, icon: 'i-lucide-monitor-smartphone' },
    { label: 'Asked again', value: pct(q.sessions ? q.follow_up_rate : null), icon: 'i-lucide-repeat' },
    { label: 'Opened a source', value: pct(q.sessions ? q.citation_rate : null), icon: 'i-lucide-book-open' },
    { label: 'From cache', value: q.from_cache, icon: 'i-lucide-database' },
    { label: 'Rated unhelpful', value: q.rated_negative, icon: 'i-lucide-thumbs-down' }
  ]
})

const recipeTiles = computed(() => {
  const r = report.value?.recipes
  if (!r) return []
  return [
    { label: 'Searches', value: r.searches, icon: 'i-lucide-search' },
    { label: 'Found nothing', value: pct(r.searches ? r.zero_result_rate : null), icon: 'i-lucide-search-x' },
    { label: 'Sessions searching', value: r.sessions, icon: 'i-lucide-monitor-smartphone' },
    { label: 'Searched again', value: pct(r.sessions ? r.searched_again_rate : null), icon: 'i-lucide-repeat' },
    { label: 'Opened a result', value: pct(r.sessions ? r.opened_after_search_rate : null), icon: 'i-lucide-mouse-pointer-click' },
    { label: 'FoodChat found nothing', value: r.assistant_lookups_empty, icon: 'i-lucide-bot' }
  ]
})

// The board, narrowed to what a section is about, for the same period.
function boardLink(filter: { app?: string, did?: string }) {
  const query: Record<string, string> = {}
  if (filter.app) query.app = filter.app
  if (filter.did) query.did = filter.did
  return { path: '/console/insights/sessions', query }
}

async function load() {
  report.value = await insightsApi.getJourneys(range.value.days, range.value)
}

const { loading, failed, loadedAt, reload, busy } = useInsightsLoad(
  load,
  () => !chat.value.conversations
    && !(report.value?.foodscholar.questions)
    && !(report.value?.recipes.searches)
)

watch(range, () => {
  void reload()
}, { deep: true })

onMounted(() => {
  void reload()
})
</script>
