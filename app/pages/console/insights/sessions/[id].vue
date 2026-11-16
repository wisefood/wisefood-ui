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

    <!-- Who, when, on what — one block, read in a second. The reference is
         what somebody arrives holding (pasted from a page footer), so it stays
         findable, but it is no longer the heading: a person is. -->
    <header class="flex flex-col gap-4 py-6 lg:flex-row lg:items-start lg:justify-between">
      <div class="min-w-0 space-y-2">
        <p
          v-if="session?.started_at"
          class="text-sm text-gray-500 dark:text-gray-400"
        >
          {{ formatStart(session.started_at) }}
          <template v-if="lastedSeconds !== null">
            · lasted {{ formatDuration(lastedSeconds) }}
          </template>
        </p>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
          {{ heading }}
        </h1>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-300">
          <NuxtLink
            v-for="person in people"
            :key="person.user_id || person.member_id || 'unknown'"
            :to="`/console/insights/users/${encodeURIComponent(person.user_id || person.member_id || '')}`"
            class="inline-flex items-center gap-1 text-brand-600 hover:underline dark:text-brand-300"
          >
            <UIcon
              name="i-lucide-user"
              class="h-3.5 w-3.5"
            />
            Their other visits
          </NuxtLink>
          <ConsoleInsightsDeviceGlyphs
            v-if="hardware"
            :os="hardware.os"
            :os-version="hardware.os_version"
            :browser="hardware.browser"
            :browser-version="hardware.browser_version"
            :device-type="hardware.device_type"
            labels
            size="sm"
          />
          <span v-if="hardware?.country">{{ countryFlag(hardware.country) }} {{ hardware.country }}</span>
          <span
            v-for="app in products"
            :key="app.product"
            class="inline-flex items-center gap-1"
          >
            <UIcon
              :name="app.icon"
              class="h-3.5 w-3.5 opacity-70"
            />{{ app.name }}
          </span>
        </div>
        <p class="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <span>Reference</span>
          <span class="break-all font-mono text-gray-600 dark:text-gray-300">{{ sessionId }}</span>
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
            :aria-label="copied ? 'Copied' : 'Copy the reference'"
            @click="copyReference"
          />
        </p>
      </div>

      <!-- Reading session after session from a filtered list, without going
           back to it each time — the way every replay tool is used. -->
      <div class="flex shrink-0 items-center gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-list"
          :to="{ path: '/console/insights/sessions', query: trail.query }"
        >
          Back to the list
        </UButton>
        <template v-if="around.position">
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-chevron-left"
            :disabled="!around.previous"
            :to="around.previous ? `/console/insights/sessions/${encodeURIComponent(around.previous)}` : undefined"
            aria-label="Previous session in the list"
          />
          <span class="text-xs tabular-nums text-gray-500 dark:text-gray-400">{{ around.position }} of {{ around.total }}</span>
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-chevron-right"
            :disabled="!around.next"
            :to="around.next ? `/console/insights/sessions/${encodeURIComponent(around.next)}` : undefined"
            aria-label="Next session in the list"
          />
        </template>
      </div>
    </header>

    <UPageBody class="mt-0">
      <div class="space-y-6">
        <UAlert
          v-if="status === 'empty'"
          color="warning"
          variant="soft"
          icon="i-lucide-search-x"
          title="No activity recorded under that reference"
          description="Check the reference is complete. A session also disappears once its activity ages out of the retention window, and one that never did anything was never recorded."
        />

        <UCard
          v-if="failed"
          :ui="{ body: 'p-0' }"
          class="border border-gray-200/70 dark:border-white/10"
        >
          <ConsoleInsightsEmptyState
            failed
            :title="session ? 'Part of this session could not be loaded' : 'This session could not be loaded'"
            :hint="session
              ? 'The device request failed, so the device tab may be missing or stale. This is not an empty session — retry.'
              : 'The request to the API failed. This is not a missing session — retry, and if it persists check the gateway.'"
          />
        </UCard>

        <div
          v-if="loading && !session"
          class="animate-pulse space-y-4"
          role="status"
          aria-live="polite"
          aria-label="Loading this session"
        >
          <div class="h-24 rounded-lg bg-gray-200 dark:bg-zinc-800" />
          <div class="grid gap-6 lg:grid-cols-[15rem_1fr]">
            <div class="h-64 rounded-lg bg-gray-200 dark:bg-zinc-800" />
            <div class="h-96 rounded-lg bg-gray-200 dark:bg-zinc-800" />
          </div>
        </div>

        <template v-if="session">
          <!-- The visit in a few sentences, each one checkable against the
               story below. What somebody opening a session wants first. -->
          <UCard
            :ui="{ body: 'p-5' }"
            class="border border-gray-200/70 dark:border-white/10"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                In short
              </h2>
              <div class="flex flex-wrap gap-1.5">
                <UBadge
                  v-for="flag in visitFlags"
                  :key="flag.key"
                  :color="flag.tone === 'bad' ? 'error' : flag.tone === 'warn' ? 'warning' : 'success'"
                  variant="subtle"
                  :icon="flag.icon"
                >
                  {{ flag.label }}
                </UBadge>
              </div>
            </div>
            <ul class="mt-3 space-y-1.5 text-sm text-gray-700 dark:text-gray-200">
              <li
                v-for="line in headline"
                :key="line"
                class="flex gap-2"
              >
                <span class="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                <span>{{ line }}</span>
              </li>
            </ul>
            <p
              v-if="!story"
              class="mt-2 text-sm text-gray-500 dark:text-gray-400"
            >
              The gateway did not send this session's story; it is older than this page. The other tabs still work.
            </p>
          </UCard>

          <UTabs
            v-model="tab"
            :items="tabs"
            variant="link"
            class="w-full"
            :ui="{ content: 'w-full pt-6', list: 'overflow-x-auto', trigger: 'shrink-0' }"
          >
            <template #story>
              <div class="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
                <aside class="hidden lg:sticky lg:top-6 lg:block lg:self-start">
                  <ConsoleInsightsSessionStoryOutline
                    :chapters="shownChapters"
                    :titles="titles"
                    :active="activeChapter"
                    @select="goToChapter"
                  />
                </aside>

                <div class="min-w-0 space-y-4">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <!-- Three readings of the same visit: what they did, only
                         where it went wrong, or every recorded step. -->
                    <div
                      class="inline-flex rounded-lg border border-gray-200 p-0.5 dark:border-white/10"
                      role="group"
                      aria-label="What to show"
                    >
                      <button
                        v-for="option in VIEWS"
                        :key="option.value"
                        type="button"
                        class="rounded-md px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        :class="view === option.value
                          ? 'bg-gray-100 font-medium text-gray-900 dark:bg-white/10 dark:text-white'
                          : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'"
                        :aria-pressed="view === option.value"
                        @click="view = option.value"
                      >
                        {{ option.label }}
                      </button>
                    </div>
                    <span class="text-xs text-gray-400 dark:text-gray-500">
                      {{ story?.moments ?? 0 }} steps
                      <template v-if="story?.truncated">
                        (the first {{ story.moments.toLocaleString() }} of {{ story.total.toLocaleString() }})
                      </template>
                    </span>
                  </div>

                  <UCard
                    v-if="!shownChapters.length"
                    :ui="{ body: 'p-0' }"
                    class="border border-gray-200/70 dark:border-white/10"
                  >
                    <ConsoleInsightsEmptyState
                      :title="chapters.length ? 'Nothing went wrong in this visit' : 'Nothing to tell'"
                      :hint="chapters.length
                        ? 'No errors, failed turns, frustrated clicks or negative ratings. What they did shows the rest.'
                        : 'This session recorded requests but nothing a person did — usually a page that was opened and left. Every action tab has what there is.'"
                      icon="i-lucide-book-open"
                    />
                  </UCard>

                  <section
                    v-for="chapter in shownChapters"
                    :id="`chapter-${chapter.id}`"
                    :key="chapter.id"
                    :data-chapter="chapter.id"
                    class="scroll-mt-6"
                  >
                    <UCard
                      :ui="{ body: 'p-0' }"
                      class="border border-gray-200/70 dark:border-white/10"
                    >
                      <div class="flex flex-wrap items-start justify-between gap-2 border-b border-gray-200/70 px-4 py-3 dark:border-white/10">
                        <div class="flex min-w-0 items-start gap-2">
                          <UIcon
                            :name="productOf(chapter.product).icon"
                            class="mt-0.5 h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500"
                          />
                          <div class="min-w-0">
                            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                              {{ titles[chapter.id] }}
                            </h3>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                              {{ formatOffset(chapter.offset_seconds) }}<template v-if="chapter.duration_seconds">
                                for {{ formatDuration(chapter.duration_seconds) }}
                              </template>
                              <template v-if="chapterFacts(chapter).length">
                                · {{ chapterFacts(chapter).join(' · ') }}
                              </template>
                            </p>
                          </div>
                        </div>
                        <div class="flex flex-wrap gap-1">
                          <UBadge
                            v-for="flag in troubleFlags(chapter.counts)"
                            :key="flag.key"
                            :color="flag.tone === 'bad' ? 'error' : flag.tone === 'warn' ? 'warning' : 'success'"
                            variant="subtle"
                            size="sm"
                            :icon="flag.icon"
                          >
                            {{ flag.label }}
                          </UBadge>
                        </div>
                      </div>

                      <ol class="relative px-4 py-2">
                        <!-- The thread the moments hang on, through the dots. -->
                        <span
                          class="absolute bottom-4 left-[6rem] top-4 w-px bg-gray-200 dark:bg-white/10"
                          aria-hidden="true"
                        />
                        <template
                          v-for="row in visibleRows(chapter)"
                          :key="row.key"
                        >
                          <li
                            v-if="row.pause"
                            class="grid grid-cols-[3.75rem_1.75rem_1fr] gap-x-2 py-1"
                          >
                            <span />
                            <span />
                            <span class="text-xs italic text-gray-400 dark:text-gray-500">paused {{ formatPause(row.pause) }}</span>
                          </li>
                          <ConsoleInsightsSessionStoryMoment
                            v-else-if="row.moment"
                            :moment="row.moment"
                          />
                        </template>
                      </ol>
                    </UCard>
                  </section>

                  <p
                    v-if="hiddenChapters"
                    class="text-xs text-gray-400 dark:text-gray-500"
                  >
                    {{ hiddenNote }}
                  </p>
                </div>
              </div>
            </template>

            <template #cost>
              <div class="space-y-6">
                <UCard
                  :ui="{ body: 'p-4' }"
                  class="border border-gray-200/70 dark:border-white/10"
                >
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Model spend in this session
                  </p>
                  <p class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    ${{ session.cost_usd.toFixed(4) }}
                  </p>
                  <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {{ session.llm_calls }} calls · {{ session.total_tokens.toLocaleString() }} tokens
                    <template v-if="unpricedCalls">
                      · {{ unpricedCalls }} call{{ unpricedCalls === 1 ? '' : 's' }} unpriced, so the total is a floor
                    </template>
                  </p>
                </UCard>
                <ConsoleInsightsSessionLlmCalls :calls="session.llm_calls_detail ?? []" />
              </div>
            </template>

            <template #device>
              <div class="space-y-6">
                <ConsoleInsightsDeviceHeader :device="hardware" />
                <div class="grid gap-6 lg:grid-cols-2">
                  <div class="min-w-0 space-y-6">
                    <!-- Requests are the gateway's view of trouble; the cards
                         beside them are the browser's. -->
                    <UCard
                      :ui="{ body: 'p-4' }"
                      class="border border-gray-200/70 dark:border-white/10"
                    >
                      <dl class="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <dt class="text-gray-500 dark:text-gray-400">
                            Failed requests
                          </dt>
                          <dd class="mt-1 text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
                            {{ (session.errors ?? 0).toLocaleString() }}
                          </dd>
                        </div>
                        <div>
                          <dt class="text-gray-500 dark:text-gray-400">
                            Our fault (5xx)
                          </dt>
                          <dd
                            class="mt-1 text-xl font-semibold tabular-nums"
                            :class="session.server_errors ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'"
                          >
                            {{ (session.server_errors ?? 0).toLocaleString() }}
                          </dd>
                        </div>
                        <div>
                          <dt class="text-gray-500 dark:text-gray-400">
                            Longest wait
                          </dt>
                          <dd class="mt-1 text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
                            {{ slowestRequest }}
                          </dd>
                        </div>
                      </dl>
                    </UCard>
                    <ConsoleInsightsSessionErrorList :errors="device?.errors ?? []" />
                  </div>
                  <div class="min-w-0 space-y-6">
                    <ConsoleInsightsSessionFrustration :items="device?.frustration ?? []" />
                    <ConsoleInsightsSessionVitals :vitals="device?.vitals ?? []" />
                  </div>
                </div>
              </div>
            </template>

            <template #raw>
              <ConsoleInsightsSessionTimeline
                :entries="session.timeline"
                :truncated="session.timeline_truncated"
                :total="session.timeline_total"
                :offset="session.timeline_offset"
                :limit="session.timeline_limit"
                :loading="pagingTimeline"
                @page="loadTimelinePage"
              />
            </template>
          </UTabs>
        </template>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useInsightsLoad } from '~/composables/useInsightsLoad'
