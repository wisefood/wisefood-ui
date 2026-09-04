<template>
  <UCard
    :ui="{ body: 'p-5' }"
    class="border border-gray-200/70 dark:border-white/10"
  >
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          Activity analytics & tracing
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Takes effect within about thirty seconds, across every service. No redeploy.
        </p>
      </div>
      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-lucide-refresh-cw"
        :loading="loading"
        @click="load"
      />
    </div>

    <UAlert
      v-if="!platformEnabled"
      class="mt-4"
      color="warning"
      variant="soft"
      icon="i-lucide-power-off"
      title="Collection is off for this deployment"
      description="ANALYTICS_ENABLED is not set on the API. These switches can only narrow what a deployment already permits, so nothing here will start collection."
    />

    <div
      v-if="health"
      class="mt-4 grid gap-3 sm:grid-cols-4"
    >
      <div
        v-for="stat in healthStats"
        :key="stat.label"
      >
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ stat.label }}
        </p>
        <p
          class="text-lg font-semibold tabular-nums"
          :class="stat.warn ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'"
        >
          {{ stat.value }}
        </p>
      </div>
    </div>
    <p
      v-if="dropped"
      class="mt-2 text-xs text-red-600 dark:text-red-400"
    >
      Events are being dropped — the recorder cannot keep up or cannot write. "No data" and
      "losing data" look identical in the reports, so this is worth chasing.
    </p>

    <div class="mt-5 space-y-3 border-t border-gray-100 pt-4 dark:border-zinc-800">
      <div
        v-for="toggle in toggles"
        :key="toggle.key"
        class="flex items-start justify-between gap-4"
      >
        <div class="min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            {{ toggle.label }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ toggle.hint }}
          </p>
        </div>
        <USwitch
          :model-value="value(toggle.key, toggle.invert)"
          :disabled="saving === toggle.key || !settings"
          :aria-label="toggle.label"
          @update:model-value="(next: boolean) => save(toggle.key, toggle.invert ? !next : next)"
        />
      </div>
    </div>

    <p
      v-if="error"
      class="mt-3 text-sm text-red-600 dark:text-red-400"
    >
      {{ error }}
    </p>
  </UCard>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import insightsApi, { type RecorderHealth } from '~/services/insightsApi'

/**
 * The switches an operator needs during an incident.
 *
 * `paused` is presented inverted, as "Recording activity", because a switch
 * labelled "Paused" that is on when nothing is happening reads backwards to
 * everyone who is not the person who named the setting.
 */
const toggles = [
  {
    key: 'paused',
    label: 'Recording activity',
    hint: 'Off stops all new activity records. Existing data is untouched.',
    invert: true
  },
  {
    key: 'tracing.enabled',
    label: 'LLM tracing',
    hint: 'Off stops every service sending traces. Prompt management keeps working.',
    invert: false
  },
  {
    key: 'capture.raw_query_text',
    label: 'Keep the text of searches',
    hint: 'Off keeps only the normalised form and a hash, so trending still works.',
    invert: false
  },
  {
    key: 'capture.http_requests',
    label: 'Record every request',
    hint: 'The highest-volume signal. Off keeps domain actions and drops the rest.',
    invert: false
  },
  // The browser-side streams. These are the ones whose empty pages send people
  // looking for a switch, so the switch has to be here: two of them ship off,
  // and a page that says "turn it on in Platform Operations" while the control
  // lives nowhere is worse than no message at all.
  {
    key: 'capture.errors',
    label: 'Browser errors',
    hint: 'What broke in someone\'s browser. Never sampled — a fault that hits one person in a thousand is the one worth having.',
    invert: false
  },
  {
    key: 'capture.client_sessions',
    label: 'Device and session',
    hint: 'Browser, operating system and screen size, once per visit. The full user agent is kept only for people who consented.',
    invert: false
  },
  {
    key: 'capture.interactions',
    label: 'Click maps',
    hint: 'Where people click, rage clicks and scroll depth. Ships off: the highest-volume thing here, and the one a participant is most likely to consider surveillance.',
    invert: false
  },
  {
    key: 'capture.vitals',
    label: 'Page speed',
    hint: 'How fast pages felt in the browser. Ships off for volume, not sensitivity — a load time is about the page.',
    invert: false
  }
]

const settings = ref<Record<string, unknown> | null>(null)
const health = ref<RecorderHealth | null>(null)
const platformEnabled = ref(true)
const loading = ref(false)
const saving = ref<string | null>(null)
const error = ref('')

const dropped = computed(() => {
  const stats = health.value?.stats as Record<string, number> | undefined
  return Number(stats?.dropped_queue_full ?? 0) + Number(stats?.write_errors ?? 0)
})

const healthStats = computed(() => {
  const stats = (health.value?.stats ?? {}) as Record<string, number>
  return [
    { label: 'Recorded', value: Number(stats.written ?? 0).toLocaleString(), warn: false },
    { label: 'Queued', value: health.value?.queue_depth ?? 0, warn: false },
    { label: 'Dropped', value: Number(stats.dropped_queue_full ?? 0), warn: Number(stats.dropped_queue_full ?? 0) > 0 },
    { label: 'Write errors', value: Number(stats.write_errors ?? 0), warn: Number(stats.write_errors ?? 0) > 0 }
  ]
})

function value(key: string, invert?: boolean): boolean {
  const raw = Boolean(settings.value?.[key])
  return invert ? !raw : raw
}

async function load() {
  loading.value = true
  const [config, recorder] = await Promise.all([
    insightsApi.getSettings(),
    insightsApi.getHealth()
  ])
  settings.value = config?.settings ?? null
  platformEnabled.value = Boolean(config?.platform_enabled)
  health.value = recorder
  loading.value = false
}

async function save(key: string, next: boolean) {
  saving.value = key
  error.value = ''
  const failure = await insightsApi.setSetting(key, next)
  if (failure) {
    error.value = failure
  } else if (settings.value) {
    settings.value = { ...settings.value, [key]: next }
  }
  saving.value = null
}

onMounted(() => { void load() })
</script>
