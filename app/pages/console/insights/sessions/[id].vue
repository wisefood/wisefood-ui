<template>
  <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbItems"
      class="mb-4"
    />
    <!-- The one Refresh on the page. It used to sit in the header as well,
         which was two buttons for one action — the Nav's carries the "as of"
         time with it, which is the half the header's never had. -->
    <ConsoleInsightsNav
      :loaded-at="loadedAt"
      :refreshing="busy"
      @refresh="reload"
    />
    <UPageHeader
      description="Everything done in this session, in order."
      :ui="{ root: 'relative py-8 border-b-0' }"
    >
      <!-- The reference is what somebody arrives here holding — they pasted it
           out of a page footer — so it is the heading rather than a category
           word above one. Monospace because it is a grouped alphanumeric code
           and comparing it against the one in a support message is done
           character by character. -->
      <template #title>
        <span class="break-all font-mono">{{ sessionId }}</span>
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="space-y-6">
        <!-- Only once the fetch has come back with nothing. During the fetch
             this used to flash for every session; after a failure it said
             "no activity" about a reference that was never looked up. -->
        <UAlert
          v-if="status === 'empty'"
          color="warning"
          variant="soft"
          icon="i-lucide-search-x"
          title="No activity recorded under that reference"
          :description="notFoundHint"
        />

        <!-- Two requests, so failure has two shapes: nothing came back, or the
             summary did and the device half did not. The second still renders
             what arrived below — a page with a timeline and no device header
             is a page with a gap, not a blank page — and the notice says so. -->
        <UCard
          v-if="failed"
          :ui="{ body: 'p-0' }"
          class="border border-gray-200/70 dark:border-white/10"
        >
          <ConsoleInsightsEmptyState
            failed
            :title="session ? 'Part of this session could not be loaded' : 'This session could not be loaded'"
            :hint="session
              ? 'The device request failed, so the hardware, errors, frustration and vitals sections may be missing or stale. This is not an empty session — retry.'
              : 'The request to the API failed. This is not a missing session — retry, and if it persists check the gateway.'"
          />
        </UCard>

        <div
          v-if="loading && !session"
          class="animate-pulse space-y-6"
          role="status"
          aria-live="polite"
          aria-label="Loading this session"
        >
          <div class="h-4 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
          <div class="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div
              v-for="n in 6"
              :key="n"
              class="h-20 rounded-lg bg-gray-200 dark:bg-zinc-800"
            />
          </div>
          <div class="grid gap-6 lg:grid-cols-3">
            <div class="h-96 rounded-lg bg-gray-200 lg:col-span-2 dark:bg-zinc-800" />
            <div class="h-64 rounded-lg bg-gray-200 dark:bg-zinc-800" />
          </div>
        </div>

        <template v-if="session">
          <div class="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
            <span>
              <span class="text-gray-400 dark:text-gray-500">Started</span>
              {{ formatWhen(session.started_at) }}
            </span>
            <span>
              <span class="text-gray-400 dark:text-gray-500">Ended</span>
              {{ formatWhen(session.ended_at) }}
            </span>
            <span>
              <span class="text-gray-400 dark:text-gray-500">Lasted</span>
              {{ formatDuration(lastedSeconds) }}
            </span>
          </div>

          <!-- Who, if anyone. Consent is opt-in, so an unattributed session is
               the ordinary case and is worded as a fact rather than a gap; when
               there is an identity it links on, because the next question is
               always what else that person did. -->
          <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <span class="text-gray-400 dark:text-gray-500">Person</span>
            <template v-if="people.length">
              <NuxtLink
                v-for="person in people"
                :key="person.user_id || person.member_id || 'unknown'"
                :to="`/console/insights/users/${encodeURIComponent(person.user_id || person.member_id || '')}`"
                class="max-w-full break-all font-mono text-xs text-brand-600 hover:underline dark:text-brand-300"
              >
                {{ person.user_id || person.member_id }}
              </NuxtLink>
            </template>
            <span
              v-else
              class="text-gray-500 dark:text-gray-400"
            >
              not attributed — nobody in this session had agreed to be named, which is the usual
              case and does not affect any of the counts below
            </span>
          </div>

          <div class="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <ConsoleStatsStatTile
              v-for="stat in stats"
              :key="stat.label"
              :label="stat.label"
              :value="stat.value"
              :icon="stat.icon"
            />
          </div>

          <!-- The trouble band. Split out from the counts above because these
               four answer a different question — not what they did, but whether
               it worked — and that is what somebody opening this page is here
               for. -->
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <UCard
              :ui="{ body: 'p-4' }"
              class="border"
              :class="failedCount
                ? 'border-amber-300/70 dark:border-amber-500/30'
                : 'border-gray-200/70 dark:border-white/10'"
            >
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Failed actions
              </p>
              <p
                class="mt-1 text-2xl font-semibold tabular-nums"
                :class="failedCount ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'"
              >
                {{ failedCount.toLocaleString() }}
              </p>
              <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                requests that came back 4xx or 5xx
              </p>
            </UCard>

            <UCard
              :ui="{ body: 'p-4' }"
              class="border"
              :class="serverFailedCount
                ? 'border-red-300/70 dark:border-red-500/30'
                : 'border-gray-200/70 dark:border-white/10'"
            >
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Our fault
              </p>
              <p
                class="mt-1 text-2xl font-semibold tabular-nums"
                :class="serverFailedCount ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'"
              >
                {{ serverFailedCount.toLocaleString() }}
              </p>
              <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                5xx — the rest were rejected requests
              </p>
            </UCard>

            <UCard
              :ui="{ body: 'p-4' }"
              class="border border-gray-200/70 dark:border-white/10"
            >
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Longest wait
              </p>
              <p class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                {{ slowestRequest }}
              </p>
              <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                the worst single request they sat through
              </p>
            </UCard>

            <UCard
              :ui="{ body: 'p-4' }"
              class="border border-gray-200/70 dark:border-white/10"
            >
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Products used
              </p>
              <div
                v-if="apps.length"
                class="mt-2 flex flex-wrap gap-1.5"
              >
                <UBadge
                  v-for="app in apps"
                  :key="app.app"
                  color="neutral"
                  variant="subtle"
                  size="sm"
                  :title="`${app.events.toLocaleString()} actions`"
                >
                  {{ app.app || 'unnamed' }}
                </UBadge>
              </div>
              <p
                v-else
                class="mt-1 text-sm text-gray-400 dark:text-gray-500"
              >
                nothing attributed to a product
              </p>
            </UCard>
          </div>

          <!-- Full width, with the counts, rather than in the rail: its facts are
               laid out four abreast and a third of the page turns them into a
               column of broken words. It is a header for the session anyway. -->
          <ConsoleInsightsDeviceHeader :device="device?.device ?? null" />

          <!-- Two thirds for what is read in order — the timeline, then what was
               searched, what broke, and what the models were asked — and a third
               for what is glanced at while reading it. Stacked, this page was
               eight full-width panels deep and the timeline sat under half of
               them. -->
          <div class="grid gap-6 lg:grid-cols-3">
            <div class="min-w-0 space-y-6 lg:col-span-2">
              <ConsoleInsightsSessionTimeline
                :entries="session.timeline"
                :truncated="session.timeline_truncated"
                :total="session.timeline_total"
                :offset="session.timeline_offset"
                :limit="session.timeline_limit"
                :loading="pagingTimeline"
                @page="loadTimelinePage"
              />

              <ConsoleInsightsSessionSearchList :searches="session.searches_performed" />

              <ConsoleInsightsSessionErrorList :errors="device?.errors ?? []" />

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

            <!-- Evidence, not narrative: how it felt and where it went wrong are
                 checked against the timeline rather than read through, and all
                 three are short next to it — so the rail follows the scroll and
                 stays beside whatever part of the session is on screen. -->
            <aside class="min-w-0 space-y-6 lg:sticky lg:top-6 lg:self-start">
              <ConsoleInsightsSessionFrustration :items="device?.frustration ?? []" />

              <ConsoleInsightsSessionFeedbackList :items="session.feedback" />

              <ConsoleInsightsSessionVitals :vitals="device?.vitals ?? []" />
            </aside>
          </div>
        </template>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useInsightsLoad } from '~/composables/useInsightsLoad'