import { useSessionTrail } from '~/composables/useSessionTrail'
import insightsApi, {
  type SessionDevice,
  type SessionSummary,
  type StoryChapter,
  type StoryMoment
} from '~/services/insightsApi'
import { consoleBreadcrumb } from '~/utils/consoleBreadcrumbs'
import { countryFlag, formatDuration } from '~/utils/deviceIcons'
import {
  PAUSE_SECONDS,
  QUIET_KINDS,
  chapterFacts,
  chapterTitles,
  formatOffset,
  formatPause,
  momentTone,
  productOf,
  storyHeadline,
  storyTotals,
  troubleFlags
} from '~/utils/sessionStory'

/**
 * One visit, told as a story.
 *
 * This page used to be a panel per data source — counts, conversations,
 * questions, a raw timeline, searches, errors, model calls, feedback, vitals —
 * and nobody could say what a visit had been about without lining them up by
 * hand. Session replay tools settled on one shape for this (Sentry's chapters,
 * PostHog's activity, Langfuse's conversation view): a short summary, then the
 * visit in order, grouped into what the person was doing, with the evidence
 * opening in place. That is this page. The panels that are not the story —
 * cost, the device, every raw action — are tabs behind it.
 *
 * Addressable by its id, as before: the footer reference is pasted here.
 */

