<template>
  <UCard
    :ui="{ body: 'p-5' }"
    class="border border-gray-200/70 dark:border-white/10"
  >
    <h3 class="mb-4 text-base font-semibold text-gray-900 dark:text-white">
      Prompts (read-only)
    </h3>
    <p
      v-if="!enabled"
      class="text-sm text-gray-500 dark:text-gray-400"
    >
      Observability is not configured.
    </p>
    <p
      v-else-if="!prompts.length"
      class="text-sm text-gray-500 dark:text-gray-400"
    >
      No prompts registered.
    </p>
    <ul
      v-else
      class="divide-y divide-gray-100 dark:divide-zinc-800"
    >
      <li
        v-for="p in prompts"
        :key="p.name"
      >
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
          @click="openPrompt(p.name)"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-gray-900 dark:text-white">
              {{ p.name }}
            </p>
            <div class="mt-0.5 flex flex-wrap gap-1">
              <UBadge
                v-for="label in p.labels ?? []"
                :key="label"
                size="xs"
                variant="soft"
                color="primary"
              >
                {{ label }}
              </UBadge>
              <UBadge
                v-for="tag in p.tags ?? []"
                :key="tag"
                size="xs"
                variant="outline"
                color="neutral"
              >
                {{ tag }}
              </UBadge>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-2 text-gray-400">
            <span
              v-if="latestVersion(p) != null"
              class="text-xs"
            >v{{ latestVersion(p) }}</span>
            <UIcon
              name="i-lucide-chevron-right"
              class="h-4 w-4"
            />
          </div>
        </button>
      </li>
    </ul>

    <USlideover
      v-model:open="drawerOpen"
      :title="activeName"
      :description="fetchedWith"
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <div
          v-if="loading"
          class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="h-4 w-4 animate-spin"
          />
          Loading prompt…
        </div>

        <div
          v-else-if="!detail"
          class="space-y-2 text-sm text-gray-500 dark:text-gray-400"
        >
          <p>Could not load this prompt.</p>
          <p class="text-xs">
            Langfuse answered with nothing for this name at any label. If it was just
            created, give it a version; if it was renamed, the list is stale — refresh.
          </p>
        </div>

        <div
          v-else
          class="space-y-5"
        >
          <!-- Which version, and what it carries -->
          <div class="flex flex-wrap items-center gap-2">
            <USelectMenu
              v-if="versionOptions.length > 1"
              :model-value="selectedVersion ?? undefined"
              :items="versionOptions"
              value-key="value"
              size="xs"
              class="w-32"
              aria-label="Prompt version"
              @update:model-value="(v: number) => pickVersion(v)"
            />
            <UBadge
              v-else-if="detail.version != null"
              size="sm"
              variant="soft"
              color="neutral"
            >
              v{{ detail.version }}
            </UBadge>
            <UBadge
              v-for="label in detail.labels ?? []"
              :key="label"
              size="sm"
              variant="soft"
              color="primary"
            >
              {{ label }}
            </UBadge>
            <UBadge
              v-for="tag in detail.tags ?? []"
              :key="tag"
              size="sm"
              variant="outline"
              color="neutral"
            >
              {{ tag }}
            </UBadge>
            <UBadge
              v-if="detail._fetched_with && !detail._fetched_with.resolved"
              size="sm"
              variant="soft"
              color="warning"
              icon="i-lucide-unlink"
            >
              shown raw — a referenced prompt could not be resolved
            </UBadge>
          </div>

          <!-- What the template expects -->
          <div
            v-if="template && (template.variables.length || template.placeholders.length || template.references.length)"
            class="space-y-2 rounded-lg border border-gray-200/70 p-3 dark:border-white/10"
          >
            <div
              v-if="template.variables.length"
              class="flex flex-wrap items-center gap-1.5"
            >
              <span class="mr-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Variables
              </span>
              <UBadge
                v-for="name in template.variables"
                :key="name"
                size="sm"
                variant="soft"
                color="secondary"
                class="font-mono"
              >
                {{ braces(name) }}
              </UBadge>
            </div>
            <div
              v-if="template.placeholders.length"
              class="flex flex-wrap items-center gap-1.5"
            >
              <span class="mr-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Message slots
              </span>
              <UBadge
                v-for="name in template.placeholders"
                :key="name"
                size="sm"
                variant="soft"
                color="info"
                icon="i-lucide-messages-square"
                class="font-mono"
              >
                {{ name }}
              </UBadge>
            </div>
            <div
              v-if="template.references.length"
              class="flex flex-wrap items-center gap-1.5"
            >
              <span class="mr-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Includes
              </span>
              <UButton
                v-for="include in template.references"
                :key="include.name + (include.version ?? include.label ?? '')"
                size="xs"
                variant="soft"
                color="neutral"
                icon="i-lucide-link"
                class="font-mono"
                @click="openPrompt(include.name)"
              >
                {{ include.name }}<span
                  v-if="include.version || include.label"
                  class="ml-1 opacity-60"
                >@{{ include.version ?? include.label }}</span>
              </UButton>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ conventionNote }}
            </p>
          </div>

          <!-- The template, variables picked out -->
          <div>
            <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Template
            </p>
            <div class="max-h-[45vh] space-y-3 overflow-auto rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-800 dark:bg-zinc-900 dark:text-gray-200">
              <div
                v-for="(block, i) in blocks"
                :key="i"
              >
                <p
                  v-if="block.role"
                  class="mb-0.5 font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  {{ block.role }}
                </p>
                <p
                  v-if="block.placeholder"
                  class="inline-flex items-center gap-1 rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-blue-700 dark:text-blue-300"
                >
                  <UIcon
                    name="i-lucide-messages-square"
                    class="h-3 w-3"
                  />
                  messages: {{ block.placeholder }}
                </p>
                <pre
                  v-else
                  class="whitespace-pre-wrap break-words font-mono"
                ><template
                  v-for="(seg, j) in block.segments"
                  :key="j"
                ><mark
                  v-if="seg.kind === 'variable'"
                  class="rounded bg-violet-500/15 px-0.5 text-violet-800 dark:text-violet-200"
                >{{ braces(seg.text) }}</mark><span
                  v-else-if="seg.kind === 'reference'"
                  class="rounded bg-amber-500/15 px-0.5 text-amber-800 dark:text-amber-200"
                >@@@{{ seg.text }}@@@</span><template v-else>{{ seg.text }}</template></template></pre>
              </div>
            </div>
          </div>

          <!-- Fill it in and see what the model would get -->
          <UCollapsible
            v-if="template && (template.variables.length || template.placeholders.length)"
            v-model:open="previewOpen"
          >
            <UButton
              variant="ghost"
              color="neutral"
              size="sm"
              :trailing-icon="previewOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="w-full justify-between"
            >
              Preview with values
            </UButton>
            <template #content>
              <div class="mt-3 space-y-3">
                <div class="grid gap-2 sm:grid-cols-2">
                  <UFormField
                    v-for="name in template.variables"
                    :key="name"
                    :label="braces(name)"
                    size="xs"
                    :ui="{ label: 'font-mono' }"
                  >
                    <UInput
                      v-model="values[name]"
                      size="xs"
                      class="w-full"
                      :placeholder="name"
                    />
                  </UFormField>
                </div>
                <UFormField
                  v-for="name in template.placeholders"
                  :key="name"
                  :label="`messages: ${name}`"
                  size="xs"
                  hint="one per line, as role: content"
                  :ui="{ label: 'font-mono' }"
                >
                  <UTextarea
                    v-model="slots[name]"
                    :rows="3"
                    size="xs"
                    class="w-full"
                    placeholder="user: I love Ron Fricke movies&#10;assistant: Noted."
                  />
                </UFormField>
                <div>
                  <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    What the model receives
                  </p>
                  <pre class="max-h-[35vh] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-3 font-mono text-xs leading-relaxed text-gray-800 dark:bg-zinc-900 dark:text-gray-200">{{ compiled }}</pre>
                </div>
              </div>
            </template>
          </UCollapsible>

          <div v-if="hasConfig">
            <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Config
            </p>
            <pre class="overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-800 dark:bg-zinc-900 dark:text-gray-200">{{ configText }}</pre>
          </div>
        </div>
      </template>
    </USlideover>
  </UCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import observabilityApi, {
  type PromptDetail, type PromptMessage, type PromptSummary, type PromptTemplate
} from '~/services/observabilityApi'
import { compileChat, fill, messagesToText, segment, type Segment } from '~/utils/promptTemplate'

