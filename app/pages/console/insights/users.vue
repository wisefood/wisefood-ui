<template>
  <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbItems"
      class="mb-4"
    />
    <ConsoleInsightsNav />
    <UPageHeader
      title="People & sessions"
      description="Who is using the platform, how much, and what it costs to serve them."
      :ui="{ root: 'relative py-8 border-b-0' }"
    >
      <template #links>
        <ConsoleInsightsRangePicker v-model="days" />
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="space-y-6">
        <UAlert
          color="info"
          variant="soft"
          icon="i-lucide-shield-check"
          title="Only people who agreed to be named appear here"
          description="Everyone else is counted in the totals but recorded without an identity, which is what the opt-in setting means. Sessions below include them."
        />

        <!-- Both tables are wide — eight columns of counts on one of them — so
             they keep the two-thirds column and the lookup box, which is one
             field and a button, moves out of their way instead of taking a
             full-width row of its own above them. -->
        <div class="grid gap-6 lg:grid-cols-3">
          <div class="min-w-0 space-y-6 lg:col-span-2">
            <ConsoleInsightsTablePanel
              title="Most active people"
              subtitle="Ordered by recorded actions"
              :rows="users"
              :columns="userColumns"
              empty="Nobody has consented to being named yet."
              empty-hint="Activity is still counted — it just has no name attached."
              empty-icon="i-lucide-users"
            >
              <!-- The whole point of the people list is getting from a name
                   to what that person actually did. -->
              <template #cell-user_id="{ row }">
                <NuxtLink
                  :to="`/console/insights/users/${row.user_id}`"
                  class="break-all font-mono text-xs text-brand-600 hover:underline dark:text-brand-300"
                >
                  {{ row.user_id }}
                </NuxtLink>
              </template>
              <template #cell-cost_usd="{ row }">
                ${{ Number(row.cost_usd).toFixed(3) }}
              </template>
              <template #cell-last_seen="{ row }">
                {{ formatWhen(row.last_seen) }}
              </template>
            </ConsoleInsightsTablePanel>

            <ConsoleInsightsTablePanel
              title="Recent sessions"
              subtitle="One row per visit. Open one to see everything that happened in it."
              :rows="sessions"
              :columns="sessionColumns"
              empty="No sessions recorded."
              empty-hint="A session is created the first time somebody does anything."
              empty-icon="i-lucide-monitor-smartphone"
            >
              <template #cell-session_id="{ row }">
                <NuxtLink
                  :to="`/console/insights/sessions/${row.session_id}`"
                  class="font-mono text-brand-600 hover:underline dark:text-brand-300"
                >
                  {{ row.session_id }}
                </NuxtLink>
              </template>
              <!-- An attributed id leads to that person's sessions; an
                   unattributed one is not a person and must not look
                   clickable. -->
              <template #cell-user_id="{ row }">
                <NuxtLink
                  v-if="row.user_id"
                  :to="`/console/insights/users/${row.user_id}`"
                  class="break-all font-mono text-xs text-brand-600 hover:underline dark:text-brand-300"
                >
                  {{ row.user_id }}
                </NuxtLink>
                <span
                  v-else
                  class="text-gray-400 dark:text-gray-500"
                >not attributed</span>
              </template>
              <template #cell-started_at="{ row }">
                {{ formatWhen(row.started_at) }}
              </template>
            </ConsoleInsightsTablePanel>
          </div>

          <!-- A single short card against two long tables: it follows the scroll
               so a reference can be pasted from anywhere down the page. -->
          <aside class="min-w-0 space-y-6 lg:sticky lg:top-6 lg:self-start">
            <UCard
              :ui="{ body: 'p-4' }"
              class="border border-gray-200/70 dark:border-white/10"
            >
              <label
                for="session-lookup"
                class="text-sm font-medium text-gray-900 dark:text-white"
              >Look up a session</label>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Paste the reference from the bottom of a person's screen, e.g. <span class="font-mono">k3f9-2xa7-lm4q</span>.
              </p>
              <form
                class="mt-3 flex flex-wrap gap-2"
                @submit.prevent="lookUpSession"
              >
                <UInput
                  id="session-lookup"
                  v-model="lookup"
                  placeholder="k3f9-2xa7-lm4q"
                  icon="i-lucide-search"
                  class="w-64 font-mono"
                  autocomplete="off"
                />
                <UButton
                  type="submit"
                  color="primary"
                  :disabled="!lookup.trim()"
                >
                  Open session
                </UButton>
              </form>
            </UCard>
          </aside>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import insightsApi, { type UserRow } from '~/services/insightsApi'
import { consoleBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })
useHead({ title: 'People & sessions · Console' })

const breadcrumbItems = consoleBreadcrumb(
  { label: 'Analytics', icon: 'i-lucide-chart-column', to: '/console/insights' },
  { label: 'People & sessions', icon: 'i-lucide-users' }
)

const days = ref(30)
const users = ref<UserRow[]>([])
const sessions = ref<Array<Record<string, unknown>>>([])
const lookup = ref('')

const userColumns = [
  { key: 'user_id', label: 'Person' },
  { key: 'events', label: 'Actions', align: 'right' as const },
  { key: 'sessions', label: 'Visits', align: 'right' as const },
  { key: 'questions_asked', label: 'Questions', align: 'right' as const },
  { key: 'searches', label: 'Searches', align: 'right' as const },
  { key: 'total_tokens', label: 'Tokens', align: 'right' as const },
  { key: 'cost_usd', label: 'Cost', align: 'right' as const },
  { key: 'last_seen', label: 'Last seen', align: 'right' as const }
]
const sessionColumns = [
  { key: 'session_id', label: 'Session' },
  { key: 'user_id', label: 'Person' },
  { key: 'events', label: 'Actions', align: 'right' as const },
  { key: 'started_at', label: 'Started', align: 'right' as const }
]

const formatWhen = (value: unknown) => {
  if (!value) return '—'
  const when = new Date(String(value))
  return Number.isNaN(when.getTime()) ? '—' : when.toLocaleString()
}

function lookUpSession() {
  const id = lookup.value.trim()
  if (id) navigateTo(`/console/insights/sessions/${encodeURIComponent(id)}`)
}

async function load() {
  const [people, recent] = await Promise.all([
    insightsApi.getUsers(days.value, 50),
    insightsApi.getRecentSessions(50, days.value)
  ])
  users.value = people
  sessions.value = recent as unknown as Array<Record<string, unknown>>
}

watch(days, () => { void load() })
onMounted(() => { void load() })
</script>
