<template>
  <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbItems"
      class="mb-4"
    />
    <ConsoleInsightsNav />
    <UPageHeader
      title="Audience"
      description="Who is calling, in what language, and from what."
      :ui="{ root: 'relative py-8 border-b-0' }"
    >
      <template #links>
        <ConsoleInsightsRangeControl v-model="range" />
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="space-y-6">
        <UAlert
          v-if="loaded && !report"
          color="info"
          variant="subtle"
          icon="i-lucide-power-off"
          title="No audience report came back"
          description="Either activity analytics is switched off on the API or the analytics
            schema has not been applied. Nothing below distinguishes an audience of nobody from
            a recorder that is not running until it is on."
        />

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ConsoleStatsStatTile
            label="Signed-in events"
            :value="report?.signed_in_events ?? 0"
            icon="i-lucide-user-round-check"
          />
          <ConsoleStatsStatTile
            label="Guest events"
            :value="report?.guest_events ?? 0"
            icon="i-lucide-user-round"
          />
          <ConsoleStatsStatTile
            label="Households"
            :value="report?.households ?? 0"
            icon="i-lucide-home"
          />
          <UCard
            :ui="{ body: 'p-4' }"
            class="border border-gray-200/70 dark:border-white/10"
          >
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Signed-in share
            </p>
            <p class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
              {{ signedInShare }}%
            </p>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Of all events in the period
            </p>
          </UCard>
        </div>

        <!--
          Two columns from lg up. Client and language are shares of all the
          traffic and the question the page is opened with; role covers only
          the signed-in part of it and skew is a sanity check on the clock, so
          both sit alongside rather than under. The right column is short
          enough to pin, which keeps the role subset next to the split it is a
          subset of.
        -->
        <div class="grid gap-6 lg:grid-cols-3">
          <div class="space-y-6 lg:col-span-2">
            <ConsoleInsightsAudienceSplit
              title="By client"
              subtitle="Browser, SDK, agent or our own services"
              icon="i-lucide-monitor-smartphone"
              :rows="byClient"
              :names="CLIENT_NAMES"
              empty="No clients recorded."
              empty-hint="Every event carries the client that sent it, so an empty split means no events."
              empty-icon="i-lucide-monitor-smartphone"
            />
            <ConsoleInsightsAudienceSplit
              title="By language"
              subtitle="The interface locale the event was sent from"
              icon="i-lucide-languages"
              :rows="byLocale"
              :names="LOCALE_NAMES"
              empty="No locales recorded."
              empty-hint="A locale is attached by the client; older clients may send none at all."
              empty-icon="i-lucide-languages"
            />

            <!-- A trilingual product: the split is a planning input, not trivia. -->
            <p class="text-xs text-gray-500 dark:text-gray-400">
              WiseFood ships in English, Hungarian and Slovenian. A language whose share here is far
              below its share of the pilot is usually a translation gap or a broken default rather
              than a preference, so this split is worth reading against who was recruited, not on its
              own. Role counts are people, not events, and cover only signed-in activity — a guest
              holds no role, so the roles here describe a subset of the traffic above.
            </p>
          </div>

          <aside class="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <ConsoleInsightsTablePanel
              title="By role"
              subtitle="Experts against ordinary users"
              :rows="byRole"
              :columns="roleColumns"
              empty="No roles recorded."
              empty-hint="Roles are attached only to signed-in events; a guest-only period shows none."
              empty-icon="i-lucide-shield-user"
            />

            <UCard
              :ui="{ body: 'p-5' }"
              class="border border-gray-200/70 dark:border-white/10"
            >
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                Clock skew
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                The gap between the time a client stamped on an event and the time we received it
              </p>

              <ConsoleInsightsEmptyState
                v-if="!report"
                title="No skew measured."
                hint="Skew needs both timestamps; without a report there is nothing to compare."
                icon="i-lucide-clock-alert"
              />

              <template v-else>
                <dl class="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Events over five minutes out
                    </dt>
                    <dd class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                      {{ skew.events_over_5min.toLocaleString() }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Worst gap
                    </dt>
                    <dd class="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
                      {{ worstGap }}
                    </dd>
                  </div>
                </dl>

                <p class="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  This is here so a timeline that looks impossible has an explanation — a device with
                  a wrong clock, or a batch of events that sat in a closed laptop and arrived hours
                  later. It is not a fault to chase unless it is large or growing.
                </p>
              </template>
            </UCard>
          </aside>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import insightsApi, { type AudienceReport } from '~/services/insightsApi'
import { consoleBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })
useHead({ title: 'Audience · Console' })

const breadcrumbItems = consoleBreadcrumb(
  { label: 'Analytics', icon: 'i-lucide-chart-column', to: '/console/insights' },
  { label: 'Audience', icon: 'i-lucide-users' }
)

const route = useRoute()
const router = useRouter()

// The period lives in the query string so "the SDK share during the study" is
// a link somebody else can open and see the same thing.
const range = ref({ days: Number(route.query.days) || 30 })
const report = ref<AudienceReport | null>(null)
const loaded = ref(false)

/** Machine values as they are recorded, said in words a reader recognises. */
const CLIENT_NAMES: Record<string, string> = {
  web: 'Browser',
  browser: 'Browser',
  sdk: 'Python SDK',
  agent: 'Agent',
  internal: 'Internal service',
  api: 'Direct API'
}

const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  hu: 'Hungarian',
  sl: 'Slovenian'
}

const byClient = computed(() => report.value?.by_client ?? [])
const byLocale = computed(() => report.value?.by_locale ?? [])
const byRole = computed(() => report.value?.by_role ?? [])
const skew = computed(
  () => report.value?.clock_skew ?? { events_over_5min: 0, worst_seconds: null }
)

/*
 * Guest against signed-in as a share rather than two raw counts.
 *
 * The counts alone answer nothing: a hundred thousand guest events is either a
 * public catalogue doing its job or an authentication that stopped working,
 * and only the proportion tells them apart at a glance. Rounded to a whole
 * number because the tile takes an integer.
 */
const signedInShare = computed(() => {
  const signedIn = report.value?.signed_in_events ?? 0
  const total = signedIn + (report.value?.guest_events ?? 0)
  return total ? Math.round((signedIn / total) * 100) : 0
})

const roleColumns = [
  { key: 'role', label: 'Role' },
  { key: 'users', label: 'People', align: 'right' as const },
  { key: 'events', label: 'Events', align: 'right' as const }
]

const worstGap = computed(() => {
  const seconds = skew.value.worst_seconds
  if (seconds === null || seconds === undefined) return '—'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${(seconds / 3600).toFixed(1)}h`
})

async function load() {
  report.value = await insightsApi.getAudience(range.value.days)
  loaded.value = true
}

watch(range, () => {
  void router.replace({
    query: { ...(range.value.days === 30 ? {} : { days: String(range.value.days) }) }
  })
  void load()
}, { deep: true })

onMounted(() => { void load() })
</script>