const props = defineProps<{ prompts: PromptSummary[], enabled: boolean }>()

// Langfuse returns `versions` as an array; show the highest (latest) version.
const latestVersion = (p: PromptSummary): number | null => {
  if (!p.versions?.length) return null
  return Math.max(...p.versions)
}

const drawerOpen = ref(false)
const loading = ref(false)
const activeName = ref('')
const detail = ref<PromptDetail | null>(null)
const template = ref<PromptTemplate | null>(null)
const selectedVersion = ref<number | null>(null)

/*
 * The fill-in preview's state. Reset per prompt: a value typed for one
 * prompt's `{{movie}}` has no business appearing in another's.
 */
const previewOpen = ref(false)
const values = ref<Record<string, string>>({})
const slots = ref<Record<string, string>>({})

const resetPreview = () => {
  values.value = {}
  slots.value = {}
}

const load = async (name: string, pick: { version?: number } = {}) => {
  loading.value = true
  const got = await observabilityApi.getPromptDetail(name, pick)
  detail.value = got?.prompt ?? null
  template.value = got?.template ?? null
  selectedVersion.value = detail.value?.version ?? null
  loading.value = false
}

const openPrompt = async (name: string) => {
  activeName.value = name
  detail.value = null
  template.value = null
  resetPreview()
  previewOpen.value = false
  drawerOpen.value = true
  await load(name)
}

