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
      title="Sessions"
      description="Each visit, what it came to, and whether it went well. Open one to read it as a story."
      :ui="{ root: 'relative py-8 border-b-0' }"
    >
      <template #links>
        <ConsoleInsightsRangeControl v-model="range" />
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="space-y-4">
        <p
          v-if="customEndIgnored"
          class="text-xs text-amber-600 dark:text-amber-400"
        >
          The list reads a window back from now, so the end date is not applied here — it is showing
          the last {{ boardDays }} days.
        </p>

        <!-- Filters in the order people reach for them: which product, then
             what happened — "the FoodChat visits somebody rated down" is the
             question, far more often than a browser. The machine filters are
             still here, folded away until wanted. -->
        <div class="space-y-3">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div
              class="inline-flex shrink-0 rounded-lg border border-gray-200 p-0.5 dark:border-white/10"
              role="group"
              aria-label="Product"
            >
              <button
                v-for="product in PRODUCT_OPTIONS"
                :key="product.value"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                :class="filters.app === product.value
                  ? 'bg-gray-100 font-medium text-gray-900 dark:bg-white/10 dark:text-white'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'"
                :aria-pressed="filters.app === product.value"
                @click="filters.app = product.value"
              >
                <UIcon
                  v-if="product.icon"
                  :name="product.icon"
                  class="h-3.5 w-3.5"
                />
                {{ product.label }}
              </button>
            </div>
            <UInput
              v-model="searchInput"
              icon="i-lucide-search"
              placeholder="Session reference, e.g. k3f9-2xa7"
              class="w-full font-mono lg:max-w-xs"
              autocomplete="off"
              aria-label="Search by session reference"
              @keydown.enter="commitSearch"
            />
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              :icon="showMore ? 'i-lucide-chevron-up' : 'i-lucide-sliders-horizontal'"
              class="lg:ml-auto"
              :aria-expanded="showMore"
              @click="showMore = !showMore"
            >
              More filters<template v-if="machineFilterCount">
                ({{ machineFilterCount }})
              </template>
            </UButton>
          </div>

          <div
            class="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="What happened"
          >
            <button
              v-for="quick in QUICK"
              :key="quick.value"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              :class="filters.activity === quick.value
                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400/50 dark:bg-brand-500/10 dark:text-brand-300'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5'"
              :aria-pressed="filters.activity === quick.value"
              @click="filters.activity = filters.activity === quick.value ? '' : quick.value"
            >
              <UIcon
                :name="quick.icon"
                class="h-3.5 w-3.5"
              />
              {{ quick.label }}
            </button>

            <!-- Arriving from a person's page narrows the list to them; a
                 filter you cannot see is a list that looks wrong. -->
            <button
              v-if="filters.userId"
              type="button"
              class="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-brand-500 bg-brand-50 px-2.5 py-1 text-left text-xs text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-brand-400/50 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20"
              :title="`Only this person's sessions: ${filters.userId}. Click to show everybody again.`"
              aria-label="Clear the person filter"
              @click="filters.userId = ''"
            >
              <UIcon
                name="i-lucide-user"
                class="h-3 w-3 shrink-0"
              />
              <span class="min-w-0 break-all font-mono">{{ filters.userId }}</span>
              <UIcon
                name="i-lucide-x"
                class="h-3 w-3 shrink-0"
              />
            </button>

            <UButton
              v-if="hasActiveFilters"
              color="neutral"
              variant="link"
              size="xs"
              @click="resetFilters"
            >
              Clear filters
            </UButton>
          </div>

          <UCard
            v-if="showMore"
            :ui="{ body: 'p-4' }"
            class="border border-gray-200/70 dark:border-white/10"
          >
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <USelectMenu
                v-model="filters.deviceType"
                :items="deviceOptions"
                value-key="value"
                label-key="label"
                leading-icon="i-lucide-monitor-smartphone"
                aria-label="Device type"
              />
              <USelectMenu
                v-model="filters.browser"
                :items="browserOptions"
                value-key="value"
                label-key="label"
                leading-icon="i-lucide-app-window"
                aria-label="Browser"
              />
              <USelectMenu
                v-model="filters.os"
                :items="osOptions"
                value-key="value"
                label-key="label"
                leading-icon="i-lucide-cpu"
                aria-label="Operating system"
              />
              <USelectMenu
                v-model="filters.country"
                :items="countryOptions"
                value-key="value"
                label-key="label"
                leading-icon="i-lucide-globe"
                aria-label="Country"
              />
            </div>
            <div class="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              <UCheckbox
                v-model="filters.hasErrors"
                label="Errors only"
              />
              <UCheckbox
                v-model="filters.includeBots"
                label="Include crawlers"
              />
            </div>
            <p
              v-if="board && board.bots"
              class="mt-2 text-xs text-gray-400 dark:text-gray-500"
            >
              {{ board.bots.toLocaleString() }} crawler session{{ board.bots === 1 ? '' : 's' }} in this period
              {{ filters.includeBots ? 'are included.' : 'are left out.' }}
            </p>
          </UCard>
        </div>

        <UCard
          v-if="loading && !board"
          :ui="{ body: 'p-0' }"
          class="border border-gray-200/70 dark:border-white/10"
        >
          <div
            class="animate-pulse divide-y divide-gray-100 px-5 dark:divide-zinc-800"
            role="status"
            aria-live="polite"
            aria-label="Loading sessions"
          >
            <div
              v-for="n in 8"
              :key="n"
              class="flex gap-6 py-4"
            >
              <span class="h-3 w-20 rounded bg-gray-200 dark:bg-zinc-800" />
              <span class="h-3 flex-1 rounded bg-gray-200 dark:bg-zinc-800" />
              <span class="h-3 w-24 rounded bg-gray-200 dark:bg-zinc-800" />
            </div>
          </div>
        </UCard>

        <UCard
          v-else-if="failed"
          :ui="{ body: 'p-0' }"
          class="border border-gray-200/70 dark:border-white/10"
        >
          <ConsoleInsightsEmptyState
            failed
            title="The sessions could not be loaded"
            hint="The request to the API failed. This is not an empty period and not a filter with no matches — retry, and if it persists check the gateway."
          />
        </UCard>

        <ConsoleInsightsSessionBoardTable
          v-else
          :rows="board?.sessions ?? []"
          title="Visits"
          :subtitle="tableSubtitle"
          :trail-query="trailQuery"
          :empty="board ? 'No sessions match these filters.' : 'No session records available.'"
          :empty-hint="board
            ? 'Widen the period, or clear a filter. Crawlers are left out unless you ask for them.'
            : 'Sessions appear once the analytics schema is applied and collection is switched on.'"
        >
          <template #actions>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ showingLabel }}</span>
          </template>

          <template #footer>
            <div
              v-if="board && board.total > pageSize"
              class="flex items-center justify-between gap-3 border-t border-gray-200/70 px-5 py-3 dark:border-white/10"
            >
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ showingLabel }}</span>
              <div class="flex gap-2">
                <UButton
                  color="neutral"
                  variant="outline"
                  size="xs"
                  icon="i-lucide-chevron-left"
                  :disabled="offset <= 0 || loading"
                  @click="page(-1)"
                >
                  Previous
                </UButton>
                <UButton
                  color="neutral"
                  variant="outline"
                  size="xs"
                  trailing-icon="i-lucide-chevron-right"
                  :disabled="offset + pageSize >= board.total || loading"
                  @click="page(1)"
                >
                  Next
                </UButton>
              </div>
            </div>
          </template>
        </ConsoleInsightsSessionBoardTable>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useInsightsLoad } from '~/composables/useInsightsLoad'