definePageMeta({ layout: 'default' })

const route = useRoute()
const sessionId = String(route.params.id ?? '')

useHead({ title: `${sessionId} · Console` })

const breadcrumbItems = consoleBreadcrumb(
  { label: 'Analytics', icon: 'i-lucide-chart-column', to: '/console/insights' },
  { label: 'Sessions', icon: 'i-lucide-monitor-smartphone', to: '/console/insights/sessions' },
  { label: sessionId, icon: 'i-lucide-monitor-smartphone' }
)

const session = ref<SessionSummary | null>(null)
const device = ref<SessionDevice | null>(null)
const hardware = computed(() => device.value?.device ?? null)

const { trail, neighbours } = useSessionTrail()
const around = computed(() => neighbours(sessionId))

const story = computed(() => session.value?.story ?? null)
const chapters = computed<StoryChapter[]>(() => story.value?.chapters ?? [])
const titles = computed(() => chapterTitles(chapters.value))
const headline = computed(() => storyHeadline(story.value))
const visitFlags = computed(() => troubleFlags(storyTotals(story.value)))

// Only people who can be linked to: a row with neither id is a count.
const people = computed(() =>
  (session.value?.users ?? []).filter(row => row.user_id || row.member_id)
)

/*
 * A person when the visit has one. Consent is opt-in, so most visits are
 * anonymous — said plainly rather than as a missing value.
 */
