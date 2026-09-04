<template>
  <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbItems"
      class="mb-4"
    />
    <ConsoleInsightsNav />

    <ConsoleInsightsEmptyState
      v-if="loaded && !detail"
      title="No such failure."
      hint="It may have been trimmed by retention, or the link may be stale."
      icon="i-lucide-search-x"
    />

    <template v-else-if="detail">
      <UPageHeader
        :title="detail.group.name || 'Error'"
        :description="detail.group.message || 'No message was recorded.'"
        :ui="{ root: 'relative py-8 border-b-0' }"
      />

      <UPageBody>
        <div class="space-y-6">
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ConsoleStatsStatTile
              label="Occurrences"
              :value="detail.group.occurrences"
              icon="i-lucide-repeat"
            />
            <ConsoleStatsStatTile
              label="Sessions"
              :value="detail.group.sessions"
              icon="i-lucide-monitor"
            />
            <ConsoleStatsStatTile
              label="People"
              :value="detail.group.users"
              icon="i-lucide-users"
            />
            <ConsoleStatsStatTile
              label="Days seen"
              :value="detail.daily.length"
              icon="i-lucide-calendar"
            />
          </div>

          <UAlert
            v-if="concentration"
            color="info"
            variant="subtle"
            icon="i-lucide-crosshair"
            title="This looks concentrated"
            :description="concentration"
          />

          <!--
            Diagnosis is two readings at once: the trace says what broke, the
            breakdowns say what the failures have in common. Stacked in one
            column the second is a scroll away from the first, and the reader
            has to hold the trace in their head to make the connection.
          -->
          <div class="grid gap-6 lg:grid-cols-3">
            <div class="min-w-0 space-y-6 lg:col-span-2">
              <UCard
                class="border border-gray-200/70 dark:border-white/10"
                :ui="{ body: 'p-0' }"
              >
                <div class="border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
                  <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                    Stack
                  </h3>
                  <p
                    v-if="detail.group.culprit"
                    class="truncate font-mono text-xs text-gray-500 dark:text-gray-400"
                  >
                    {{ detail.group.culprit }}
                  </p>
                </div>
                <div class="min-w-0 p-5">
                  <ConsoleInsightsErrorStackTrace :stack="detail.occurrences[0]?.stack" />
                </div>
              </UCard>

              <ConsoleInsightsErrorOccurrenceList :occurrences="detail.occurrences" />
            </div>

            <!--
              Pinned below the sticky site header so the common factors stay
              beside the trace however far into the occurrence list the reader
              gets. Capped at the viewport because five breakdowns and a chart
              can outgrow it, and a pinned column taller than the screen hides
              its own bottom with no way to reach it.
            -->
            <div class="min-w-0 space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
              <!--
                Triage belongs after the reading, not before it: the status is
                decided once the trace has been read, and pinned here the
                control is still on screen when that moment arrives.
              -->
              <UCard class="border border-gray-200/70 dark:border-white/10">
                <div class="flex items-center justify-between gap-2">
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                    Status
                  </h3>
                  <UBadge
                    v-if="savedAt"
                    color="success"
                    variant="subtle"
                  >
                    Saved
                  </UBadge>
                </div>
                <USelect
                  v-model="status"
                  :items="statusOptions"
                  size="sm"
                  class="mt-2 w-full"
                  :disabled="saving"
                />
              </UCard>

              <ConsoleStatsChartCard title="Per day">
                <ConsoleStatsBarChart
                  :data="dailySeries"
                  color="#d53355"
                />
              </ConsoleStatsChartCard>

              <!-- Two abreast on a tablet, one in the sidebar column. -->
              <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
                <ConsoleInsightsErrorBreakdown
                  title="Browser"
                  icon="i-lucide-globe"
                  :rows="detail.by_browser"
                />
                <ConsoleInsightsErrorBreakdown
                  title="Operating system"
                  icon="i-lucide-monitor"
                  :rows="detail.by_os"
                />
                <ConsoleInsightsErrorBreakdown
                  title="Device"
                  icon="i-lucide-smartphone"
                  :rows="detail.by_device"
                />
                <ConsoleInsightsErrorBreakdown
                  title="Page"
                  icon="i-lucide-file-code"
                  mono
                  :rows="detail.by_path"
                />
                <ConsoleInsightsErrorBreakdown
                  title="Release"
                  icon="i-lucide-tag"
                  mono
                  :rows="detail.by_release"
                />
              </div>
            </div>
          </div>
        </div>
      </UPageBody>
    </template>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import insightsApi, { type ErrorDetail } from '~/services/insightsApi'
import { consoleBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })

const route = useRoute()
const fingerprint = computed(() => String(route.params.fingerprint || ''))

const detail = ref<ErrorDetail | null>(null)
const loaded = ref(false)
const status = ref('new')
const saving = ref(false)
const savedAt = ref<number | null>(null)

const statusOptions = ['new', 'acknowledged', 'resolved', 'ignored']

const breadcrumbItems = computed(() => consoleBreadcrumb(
  { label: 'Analytics', icon: 'i-lucide-chart-column', to: '/console/insights' },
  { label: 'Browser errors', icon: 'i-lucide-bug', to: '/console/insights/errors' },
  { label: detail.value?.group.name || 'Failure', icon: 'i-lucide-file-warning' }
))

useHead(() => ({ title: `${detail.value?.group.name || 'Error'} · Console` }))

const dailySeries = computed(() =>
  (detail.value?.daily ?? []).map(row => ({ label: row.day.slice(5), value: row.errors }))
)

/*
 * Where a breakdown is dominated by one value, say so.
 *
 * This is the part that shortens an afternoon: an error confined to one
 * browser is a compatibility bug, to one route a logic bug, and to one release
 * a regression. The numbers are all on the page either way — this just does
 * the reading for someone who has forty of these to get through.
 */
const concentration = computed(() => {
  const detailValue = detail.value
  if (!detailValue) return ''
  const total = detailValue.group.occurrences
  if (total < 5) return ''
  const findings: string[] = []
  const dimensions: Array<[string, Array<{ value: string, count: number }>]> = [
    ['browser', detailValue.by_browser],
    ['operating system', detailValue.by_os],
    ['page', detailValue.by_path],
    ['release', detailValue.by_release]
  ]
  for (const [label, rows] of dimensions) {
    const top = rows[0]
    // Only interesting when there was something else it could have been.
    if (!top || rows.length < 2 || top.value === 'unknown') continue
    if (top.count / total >= 0.9) findings.push(`${label} ${top.value}`)
  }
  if (!findings.length) return ''
  return `Nine in ten of these share the same ${findings.join(', and the same ')}.`
})

async function load() {
  detail.value = await insightsApi.getError(fingerprint.value)
  loaded.value = true
  if (detail.value) status.value = detail.value.group.status
}

// Not a save button: the select IS the action, matching how the feedback inbox
// triages. Reverted on failure so the control never shows a state the server
// did not accept.
watch(status, async (next, previous) => {
  if (!detail.value || !previous || next === detail.value.group.status) return
  saving.value = true
  const ok = await insightsApi.setErrorStatus(fingerprint.value, next)
  saving.value = false
  if (ok) {
    detail.value.group.status = next
    savedAt.value = Date.now()
  } else {
    status.value = previous
  }
})

onMounted(() => { void load() })
</script>
