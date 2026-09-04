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
      title="One person's activity"
      :ui="{ root: 'relative py-8 border-b-0' }"
    >
      <template #description>
        <span class="break-all font-mono text-sm text-gray-500 dark:text-gray-400">{{ userId }}</span>
      </template>
      <template #links>
        <ConsoleInsightsRangePicker v-model="days" />
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="space-y-6">
        <!-- Only when the fetch came back and came back with nothing. During the
             fetch this alert used to flash for every person; after a failure it
             said "nothing recorded" about a period that was never read. -->
        <UAlert
          v-if="status === 'empty'"
          color="warning"
          variant="soft"
          icon="i-lucide-user-x"
          title="Nothing recorded for this person in this period"
          description="Widen the period. Only people who agreed to be named are attributed at all, and activity ages out of the retention window."
        />

        <div
          v-if="loading && !totals"
          class="grid animate-pulse gap-4 sm:grid-cols-3 lg:grid-cols-6"
          role="status"
          aria-live="polite"
          aria-label="Loading this person's totals"
        >
          <div
            v-for="n in 6"
            :key="n"
            class="h-20 rounded-lg bg-gray-200 dark:bg-zinc-800"
          />
        </div>
        <div
          v-else-if="totals"
          class="grid gap-4 sm:grid-cols-3 lg:grid-cols-6"
        >
          <ConsoleStatsStatTile
            v-for="stat in stats"
            :key="stat.label"
            :label="stat.label"
            :value="stat.value"
            :icon="stat.icon"
          />
        </div>

        <!-- The sessions are what this page is read for; the totals are what
             they are read against. Stacked, the totals pushed the list below
             the fold every time the page opened, so from `lg` up they move
             into a rail beside it and both are on screen at once. -->
        <div class="grid gap-6 lg:grid-cols-3">
          <div class="min-w-0 space-y-6 lg:col-span-2">
            <!-- The board table renders rows or an empty message and nothing
                 else, so the two states it cannot tell apart from "no sessions"
                 are decided out here, in a card of the same shape. -->
            <UCard
              v-if="loading && !sessions.length"
              :ui="{ body: 'p-0' }"
              class="border border-gray-200/70 dark:border-white/10"
            >
              <div
                class="animate-pulse divide-y divide-gray-100 px-5 dark:divide-zinc-800"
                role="status"
                aria-live="polite"
                aria-label="Loading their sessions"
              >
                <div
                  v-for="n in 5"
                  :key="n"
                  class="flex gap-6 py-3"
                >
                  <span class="h-3 flex-1 rounded bg-gray-200 dark:bg-zinc-800" />
                  <span class="h-3 w-16 rounded bg-gray-200 dark:bg-zinc-800" />
                  <span class="h-3 w-12 rounded bg-gray-200 dark:bg-zinc-800" />
                </div>
              </div>
            </UCard>

            <template v-else>
              <!-- Shown beside the rows rather than instead of them: the two
                   requests can fail independently, and hiding the sessions
                   because the totals did not arrive would throw away the half
                   that worked. -->
              <UCard
                v-if="failed"
                :ui="{ body: 'p-0' }"
                class="border border-gray-200/70 dark:border-white/10"
              >
                <ConsoleInsightsEmptyState
                  failed
                  :title="sessions.length
                    ? 'Part of this page could not be loaded'
                    : 'This person\'s activity could not be loaded'"
                  hint="The request to the API failed. This is not an empty period — retry, and if it persists check the gateway."
                />
              </UCard>

              <ConsoleInsightsSessionBoardTable
                v-if="!failed || sessions.length"
                :rows="sessions"
                title="Their sessions"
                subtitle="Newest first. Open one to see everything that happened in it."
                :show-person="false"
                empty="No sessions recorded for this person in this period."
                :empty-hint="totals
                  ? 'Their actions were counted, but no session carried their identity — only sessions started after they consented can be attributed.'
                  : 'Widen the period, or check the reference. Sessions age out of the retention window.'"
              >
                <!-- Fifty is the cap, so the way to the rest cannot live only in the
                     footer that appears once it is hit — the board, already
                     narrowed to this person, is reachable whatever the count. -->
                <template #actions>
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span class="text-xs text-gray-500 dark:text-gray-400">{{ showingLabel }}</span>
                    <NuxtLink
                      :to="boardLink"
                      class="text-xs text-brand-600 hover:underline dark:text-brand-300"
                    >
                      Open on the session board
                    </NuxtLink>
                  </div>
                </template>
                <template #footer>
                  <p
                    v-if="boardTotal > sessions.length"
                    class="border-t border-gray-200/70 px-5 py-3 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400"
                  >
                    The {{ sessions.length }} most recent of {{ boardTotal.toLocaleString() }} are shown. The
                    <NuxtLink
                      :to="boardLink"
                      class="text-brand-600 hover:underline dark:text-brand-300"
                    >
                      session board
                    </NuxtLink>
                    pages through the rest.
                  </p>
                </template>
              </ConsoleInsightsSessionBoardTable>
            </template>
          </div>

          <!-- Three small cards against a list of up to fifty rows: the rail is
               always the shorter column, so it follows the scroll rather than
               scrolling off the top of it. -->
          <aside class="min-w-0 space-y-6 lg:sticky lg:top-6 lg:self-start">
            <div
              v-if="totals"
              class="grid gap-4 sm:grid-cols-3 lg:grid-cols-1"
            >
              <UCard
                :ui="{ body: 'p-4' }"
                class="border border-gray-200/70 dark:border-white/10"
              >
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Model spend
                </p>
                <p class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                  ${{ totals.cost_usd.toFixed(4) }}
                </p>
                <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {{ totals.total_tokens.toLocaleString() }} tokens
                </p>
              </UCard>
              <UCard
                :ui="{ body: 'p-4' }"
                class="border border-gray-200/70 dark:border-white/10"
              >
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  First seen
                </p>
                <p class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {{ formatWhen(totals.first_seen) }}
                </p>
              </UCard>
              <UCard
                :ui="{ body: 'p-4' }"
                class="border border-gray-200/70 dark:border-white/10"
              >
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Last seen
                </p>
                <p class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {{ formatWhen(totals.last_seen) }}
                </p>
              </UCard>
            </div>
          </aside>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useInsightsLoad } from '~/composables/useInsightsLoad'
