<template>
  <li
    :id="`moment-${moment.id}`"
    class="grid grid-cols-[3.75rem_1.75rem_1fr] gap-x-2 py-1.5"
  >
    <!-- Where in the visit, not what time of day: "four minutes in" is what
         lines a complaint up with what came before it. -->
    <span
      class="pt-1 text-right font-mono text-[11px] tabular-nums text-gray-400 dark:text-gray-500"
      :title="new Date(moment.occurred_at).toLocaleString()"
    >{{ formatOffset(moment.offset_seconds) }}</span>

    <span
      class="relative z-10 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white dark:ring-zinc-900"
      :class="TONE_DOT[tone]"
    >
      <UIcon
        :name="momentIcon(moment)"
        class="h-3.5 w-3.5"
      />
    </span>

    <div class="min-w-0 pb-1">
      <p
        class="break-words"
        :class="tone === 'quiet' ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'"
      >
        <span
          v-if="moment.kind === 'turn' && moment.number"
          class="mr-1 text-gray-400 dark:text-gray-500"
        >Turn {{ moment.number }} ·</span>
        <span :class="tone === 'bad' ? 'font-medium text-red-700 dark:text-red-400' : ''">{{ momentTitle(moment) }}</span>
      </p>

      <!-- The few facts that change how the line reads. -->
      <p
        v-if="details.length"
        class="mt-0.5 text-xs text-gray-500 dark:text-gray-400"
      >
        {{ details.join(' · ') }}
      </p>

      <!-- FoodChat looking recipes up on the member's behalf: a turn that made
           no plan can be seen to have searched and found nothing. -->
      <ul
        v-if="moment.lookups?.length"
        class="mt-1 space-y-0.5 text-xs text-gray-500 dark:text-gray-400"
      >
        <li
          v-for="(lookup, index) in moment.lookups"
          :key="index"
        >
          Looked up {{ lookup.query ? `“${lookup.query}”` : 'recipes' }} →
          <span :class="lookup.zero_result ? 'font-medium text-amber-600 dark:text-amber-400' : ''">
            {{ lookup.zero_result ? 'nothing found' : `${lookup.results ?? '?'} found` }}
          </span>
          <template v-if="lookup.relaxed">
            , after loosening the request
          </template>
        </li>
      </ul>

      <!-- The words somebody left with a rating are why the session was opened. -->
      <blockquote
        v-if="said"
        class="mt-1.5 border-l-2 pl-2 text-sm italic"
        :class="ratingNegative ? 'border-red-300 text-red-800 dark:border-red-500/50 dark:text-red-300' : 'border-gray-300 text-gray-700 dark:border-white/20 dark:text-gray-200'"
      >
        {{ said }}
      </blockquote>

      <div
        v-if="actions.length || link"
        class="mt-1.5 flex flex-wrap gap-1.5"
      >
        <UButton
          v-for="action in actions"
          :key="action.key"
          size="xs"
          color="neutral"
          variant="outline"
          :icon="open === action.key ? 'i-lucide-chevron-up' : action.icon"
          :aria-expanded="open === action.key"
          @click="open = open === action.key ? null : action.key"
        >
          {{ open === action.key ? action.hide : action.show }}
        </UButton>
        <UButton
          v-if="link"
          size="xs"
          color="neutral"
          variant="ghost"
          trailing-icon="i-lucide-arrow-up-right"
          :to="link.to"
        >
          {{ link.label }}
        </UButton>
      </div>

      <ConsoleInsightsSessionPlanPeek
        v-if="open === 'plan' && planId"
        :plan-id="planId"
        class="mt-2"
      />
      <ConsoleInsightsSessionExchangePeek
        v-if="open === 'exchange' && moment.feedback_id"
        :feedback-id="moment.feedback_id"
        class="mt-2"
      />
    </div>
  </li>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { StoryMoment } from '~/services/insightsApi'
import { formatDuration } from '~/utils/deviceIcons'
import { areaLabel, qaModeLabel, surfaceLabel, targetLink } from '~/utils/labels'
import { formatOffset, momentIcon, momentTitle, momentTone, type Tone } from '~/utils/sessionStory'

/**
 * One line of a session's story, and whatever it can open in place: the plan
 * a turn made, the exchange a rating was about. Opened here rather than on
 * another page, because the question is always about this moment in this visit.
 */

const props = defineProps<{ moment: StoryMoment }>()

const TONE_DOT: Record<Tone, string> = {
  bad: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300',
  warn: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  good: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  quiet: 'bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500',
  plain: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300'
}

const tone = computed(() => momentTone(props.moment))
const open = ref<string | null>(null)

const seconds = (ms: number | null | undefined) =>
  ms === null || ms === undefined ? null : formatDuration(ms / 1000)

