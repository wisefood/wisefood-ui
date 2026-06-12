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
          class="text-sm text-gray-500 dark:text-gray-400"
        >
          Could not load this prompt.
        </div>

        <div
          v-else
          class="space-y-4"
        >
          <div class="flex flex-wrap items-center gap-2">
            <UBadge
              v-if="detail.version != null"
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
          </div>

          <div>
            <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Template
            </p>
            <pre class="max-h-[55vh] overflow-auto rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-800 dark:bg-zinc-900 dark:text-gray-200">{{ templateText }}</pre>
          </div>

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
import observabilityApi, { type PromptSummary, type PromptDetail } from '~/services/observabilityApi'

defineProps<{ prompts: PromptSummary[], enabled: boolean }>()

// Langfuse returns `versions` as an array; show the highest (latest) version.
const latestVersion = (p: PromptSummary): number | null => {
  if (!p.versions?.length) return null
  return Math.max(...p.versions)
}

const drawerOpen = ref(false)
const loading = ref(false)
const activeName = ref('')
const detail = ref<PromptDetail | null>(null)

const openPrompt = async (name: string) => {
  activeName.value = name
  detail.value = null
  drawerOpen.value = true
  loading.value = true
  detail.value = await observabilityApi.getPromptDetail(name)
  loading.value = false
}

const templateText = computed<string>(() => {
  const p = detail.value?.prompt
  if (!p) return '(empty)'
  if (typeof p === 'string') return p
  // Chat prompt: render each message as "role: content".
  return p.map(m => `${(m.role ?? 'message').toUpperCase()}:\n${m.content ?? ''}`).join('\n\n')
})

const hasConfig = computed(() => {
  const c = detail.value?.config
  return Boolean(c && typeof c === 'object' && Object.keys(c).length)
})

const configText = computed(() => JSON.stringify(detail.value?.config ?? {}, null, 2))
</script>