import { useInsightsRange } from '~/composables/useInsightsRange'
import insightsApi, { type ClientSessionRow, type UserRow } from '~/services/insightsApi'
import { consoleBreadcrumb } from '~/utils/consoleBreadcrumbs'

/**
 * Everything one named person did.
 *
 * The console could count people and could open a session, but there was no
 * way to get from "this account is spending a lot" to "here is what they were
 * doing" — the two lists never met. This page is that join, and it is what the
 * person column on every session table now points at.
 *
 * Only people who consented to being named ever reach it. That is not a defect
 * to apologise for on the page, so the empty states say what was recorded
 * rather than what is missing.
 */

definePageMeta({ layout: 'default' })

const route = useRoute()
const userId = String(route.params.id ?? '')

useHead({ title: `${userId} · Console` })

const breadcrumbItems = consoleBreadcrumb(
  { label: 'Analytics', icon: 'i-lucide-chart-column', to: '/console/insights' },
  { label: 'People', icon: 'i-lucide-users', to: '/console/insights/users' },
  { label: userId, icon: 'i-lucide-user' }
)

const range = useInsightsRange(30)
// Preset-only picker: picking a day count also drops any custom dates carried
// over from a page that has them, since only the count is ever sent from here.
const days = computed({
  get: () => range.value.days,
  set: (value: number) => {
    range.value = { days: value }
  }
})

const totals = ref<UserRow | null>(null)
const sessions = ref<ClientSessionRow[]>([])
const boardTotal = ref(0)

const stats = computed(() => {
  const row = totals.value
  if (!row) return []
  return [
    { label: 'Actions', value: row.events, icon: 'i-lucide-activity' },
    { label: 'Sessions', value: row.sessions, icon: 'i-lucide-monitor-smartphone' },
    { label: 'Questions', value: row.questions_asked, icon: 'i-lucide-message-circle-question' },
    { label: 'Searches', value: row.searches, icon: 'i-lucide-search' },
    { label: 'Chat turns', value: row.chat_turns, icon: 'i-lucide-messages-square' },
    { label: 'Sessions on file', value: boardTotal.value, icon: 'i-lucide-list' }
  ]
})

const showingLabel = computed(() => {
  if (!boardTotal.value) return 'nothing to show'
  return `showing ${sessions.value.length} of ${boardTotal.value.toLocaleString()}`
})

// Carries the person through, or the link sends somebody looking for one
// person's sessions to a board showing everybody's.
const boardLink = computed(() =>
  `/console/insights/sessions?days=${days.value}&user_id=${encodeURIComponent(userId)}`
)

const formatWhen = (value: string | null) => {
  if (!value) return '—'
  const when = new Date(value)
  return Number.isNaN(when.getTime()) ? '—' : when.toLocaleString()
}

async function load() {
  // There is no per-user endpoint; the totals live in the same ranked list the
  // people page renders, so the row is picked out of it rather than counted
  // again here where it could disagree with that page.
  const [people, board] = await Promise.all([
    insightsApi.getUsers(days.value, 200),
    insightsApi.getSessionBoard({ userId, days: days.value, limit: 50 })
  ])
  totals.value = people.find(row => row.user_id === userId) ?? null
  sessions.value = board?.sessions ?? []
  boardTotal.value = board?.total ?? 0
}

const { status, loading, failed, loadedAt, reload, busy } = useInsightsLoad(
  load,
  () => !totals.value && !sessions.value.length
)

watch(range, () => {
  void reload()
}, { deep: true })
onMounted(() => {
  void reload()
})
</script>