import { useInsightsRange } from '~/composables/useInsightsRange'
import insightsApi, { type SessionBoard } from '~/services/insightsApi'
import { consoleBreadcrumb } from '~/utils/consoleBreadcrumbs'

/**
 * Every session, filterable on every column.
 *
 * The question this page is opened with is never "show me all sessions" — it
 * is "the ones on Safari", "the ones that errored", "the one whose reference
 * is in this support message". So the filters are the page, and the table is
 * what falls out of them.
 *
 * All of that state lives in the URL. A filtered board is the thing worth
 * sending to somebody ("here, these are the broken iPhone sessions"), and a
 * board that could only be described in prose would have to be rebuilt by hand
 * at the other end.
 */

definePageMeta({ layout: 'default' })
useHead({ title: 'Sessions · Console' })

const breadcrumbItems = consoleBreadcrumb(
  { label: 'Analytics', icon: 'i-lucide-chart-column', to: '/console/insights' },
  { label: 'Sessions', icon: 'i-lucide-monitor-smartphone' }
)

const route = useRoute()
const router = useRouter()

const pageSize = 50

const DEFAULT_DAYS = 7
// The period is shared state: it reads the URL, then what was last chosen on
// any analytics page, then this default — and it writes `days`/`since`/`until`
// back to the URL itself, so nothing below touches those three keys.
const range = useInsightsRange(DEFAULT_DAYS)
const filters = reactive({
  // Set from the URL rather than typed here: the board is narrowed to a person
  // by following a link out of their page, so this filter arrives ready-made.
  userId: '',
  deviceType: '',
  browser: '',
  os: '',
  country: '',
  hasErrors: false,
  includeBots: false,
  search: '',
  app: '',
  activity: ''
})
const searchInput = ref('')
const offset = ref(0)
const board = ref<SessionBoard | null>(null)