/** A plan this moment made or saved, if any. */
const planId = computed(() => props.moment.plan?.plan_id ?? props.moment.plan_id ?? null)

const ratingNegative = computed(() =>
  props.moment.kind === 'rating' ? Boolean(props.moment.negative) : Boolean(props.moment.rating?.negative)
)

const said = computed(() => {
  const m = props.moment
  if (m.kind === 'rating') return (m.comment || m.reason || '').trim()
  if (m.kind === 'question' && m.rating) {
    const words = (m.rating.comment || m.rating.reason || '').trim()
    const verdict = m.rating.negative ? 'Rated the answer down' : 'Rated the answer up'
    return words ? `${verdict}: ${words}` : verdict
  }
  return ''
})

const details = computed(() => {
  const m = props.moment
  const out: string[] = []
  switch (m.kind) {
    case 'turn': {
      const plan = m.plan
      if (plan) {
        const what = `${plan.refinement ? 'Changed' : 'Made'} a ${plan.plan_type === 'weekly' ? 'week' : 'day'} plan`
        out.push(`${what}${plan.version && plan.version > 1 ? ` (version ${plan.version})` : ''}`)
        if (plan.item_count) out.push(`${plan.item_count} dishes`)
      }
      const took = seconds(m.latency_ms)
      if (took) out.push(m.outcome && m.outcome !== 'ok' ? `gave up after ${took}` : `answered in ${took}`)
      if (m.llm_calls) out.push(`${m.llm_calls} model call${m.llm_calls === 1 ? '' : 's'}`)
      if (m.cost_usd) out.push(`$${m.cost_usd.toFixed(4)}`)
      break
    }
    case 'question':
      if (m.answered === false) out.push('no answer came back')
      else {
        if (m.mode) out.push(qaModeLabel(m.mode))
        if (m.sources_found !== null && m.sources_found !== undefined) out.push(`${m.sources_found} sources found`)
        if (m.articles_consulted) out.push(`${m.articles_consulted} articles read`)
        if (m.confidence !== null && m.confidence !== undefined && m.confidence !== '') out.push(`confidence ${m.confidence}`)
        if (m.cache_hit) out.push('from cache')
      }
      break
    case 'search':
      out.push(m.zero_result ? 'found nothing' : `${m.results ?? '?'} results`)
      if (m.relaxed) out.push('only after loosening it')
      if (m.surface) out.push(surfaceLabel(m.surface))
      break
    case 'page':
      if (m.previous) out.push(`from ${m.previous}`)
      break
    case 'error':
      out.push([m.method, m.route].filter(Boolean).join(' ') || 'unknown route')
      if (m.duration_ms) out.push(`after ${seconds(m.duration_ms)}`)
      break
    case 'client_error':
      if (m.message) out.push(m.message)
      if (m.path) out.push(`on ${m.path}`)
      break
    case 'frustration':
      out.push(`${m.clicks ?? 1} click${(m.clicks ?? 1) === 1 ? '' : 's'}`)
      if (m.area) out.push(`in ${areaLabel(m.area)}`)
      if (m.path) out.push(`on ${m.path}`)
      break
    case 'reading':
      if (m.urn) out.push(m.urn)
      break
    case 'event':
      if (m.feature) out.push(m.feature)
      if (m.action) out.push(m.action)
      break
  }
  return out
})

const actions = computed(() => {
  const m = props.moment
  const list: Array<{ key: string, show: string, hide: string, icon: string }> = []
  if (planId.value && ['turn', 'plan_generated', 'plan_saved'].includes(m.kind)) {
    list.push({ key: 'plan', show: 'Show the plan', hide: 'Hide the plan', icon: 'i-lucide-utensils' })
  }
  if (m.kind === 'rating' && m.feedback_id && m.target_type === 'chat_message') {
    list.push({ key: 'exchange', show: 'Show what was rated', hide: 'Hide the exchange', icon: 'i-lucide-messages-square' })
  }
  return list
})

const link = computed(() => {
  const m = props.moment
  if (m.kind === 'question' && m.qa_request_id) {
    const to = targetLink('qa_answer', m.qa_request_id)
    return to ? { to, label: 'Open the answer' } : null
  }
  if (m.kind === 'rating' && m.target_type !== 'chat_message') {
    const to = targetLink(m.target_type, m.target_id)
    return to ? { to, label: 'Open what was rated' } : null
  }
  if ((m.kind === 'recipe_view' || m.kind === 'result_opened') && m.recipe_id) {
    const to = targetLink('recipe', m.recipe_id)
    return to ? { to, label: 'Open the recipe' } : null
  }
  return null
})
</script>