const heading = computed(() => {
  const person = people.value[0]
  if (!person) return 'Anonymous visitor'
  if (person.display_name && person.resolved) return person.display_name
  return person.username || 'A signed-in person'
})

const products = computed(() => {
  const seen = new Set(chapters.value.map(c => c.product).filter(p => p !== 'other'))
  return [...seen].map(product => ({ product, ...productOf(product) }))
})

const formatStart = (value: string) => {
  const when = new Date(value)
  return Number.isNaN(when.getTime())
    ? '—'
    : when.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const lastedSeconds = computed(() => {
  const s = session.value
  if (!s) return null
  if (s.duration_seconds !== null && s.duration_seconds !== undefined) return s.duration_seconds
  if (!s.started_at || !s.ended_at) return null
  const ms = new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()
  return Number.isFinite(ms) && ms >= 0 ? Math.round(ms / 1000) : null
})

const slowestRequest = computed(() => {
  const ms = session.value?.slowest_request_ms
  return ms === null || ms === undefined ? '—' : `${ms.toLocaleString()}ms`
})

const unpricedCalls = computed(() =>
  (session.value?.llm_calls_detail ?? []).filter(call => call.cost_usd === null || call.cost_usd === undefined).length
)

const copied = ref(false)
async function copyReference() {
  try {
    await navigator.clipboard.writeText(sessionId)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch { /* the reference is on screen to select by hand */ }
}

// Short labels: four of them have to fit across a phone.
const tabs = [
  { label: 'Story', value: 'story', slot: 'story' as const, icon: 'i-lucide-book-open' },
  { label: 'Cost', value: 'cost', slot: 'cost' as const, icon: 'i-lucide-coins' },
  { label: 'Device', value: 'device', slot: 'device' as const, icon: 'i-lucide-monitor-smartphone' },
  { label: 'Every action', value: 'raw', slot: 'raw' as const, icon: 'i-lucide-list' }
]
const tab = ref('story')

const VIEWS = [
  { value: 'story', label: 'What they did' },
  { value: 'trouble', label: 'What went wrong' },
  { value: 'all', label: 'Everything' }
] as const
type View = typeof VIEWS[number]['value']
const view = ref<View>('story')

interface Row { key: string, moment?: StoryMoment, pause?: number }

/*
 * The moments this view shows, with a line for each long pause between them.
 * Pauses are measured between the moments on screen, not the ones hidden: a
 * page visit in between does not make four minutes of reading any shorter.
 */
function visibleRows(chapter: StoryChapter): Row[] {
  const keep = (m: StoryMoment) => {
    if (view.value === 'all') return true
    if (view.value === 'trouble') return ['bad', 'warn'].includes(momentTone(m))
    return !QUIET_KINDS.has(m.kind)
  }
  const rows: Row[] = []
  let previous: number | null = null
  for (const moment of chapter.moments) {
    if (!keep(moment)) continue
    if (previous !== null && moment.offset_seconds - previous >= PAUSE_SECONDS && view.value !== 'trouble') {
      rows.push({ key: `pause-${moment.id}`, pause: moment.offset_seconds - previous })
    }
    rows.push({ key: `m-${moment.id}`, moment })
    previous = moment.offset_seconds
  }
  return rows
}

/*
 * A part of the visit with nothing in this view is left out, outline and all:
 * a card that says "nothing here" for a landing page is the clutter this page
 * replaced. Everything shows every part.
 */
const shownChapters = computed(() =>
  view.value === 'all' ? chapters.value : chapters.value.filter(chapter => visibleRows(chapter).length)
)
const hiddenChapters = computed(() => chapters.value.length - shownChapters.value.length)
const hiddenNote = computed(() => {
  const n = hiddenChapters.value
  const parts = `${n} part${n === 1 ? '' : 's'} of the visit ${n === 1 ? 'has' : 'have'} nothing to show here`
  return view.value === 'story' ? `${parts}: only page visits, which Everything shows.` : `${parts}.`
})

/*
 * The outline follows the reading: whichever chapter's top has passed the top
 * of the window is the one being read.
 */
const activeChapter = ref<number | null>(null)
let observer: IntersectionObserver | null = null

function observeChapters() {
  observer?.disconnect()
  if (typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
    const first = visible[0]
    if (first) activeChapter.value = Number((first.target as HTMLElement).dataset.chapter)
  }, { rootMargin: '0px 0px -60% 0px' })
  document.querySelectorAll<HTMLElement>('section[data-chapter]').forEach(el => observer?.observe(el))
}

function goToChapter(id: number) {
  activeChapter.value = id
  document.getElementById(`chapter-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

watch([shownChapters, tab], async () => {
  await nextTick()
  if (tab.value === 'story') observeChapters()
})
onBeforeUnmount(() => observer?.disconnect())

const timelineOffset = ref(0)

async function load() {
  // In parallel: the device half is supporting evidence and must never make
  // the story wait; either failing leaves the other's sections intact.
  const [summary, hardwareRow] = await Promise.all([
    insightsApi.getSession(sessionId, { offset: timelineOffset.value }),
    insightsApi.getSessionDevice(sessionId)
  ])
  session.value = summary
  device.value = hardwareRow
}

const { status, loading, failed, loadedAt, reload, busy } = useInsightsLoad(load, () => !session.value)

const pagingTimeline = ref(false)

async function loadTimelinePage(offset: number) {
  timelineOffset.value = Math.max(0, offset)
  pagingTimeline.value = true
  try {
    await reload()
  } finally {
    pagingTimeline.value = false
  }
}

onMounted(() => {
  void reload()
})
</script>
