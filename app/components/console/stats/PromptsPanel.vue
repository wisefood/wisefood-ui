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
        class="flex items-center justify-between py-2"
      >
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">
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
        <span
          v-if="latestVersion(p) != null"
          class="text-xs text-gray-500 dark:text-gray-400"
        >v{{ latestVersion(p) }}</span>
      </li>
    </ul>
  </UCard>
</template>

<script setup lang="ts">
import type { PromptSummary } from '~/services/observabilityApi'

defineProps<{ prompts: PromptSummary[], enabled: boolean }>()

// Langfuse returns `versions` as an array; show the highest (latest) version.
const latestVersion = (p: PromptSummary): number | null => {
  if (!p.versions?.length) return null
  return Math.max(...p.versions)
}
</script>
