<template>
  <div class="mt-2 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
    <!-- What was read, before what was scored: a score over a plan we
         misread is worse than no score. -->
    <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-700">
      <UIcon
        name="i-lucide-clipboard-check"
        class="w-3.5 h-3.5 text-brandp-500 shrink-0"
      />
      <p class="text-xs font-medium text-gray-900 dark:text-white">
        {{ t('foodChatHome.planScore.title') }}
      </p>
      <span class="text-[10px] text-gray-400 dark:text-zinc-500 ml-auto tabular-nums">
        {{ t('foodChatHome.planScore.read', { meals: score.meals_scored, days: score.days_scored }) }}
      </span>
    </div>

    <div class="px-3 py-2.5 space-y-3">
      <!-- The member's own aim, if they gave one. -->
      <p
        v-if="score.context"
        class="text-[11px] text-gray-500 dark:text-zinc-400 italic"
      >
        {{ score.context }}
      </p>

      <!-- Metrics. Rendered from `key`/`label`/`score`, so a metric the
           backend adds appears without a UI change. -->
      <div
        v-if="metrics.length"
        class="space-y-1.5"
      >
        <div
          v-for="metric in metrics"
          :key="metric.key"
          class="flex items-center gap-2"
        >
          <span
            class="text-[11px] text-gray-600 dark:text-zinc-300 w-32 shrink-0 truncate"
            :title="metric.label"
          >
            {{ metric.label }}
          </span>
          <div
            v-if="metric.score != null && metric.max"
            class="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700 overflow-hidden"
          >
            <div
              class="h-full rounded-full bg-brandp-400"
              :style="{ width: barWidth(metric) }"
            />
          </div>
          <!-- Not measured is not zero. A bar at 0% reads as "judged, badly". -->
          <span
            v-else
            class="flex-1 text-[10px] text-gray-400 dark:text-zinc-500"
          >{{ t('foodChatHome.planScore.notMeasured') }}</span>
          <span
            v-if="metric.score != null"
            class="text-[11px] text-gray-700 dark:text-zinc-200 tabular-nums shrink-0"
          >{{ formatScore(metric) }}</span>
          <UTooltip
            v-if="metric.detail"
            :text="metric.detail"
          >
            <UIcon
              name="i-lucide-info"
              class="w-3 h-3 text-gray-300 dark:text-zinc-600 shrink-0"
            />
          </UTooltip>
        </div>
      </div>

      <!-- The constraints ledger, in the same row shape the plan header uses. -->
      <div
        v-if="ledger.length"
        class="flex flex-wrap gap-1"
      >
        <UTooltip
          v-for="(row, idx) in ledger"
          :key="`c-${idx}`"
          :text="row.detail || row.constraint"
        >
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border cursor-help"
            :class="ledgerClass(row)"
          >{{ row.constraint }}</span>
        </UTooltip>
      </div>

      <!-- How each dish was read. The part that decides whether the score
           above means anything, so it is shown rather than hidden. -->
      <div v-if="grounding.length">
        <button
          class="flex items-center gap-1 text-[10px] text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
          @click="groundingOpen = !groundingOpen"
        >
          <UIcon
            :name="groundingOpen ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
            class="w-3 h-3"
          />
          {{ t('foodChatHome.planScore.howRead', { n: grounding.length }) }}
          <span
            v-if="approximate"
            class="text-amber-600 dark:text-amber-400"
          >
            · {{ t('foodChatHome.planScore.approximate', { n: approximate }) }}
          </span>
        </button>
        <ul
          v-if="groundingOpen"
          class="mt-1.5 space-y-1"
        >
          <li
            v-for="(row, idx) in grounding"
            :key="`g-${idx}`"
            class="flex items-start gap-1.5 text-[11px]"
          >
            <UIcon
              :name="stateIcon(row.state)"
              class="w-3 h-3 mt-0.5 shrink-0"
              :class="stateClass(row.state)"
            />
            <span class="text-gray-500 dark:text-zinc-500 w-16 shrink-0 truncate">{{ row.slot }}</span>
            <span class="text-gray-700 dark:text-zinc-200 min-w-0">
              {{ row.title_given }}
              <span
                v-if="row.title_matched && row.title_matched !== row.title_given"
                class="text-gray-400 dark:text-zinc-500"
              >
                → {{ row.title_matched }}
              </span>
            </span>
          </li>
        </ul>
      </div>

      <!-- Lines we could not read, in the member's own words. Saying which
           ones were skipped is the difference between a partial score and a
           wrong one. -->
      <div
        v-if="score.unparsed?.length"
        class="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 px-2 py-1.5"
      >
        <p class="text-[10px] text-amber-800 dark:text-amber-300">
          {{ t('foodChatHome.planScore.unparsed', { n: score.unparsed.length }) }}
        </p>
        <p
          v-for="(line, idx) in score.unparsed.slice(0, 4)"
          :key="`u-${idx}`"
          class="text-[11px] text-amber-900 dark:text-amber-200 truncate"
        >
          {{ line }}
        </p>
      </div>

      <p
        v-for="(warning, idx) in score.warnings || []"
        :key="`w-${idx}`"
        class="text-[10px] text-gray-500 dark:text-zinc-400"
      >
        {{ warning }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * A plan the MEMBER wrote, scored.
 *
 * The backend has returned this card since the scorer shipped — metrics, the
 * constraints ledger, how each pasted dish was grounded, the lines it could not
 * read — persisted on the message so it survives a reload. The UI rendered the
 * prose reply and dropped every bit of it.
 *
 * Metrics are drawn from `key`/`label`/`score`, never from a list of names the
 * UI keeps: the backend's own comment says the shape exists "so the UI can
 * render rows without knowing metric names", and a card that has to be taught
 * each new metric is a card that silently omits them.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ConstraintApplied, PlanScore, PlanScoreMetric } from '~/services/foodchatApi'

const props = defineProps<{ score: PlanScore }>()

const { t } = useI18n()

const groundingOpen = ref(false)

const metrics = computed<PlanScoreMetric[]>(() => props.score.metrics ?? [])
const ledger = computed<ConstraintApplied[]>(() => props.score.constraints_applied ?? [])
const grounding = computed(() => props.score.grounding ?? [])

/** Dishes read as something near enough, which is worth a number of its own. */
const approximate = computed(
  () => grounding.value.filter(row => row.state !== 'matched').length
)

function barWidth(metric: PlanScoreMetric): string {
  const max = metric.max || 1
  const value = Math.max(0, Math.min(metric.score ?? 0, max))
  return `${(value / max) * 100}%`
}

function formatScore(metric: PlanScoreMetric): string {
  const value = metric.score ?? 0
  const rounded = Number.isInteger(value) ? value : Math.round(value * 10) / 10
  return metric.max ? `${rounded}/${metric.max}` : String(rounded)
}

function ledgerClass(row: ConstraintApplied): string {
  if (row.status === 'violated') {
    return 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
  }
  if (row.status === 'satisfied') {
    return 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
  }
  // unchecked, unsupported, or a status this UI predates — informational, and
  // never dressed as a pass.
  return 'border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-zinc-400'
}

function stateIcon(state: string): string {
  if (state === 'matched') return 'i-lucide-check'
  if (state === 'approximate') return 'i-lucide-tilde'
  return 'i-lucide-help-circle'
}

function stateClass(state: string): string {
  if (state === 'matched') return 'text-emerald-500'
  if (state === 'approximate') return 'text-amber-500'
  return 'text-gray-400 dark:text-zinc-500'
}
</script>
