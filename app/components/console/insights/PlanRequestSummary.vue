<template>
  <section
    class="rounded-md border border-dashed border-gray-300 px-3 py-2 dark:border-white/15"
    aria-label="What the plan was asked for"
  >
    <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      What the plan was asked for
    </p>
    <p
      v-if="!request"
      class="mt-1 text-gray-500 dark:text-gray-400"
    >
      Not kept for this plan. FoodChat keeps what each plan was asked for since 17 November 2026.
    </p>
    <dl
      v-else
      class="mt-1.5 space-y-1.5"
    >
      <div
        v-if="request.message"
        class="grid grid-cols-[7.5rem_1fr] gap-2"
      >
        <dt class="text-gray-500 dark:text-gray-400">
          They wrote
        </dt>
        <dd class="min-w-0 whitespace-pre-line break-words text-gray-900 dark:text-white">
          “{{ request.message }}”
        </dd>
      </div>
      <div class="grid grid-cols-[7.5rem_1fr] gap-2">
        <dt class="text-gray-500 dark:text-gray-400">
          FoodChat read
        </dt>
        <dd class="min-w-0 text-gray-900 dark:text-white">
          <template v-if="reading.length">
            <span
              v-for="line in reading"
              :key="line"
              class="block"
            >{{ line }}</span>
          </template>
          <span
            v-else
            class="text-gray-500 dark:text-gray-400"
          >Nothing beyond the profile</span>
        </dd>
      </div>
      <div
        v-if="profile.length"
        class="grid grid-cols-[7.5rem_1fr] gap-2"
      >
        <dt class="text-gray-500 dark:text-gray-400">
          From the profile
        </dt>
        <dd class="min-w-0 text-gray-900 dark:text-white">
          <span
            v-for="line in profile"
            :key="line"
            class="block break-words"
          >{{ line }}</span>
        </dd>
      </div>
    </dl>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PlanRequest } from '~/services/insightsApi'
import { profileLines, readingLines } from '~/utils/turnExchange'

/**
 * What a FoodChat plan was asked for, beside the plan itself: the member's
 * words, FoodChat's reading of them, and the profile it planned around. So a
 * reviewer can see where the plan departs from the request.
 */

const props = defineProps<{ request: PlanRequest | null | undefined }>()

const reading = computed(() => readingLines(props.request))
const profile = computed(() => profileLines(props.request))
</script>
