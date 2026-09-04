<template>
  <UCard
    :ui="{ body: 'p-0' }"
    class="overflow-hidden border border-gray-200/70 dark:border-white/10"
  >
    <div class="flex items-center justify-between border-b border-gray-200/70 px-5 py-3 dark:border-white/10">
      <div class="flex items-center gap-2">
        <UIcon
          :name="items.length ? 'i-lucide-triangle-alert' : 'i-lucide-check-circle-2'"
          class="h-4 w-4"
          :class="items.length ? 'text-amber-500' : 'text-emerald-500'"
        />
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          Needs attention
        </h3>
      </div>
      <UBadge
        v-if="items.length"
        color="neutral"
        variant="subtle"
      >
        {{ items.length }}
      </UBadge>
    </div>

    <div
      v-if="!items.length"
      class="px-5 py-8 text-center"
    >
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Nothing is asking for a decision right now.
      </p>
      <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
        Searches that find nothing, unread complaints and unjudged answers all appear here.
      </p>
    </div>

    <ul
      v-else
      class="divide-y divide-gray-100 dark:divide-zinc-800"
    >
      <li
        v-for="item in items"
        :key="item.key"
        class="flex items-start gap-4 px-5 py-4"
      >
        <span
          class="mt-1 h-2 w-2 shrink-0 rounded-full"
          :class="dotClass(item.severity)"
          aria-hidden="true"
        />
        <div class="min-w-0 flex-1">
          <p class="font-medium text-gray-900 dark:text-white">
            {{ item.title }}
          </p>
          <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {{ item.detail }}
          </p>
        </div>
        <UButton
          :to="item.to"
          color="neutral"
          variant="outline"
          size="xs"
          trailing-icon="i-lucide-arrow-right"
          class="shrink-0"
        >
          {{ item.action }}
        </UButton>
      </li>
    </ul>
  </UCard>
</template>

<script setup lang="ts">
import type { AttentionItem } from '~/services/insightsApi'

/**
 * The panel that makes this page worth opening.
 *
 * Every row is a count someone can act on and a button that goes where the
 * acting happens. Deliberately not a list of totals: "1,204 searches" is a
 * fact, "7 searches found nothing, most often 'pickled moon cheese'" is a task.
 */
defineProps<{ items: AttentionItem[] }>()

const dotClass = (severity: string) => ({
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-sky-500'
}[severity] ?? 'bg-gray-400')
</script>