import insightsApi, { type SessionDevice, type SessionSummary } from '~/services/insightsApi'
import { consoleBreadcrumb } from '~/utils/consoleBreadcrumbs'
import { formatDuration } from '~/utils/deviceIcons'

/**
 * One session, addressable by its id.
 *
 * The page the footer reference is for: somebody quotes `k3f9-2xa7-lm4q` in a
 * support message and this is where it is pasted. Reaching a session only by
 * finding it in a list of recent ones would have made that reference useless
 * for anything older or busier than the list.
 *
 * It reads two endpoints rather than one. The summary knows what was done; the
 * device endpoint knows what it was done on and what broke doing it. Neither
 * alone answers "what went wrong for this person", and that is the only
 * question this page exists to answer, so both are fetched together and a
 * missing device response degrades to empty sections instead of a blank page.
 */

definePageMeta({ layout: 'default' })

const route = useRoute()
const sessionId = String(route.params.id ?? '')

useHead({ title: `${sessionId} · Console` })

const breadcrumbItems = consoleBreadcrumb(
  { label: 'Analytics', icon: 'i-lucide-chart-column', to: '/console/insights' },
  { label: 'Session board', icon: 'i-lucide-monitor-smartphone', to: '/console/insights/sessions' },
  { label: sessionId, icon: 'i-lucide-monitor-smartphone' }
)

