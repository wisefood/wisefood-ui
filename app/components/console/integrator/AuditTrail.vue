<!--
  Every tool the agent actually ran.

  The timeline on a turn says what the assistant reports it did. This says
  what it did — the arguments it passed, whether the call succeeded, how long
  it took — read back from the audit table rather than from the assistant's
  own account. The difference matters precisely when the two disagree, which
  is the case nobody can investigate without this.

  Scoped by the server: an expert sees their own calls, an admin sees
  everyone's. That is not a display decision and is not re-implemented here.
-->
<template>
  <component
    :is="embedded ? 'div' : UCard"
    v-bind="embedded ? {} : {
      class: 'border border-gray-200/70 dark:border-white/10',
      ui: { body: 'p-0', header: 'p-4 sm:p-5' }
    }"
  >
    <template #header>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
            What the agent ran
          </h2>
          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Read from the audit table, not from the assistant's account of itself.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <USelectMenu
            v-model="filter"
            value-key="value"
            :items="FILTERS"
            size="sm"
            class="w-40"
          />
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-refresh-cw"
            class="cursor-pointer"
            :loading="loading"
            @click="load"
          >
            Refresh
          </UButton>
        </div>
      </div>
    </template>

    <div
      v-if="loading && !calls.length"
      class="flex items-center gap-2 px-5 py-10 text-sm text-gray-500 dark:text-gray-400"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="h-4 w-4 animate-spin"
      />
      Loading…
    </div>

    <p
      v-else-if="!visible.length"
      class="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      {{ calls.length ? 'No calls match that filter.' : 'Nothing recorded yet.' }}
    </p>

    <ul
      v-else
      class="max-h-96 divide-y divide-gray-100 overflow-y-auto dark:divide-white/5"
    >
      <li
        v-for="call in visible"
        :key="call.id"
      >
        <button
          type="button"
          class="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50 sm:px-5 dark:hover:bg-white/5"
          @click="expanded = expanded === call.id ? null : call.id"
        >
          <UIcon
            :name="call.ok ? 'i-lucide-check' : 'i-lucide-x'"
            class="mt-0.5 h-4 w-4 shrink-0"
            :class="call.ok ? 'text-green-500' : 'text-red-500'"
          />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-mono text-xs font-medium text-gray-900 dark:text-white">
                {{ call.tool }}
              </span>
              <!-- A write is the thing worth being able to find later. -->
              <UBadge
                v-if="call.write"
                size="sm"
                variant="soft"
                color="warning"
              >
                write
              </UBadge>
            </div>
            <p
              v-if="summarise(call)"
              class="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400"
            >
              {{ summarise(call) }}
            </p>
            <p
              v-if="!call.ok && call.error?.message"
              class="mt-0.5 truncate text-xs text-red-600 dark:text-red-400"
            >
              {{ call.error.message }}
            </p>
          </div>
          <div class="shrink-0 text-right">
            <p class="text-xs tabular-nums text-gray-400 dark:text-gray-500">
              {{ call.duration_ms != null ? `${Math.round(call.duration_ms)} ms` : '—' }}
            </p>
            <p class="text-[11px] text-gray-400 dark:text-gray-500">
              {{ when(call.created_at) }}
            </p>
          </div>
        </button>

        <!-- The arguments verbatim. A summary is for scanning; this is what
             somebody checking an integration actually needs to read. -->
        <pre
          v-if="expanded === call.id"
          class="max-h-64 overflow-auto whitespace-pre-wrap border-t border-gray-100 bg-gray-50 px-4 py-3 text-[11px] leading-relaxed text-gray-700 [overflow-wrap:anywhere] sm:px-5 dark:border-white/5 dark:bg-zinc-900/60 dark:text-gray-300"
        >{{ JSON.stringify(call.arguments ?? {}, null, 2) }}</pre>
      </li>
    </ul>
  </component>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, resolveComponent, watch } from 'vue'
import integratorApi, { type ToolCall } from '~/services/integratorApi'

const UCard = resolveComponent('UCard')

const props = withDefaults(defineProps<{
  sessionId?: string | null
  proposalId?: string | null
  /** Inside the tabbed panel there is already a card and a header; a second
   *  set of both is chrome around chrome. */
  embedded?: boolean
}>(), { sessionId: null, proposalId: null, embedded: false })

const calls = ref<ToolCall[]>([])
const loading = ref(false)
const expanded = ref<number | null>(null)
const filter = ref<'all' | 'writes' | 'failures'>('all')

const FILTERS = [
  { label: 'Everything', value: 'all' },
  { label: 'Writes only', value: 'writes' },
  { label: 'Failures only', value: 'failures' }
]

const visible = computed(() => calls.value.filter((call) => {
  if (filter.value === 'writes') return call.write
  if (filter.value === 'failures') return !call.ok
  return true
}))

/** The one argument that says what a call was about, per tool. */
function summarise(call: ToolCall): string {
  const args = call.arguments ?? {}
  const keys = [
    'query', 'url', 'doi', 'q', 'article_urn', 'guide_urn',
    'textbook_urn', 'artifact_uuid', 'proposal_id'
  ]
  for (const key of keys) {
    const value = args[key]
    if (typeof value === 'string' && value) return `${key}: ${value}`
  }
  const spec = args['spec'] as { title?: string } | undefined
  if (spec?.title) return spec.title
  return ''
}

function when(value: string | null): string {
  if (!value) return ''
  const at = new Date(value)
  return Number.isNaN(at.getTime()) ? '' : at.toLocaleTimeString()
}

async function load() {
  loading.value = true
  calls.value = await integratorApi.audit({
    sessionId: props.sessionId || undefined,
    proposalId: props.proposalId || undefined
  })
  loading.value = false
}

watch(() => [props.sessionId, props.proposalId], load)
onMounted(load)
</script>