const pickVersion = async (version: number) => {
  if (version === selectedVersion.value) return
  await load(activeName.value, { version })
}

/*
 * Versions come from the list, not the detail — Langfuse's detail endpoint
 * describes one version and does not say which others exist.
 */
const versionOptions = computed(() => {
  const summary = props.prompts.find(p => p.name === activeName.value)
  const versions = [...(summary?.versions ?? [])].sort((a, b) => b - a)
  return versions.map(v => ({ label: `v${v}`, value: v }))
})

const fetchedWith = computed(() => {
  const w = detail.value?._fetched_with
  if (!w) return undefined
  if (w.version != null) return `Version ${w.version}`
  return w.label === 'latest' ? 'Latest version — nothing is labelled production' : `Label: ${w.label}`
})

const convention = computed<PromptTemplate['convention']>(() => template.value?.convention ?? 'none')

/** A variable name written the way this prompt writes it. */
const braces = (name: string) => convention.value === 'format' ? `{${name}}` : `{{${name}}}`

const conventionNote = computed(() => {
  switch (convention.value) {
    case 'mustache':
      return 'Langfuse variables. The application fills {{name}} at runtime; anything else is sent as written.'
    case 'format':
      return 'FoodChat convention: Python {name} fields, filled by FoodChat itself. {{ and }} are literal braces — keep that when editing in Langfuse, or the JSON examples break.'
    default:
      return 'No variables. This prompt is sent exactly as written.'
  }
})

const messages = computed<PromptMessage[]>(() => {
  const p = detail.value?.prompt
  if (!p) return []
  if (typeof p === 'string') return [{ content: p }]
  return p
})

interface Block { role?: string, placeholder?: string, segments: Segment[] }

const blocks = computed<Block[]>(() => messages.value.map((m) => {
  if (m.type === 'placeholder') return { placeholder: m.name ?? 'placeholder', segments: [] }
  return {
    role: typeof detail.value?.prompt === 'string' ? undefined : (m.role ?? 'message'),
    segments: segment(m.content ?? '', convention.value)
  }
}))

const compiled = computed(() => {
  const p = detail.value?.prompt
  if (!p) return ''
  if (typeof p === 'string') return fill(p, convention.value, values.value)
  return messagesToText(compileChat(p, convention.value, values.value, slots.value))
})

const hasConfig = computed(() => {
  const c = detail.value?.config
  return Boolean(c && typeof c === 'object' && Object.keys(c).length)
})

const configText = computed(() => JSON.stringify(detail.value?.config ?? {}, null, 2))
</script>