/*
 * The endpoint has always returned more than the shared type spells out.
 *
 * These fields are declared here rather than in the service because the
 * service's `SessionSummary` is used by other callers that do not read them,
 * and every one is optional so that an older API — or a summary served from a
 * cache written before they existed — renders without throwing.
 */
type SessionExtras = {
  users: Array<{ user_id: string | null, member_id: string | null, events: number }>
  apps: Array<{ app: string, events: number }>
  duration_seconds: number | null
  errors: number
  server_errors: number
  slowest_request_ms: number | null
  llm_calls_detail: Array<{
    occurred_at: string | null
    app: string | null
    feature: string | null
    model: string | null
    input_tokens: number | null
    output_tokens: number | null
    total_tokens: number | null
    cost_usd: number | null
    latency_ms: number | null
    trace_id: string | null
  }>
}

const session = ref<(SessionSummary & Partial<SessionExtras>) | null>(null)
const device = ref<SessionDevice | null>(null)

const notFoundHint = computed(() =>
  'Check the reference is complete. A session also disappears once its activity ages out of the'
  + ' retention window, and one that never did anything was never recorded.'
)

const stats = computed(() => {
  const s = session.value
  if (!s) return []
  return [
    { label: 'Actions', value: s.events, icon: 'i-lucide-activity' },
    { label: 'Questions', value: s.questions_asked, icon: 'i-lucide-message-circle-question' },
    { label: 'Searches', value: s.searches, icon: 'i-lucide-search' },
    { label: 'Found nothing', value: s.searches_with_no_results, icon: 'i-lucide-search-x' },
    { label: 'Meal plans', value: s.meal_plans_generated, icon: 'i-lucide-utensils' },
    { label: 'Feedback', value: s.feedback_given, icon: 'i-lucide-message-square' }
  ]
})

// Only people who can be linked to: a row carrying neither id is a count, not
// a destination, and a link to an empty path would be a dead end.
const people = computed(() =>
  (session.value?.users ?? []).filter(row => row.user_id || row.member_id)
)

const apps = computed(() => session.value?.apps ?? [])

const failedCount = computed(() => session.value?.errors ?? 0)
const serverFailedCount = computed(() => session.value?.server_errors ?? 0)

// A dash, not a zero: no measurement and an instant response are not the same
// thing, and only one of them is good news.
const slowestRequest = computed(() => {
  const ms = session.value?.slowest_request_ms
  return ms === null || ms === undefined ? '—' : `${ms.toLocaleString()}ms`
})

/*
 * The server measures the span from first to last recorded action, which is
 * the honest figure. Fall back to the timestamps only when it did not send
 * one, rather than showing a dash for a session that plainly lasted a while.
 */
const lastedSeconds = computed(() => {
  const s = session.value
  if (!s) return null
  if (s.duration_seconds !== null && s.duration_seconds !== undefined) return s.duration_seconds
  if (!s.started_at || !s.ended_at) return null
  const ms = new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()
  return Number.isFinite(ms) && ms >= 0 ? Math.round(ms / 1000) : null
})

// Worth saying on the total rather than only in the table: a session with
// unpriced calls cost more than the figure above claims.
const unpricedCalls = computed(() =>
  (session.value?.llm_calls_detail ?? []).filter(call => call.cost_usd === null || call.cost_usd === undefined).length
)

const formatWhen = (value: string | null) => {
  if (!value) return '—'
  const when = new Date(value)
  return Number.isNaN(when.getTime()) ? '—' : when.toLocaleString()
}

/*
 * The timeline pages independently of everything else on this page.
 *
 * A busy session runs to thousands of actions and the server caps a page at
 * 500. Refetching the whole summary for a page of the timeline is a little
 * wasteful, but the alternative is a second endpoint for one list, and the
 * summary is a single indexed round trip.
 */
const timelineOffset = ref(0)

async function load() {
  // In parallel: the device half is supporting evidence, so it must never make
  // the summary wait, and either failing leaves the other's sections intact.
  const [summary, hardware] = await Promise.all([
    insightsApi.getSession(sessionId, { offset: timelineOffset.value }),
    insightsApi.getSessionDevice(sessionId)
  ])
  session.value = summary
  device.value = hardware
}

// Empty is "no such session": a summary with an empty timeline still has
// counts, a duration and a person to show.
const { status, loading, failed, loadedAt, reload, busy } = useInsightsLoad(load, () => !session.value)

// Paging goes through `reload()` rather than `load()` so the "as of" time and
// the failure state stay true for what is on screen — the timeline is part of
// the same response as everything else.
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