const first = (value: unknown): string => {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : ''
  return typeof value === 'string' ? value : ''
}

function hydrateFromRoute() {
  filters.userId = first(route.query.user_id)
  filters.deviceType = first(route.query.device)
  filters.browser = first(route.query.browser)
  filters.os = first(route.query.os)
  filters.country = first(route.query.country)
  filters.hasErrors = first(route.query.errors) === '1'
  filters.includeBots = first(route.query.bots) === '1'
  filters.search = first(route.query.q)
  filters.app = first(route.query.app)
  filters.activity = first(route.query.did)
  searchInput.value = filters.search
  const start = Number(first(route.query.offset))
  offset.value = Number.isInteger(start) && start > 0 ? start : 0
}

// Only non-default values are written, so a plain board has a plain URL and a
// shared link says exactly what was narrowed and nothing else.
function buildRouteQuery(): Record<string, string> {
  const query: Record<string, string> = {}
  if (filters.userId) query.user_id = filters.userId
  if (filters.deviceType) query.device = filters.deviceType
  if (filters.browser) query.browser = filters.browser
  if (filters.os) query.os = filters.os
  if (filters.country) query.country = filters.country
  if (filters.hasErrors) query.errors = '1'
  if (filters.includeBots) query.bots = '1'
  if (filters.search) query.q = filters.search
  if (filters.app) query.app = filters.app
  if (filters.activity) query.did = filters.activity
  if (offset.value > 0) query.offset = String(offset.value)
  return query
}

/*
 * The period's keys, written the way `useInsightsRange` writes them.
 *
 * That composable mirrors the range into the URL on its own, and a filter
 * change here must not wipe it — but reading the keys back off `route.query`
 * is not safe either: a range change fires both its `router.replace` and ours
 * in the same tick, the router keeps only the later navigation, and at that
 * moment the URL still holds the old period. So they are carried from the
 * same source it writes from, not from what it has managed to write so far.
 */
function rangeQuery(): Record<string, string> {
  const query: Record<string, string> = {}
  if (range.value.since || range.value.until) {
    if (range.value.since) query.since = range.value.since
    if (range.value.until) query.until = range.value.until
  } else if (range.value.days !== DEFAULT_DAYS) {
    query.days = String(range.value.days)
  }
  return query
}

const hasActiveFilters = computed(() =>
  Boolean(filters.userId || filters.deviceType || filters.browser || filters.os
    || filters.country || filters.hasErrors || filters.includeBots || filters.search
    || filters.app || filters.activity)
)

/*
 * The board fetcher takes a day count, not a pair of dates. A custom range is
 * therefore honoured as "back to this start date" and the end date is called
 * out above rather than silently dropped.
 */
const boardDays = computed(() => {
  const since = range.value.since
  if (!since) return range.value.days
  const span = Math.ceil((Date.now() - new Date(since).getTime()) / 86_400_000)
  return Number.isFinite(span) && span > 0 ? span : range.value.days
})

const customEndIgnored = computed(() => {
  const until = range.value.until
  if (!until) return false
  return new Date(until).getTime() < Date.now() - 86_400_000
})

const option = (value: string, label: string) => ({ value, label })

const PRODUCT_OPTIONS = [
  { value: '', label: 'Every product', icon: '' },
  { value: 'foodchat', label: 'FoodChat', icon: 'i-lucide-messages-square' },
  { value: 'foodscholar', label: 'FoodScholar', icon: 'i-lucide-graduation-cap' },
  { value: 'recipewrangler', label: 'Recipes', icon: 'i-lucide-chef-hat' }
]

/*
 * What happened, one at a time. The first three are where somebody reviewing
 * starts: a person said an answer was wrong, clicked something that would not
 * respond, or hit an error. "Needs a look" is any of them.
 */
