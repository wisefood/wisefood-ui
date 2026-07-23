<template>
  <UModal
    v-model:open="open"
    :ui="{ content: 'max-w-lg' }"
  >
    <template #content>
      <UCard :ui="{ root: 'rounded-2xl' }">
        <template #header>
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-3">
              <span
                class="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800"
              >
                <UIcon
                  :name="icon"
                  class="w-5 h-5"
                  :class="iconClass"
                />
              </span>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
                  {{ title }}
                </h3>
                <p
                  v-if="tagline"
                  class="text-xs text-gray-500 dark:text-gray-400"
                >
                  {{ tagline }}
                </p>
              </div>
            </div>
            <UButton
              variant="ghost"
              color="neutral"
              icon="i-lucide-x"
              size="sm"
              :aria-label="t('dashboard.about.close')"
              @click="open = false"
            />
          </div>
        </template>

        <div class="space-y-5">
          <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {{ description }}
          </p>

          <!-- Stats: rendered only when the app has real corpus numbers to show.
               Apps without a stats source (e.g. FoodChat) pass no/empty stats
               and this whole block is hidden. -->
          <div
            v-if="visibleStats.length"
            class="border-t border-gray-100 dark:border-zinc-800 pt-4"
          >
            <h4 class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
              {{ statsHeading || t('dashboard.about.statsHeading') }}
            </h4>
            <dl class="grid grid-cols-3 gap-3">
              <div
                v-for="stat in visibleStats"
                :key="stat.label"
                class="rounded-xl bg-gray-50 dark:bg-zinc-800/60 px-3 py-2.5 text-center"
              >
                <dt class="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">
                  {{ stat.label }}
                </dt>
                <dd class="text-lg font-semibold text-gray-900 dark:text-white tabular-nums">
                  {{ stat.value.toLocaleString() }}
                </dd>
              </div>
            </dl>
          </div>

          <p
            v-if="footnote"
            class="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed"
          >
            {{ footnote }}
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton
              :to="to"
              color="primary"
              @click="open = false"
            >
              {{ t('dashboard.about.openApp') }}
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export interface AppAboutStat {
  label: string
  // A negative value marks "unavailable" (matches catalog stats' -1 sentinel);
  // such stats are hidden rather than shown as a real number.
  value: number
}

const { t } = useI18n()

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  title: string
  tagline?: string
  icon: string
  iconClass?: string
  description: string
  to: string
  statsHeading?: string
  stats?: AppAboutStat[]
  footnote?: string
}>()

// Only surface stats that are actually present (>= 0). Everything else — a
// missing endpoint, a failed count (-1), or an app with no corpus — is dropped.
const visibleStats = computed(() =>
  (props.stats ?? []).filter(s => Number.isFinite(s.value) && s.value >= 0)
)
</script>