const QUICK = [
  { value: 'needs_look', label: 'Needs a look', icon: 'i-lucide-flag' },
  { value: 'rated_down', label: 'Rated something down', icon: 'i-lucide-thumbs-down' },
  { value: 'frustrated', label: 'Frustrated clicks', icon: 'i-lucide-mouse-pointer-click' },
  { value: 'plans', label: 'Made a meal plan', icon: 'i-lucide-utensils' },
  { value: 'saved_plans', label: 'Saved a meal plan', icon: 'i-lucide-bookmark-check' },
  { value: 'chat', label: 'Chatted with FoodChat', icon: 'i-lucide-messages-square' },
  { value: 'questions', label: 'Asked FoodScholar', icon: 'i-lucide-message-circle-question' },
  { value: 'searches', label: 'Searched', icon: 'i-lucide-search' },
  { value: 'recipes', label: 'Opened a recipe', icon: 'i-lucide-chef-hat' }
]

const deviceOptions = computed(() => [
  option('', 'Any device'),
  ...(board.value?.by_device ?? []).map(row => option(row.device_type, `${row.device_type} (${row.sessions})`))
])
const browserOptions = computed(() => [
  option('', 'Any browser'),
  ...(board.value?.by_browser ?? []).map(row => option(row.browser, `${row.browser} (${row.sessions})`))
])
const osOptions = computed(() => [
  option('', 'Any system'),
  ...(board.value?.by_os ?? []).map(row => option(row.os, `${row.os} (${row.sessions})`))
])
const countryOptions = computed(() => [
  option('', 'Anywhere'),
  ...(board.value?.by_country ?? []).map(row => option(row.country, `${row.country} (${row.sessions})`))
])

/** How many of the folded-away filters are on, so folding them never hides one. */
const machineFilterCount = computed(() =>
  [filters.deviceType, filters.browser, filters.os, filters.country, filters.hasErrors, filters.includeBots]
    .filter(Boolean).length
)
const showMore = ref(false)

/** The list's query as the session page will lead back to it. */
const trailQuery = computed(() => ({ ...rangeQuery(), ...buildRouteQuery() }))

const showingLabel = computed(() => {
  const total = board.value?.total ?? 0
  const shown = board.value?.sessions.length ?? 0
  if (!total || !shown) return 'nothing to show'
  return `showing ${offset.value + 1}–${offset.value + shown} of ${total.toLocaleString()}`
})

const tableSubtitle = computed(() =>
  hasActiveFilters.value
    ? 'Narrowed by the filters above, newest first.'
    : 'Newest first.'
)

function page(direction: number) {
  offset.value = Math.max(0, offset.value + direction * pageSize)
}

function resetFilters() {
  filters.userId = ''
  filters.deviceType = ''
  filters.browser = ''
  filters.os = ''
  filters.country = ''
  filters.hasErrors = false
  filters.includeBots = false
  filters.search = ''
  filters.app = ''
  filters.activity = ''
  searchInput.value = ''
}

async function load() {
  board.value = await insightsApi.getSessionBoard({
    days: boardDays.value,
    limit: pageSize,
    offset: offset.value,
    userId: filters.userId || undefined,
    deviceType: filters.deviceType || undefined,
    browser: filters.browser || undefined,
    os: filters.os || undefined,
    country: filters.country || undefined,
    // Undefined rather than false: the API reads `false` as "sessions with no
    // errors at all", which is a third filter nobody asked for here.
    hasErrors: filters.hasErrors ? true : undefined,
    search: filters.search || undefined,
    includeBots: filters.includeBots,
    app: filters.app || undefined,
    activity: filters.activity || undefined
  })
}

// Empty means the period held nothing at all — not merely that this page of
// rows is blank, which the breakdowns would contradict.
const { loading, failed, loadedAt, reload, busy } = useInsightsLoad(load, () => {
  const data = board.value
  if (!data) return true
  return !data.sessions.length && !data.by_device.length && !data.by_browser.length
    && !data.by_os.length && !data.by_country.length
})

function syncAndLoad() {
  void router.replace({ query: { ...rangeQuery(), ...buildRouteQuery() } })
  void reload()
}

// A keystroke is not a query. Committing on a pause (or on Enter) keeps a
// prefix search from firing a request per character typed.
let searchTimer: ReturnType<typeof setTimeout> | undefined
function commitSearch() {
  clearTimeout(searchTimer)
  filters.search = searchInput.value.trim()
}
watch(searchInput, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(commitSearch, 400)
})
onBeforeUnmount(() => clearTimeout(searchTimer))

// Any change to what is being asked for starts again at the first page —
// staying on page 4 of a result set that no longer has one reads as empty.
watch([filters, range], () => {
  if (offset.value !== 0) {
    offset.value = 0
    return
  }
  syncAndLoad()
}, { deep: true })

watch(offset, syncAndLoad)

hydrateFromRoute()
showMore.value = machineFilterCount.value > 0
onMounted(() => {
  void reload()
})
</script>
