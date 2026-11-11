<template>
  <!-- Under a checked claim, in the memory nudge's place and manner: the
       verdict first, then how the sources split. -->
  <div
    class="chat-flow-bubble chat-flow-bubble-muted"
    data-flows="foodscholar-qa-claim-verdict"
    aria-live="polite"
  >
    <div
      :class="['flex items-center gap-2.5 px-3 py-2 rounded-xl', verdict ? VERDICT_STYLE[verdict].row : 'bg-gray-50 dark:bg-zinc-800/60 text-gray-700 dark:text-gray-200']"
    >
      <UIcon
        v-if="!verdict && checking"
        name="i-lucide-loader-2"
        class="w-4 h-4 shrink-0 animate-spin text-gray-400"
      />
      <UIcon
        v-else
        :name="verdict ? VERDICT_STYLE[verdict].icon : 'i-lucide-book-open'"
        :class="['w-4 h-4 shrink-0', verdict ? VERDICT_STYLE[verdict].iconClass : 'text-gray-400']"
      />
      <span class="flex-1 min-w-0 text-sm font-medium leading-snug">
        {{ verdict ? t(`foodScholarLearn.check.verdict.${verdict}`) : checking ? t('foodScholarLearn.claim.checking') : t('foodScholarLearn.claim.noVerdict') }}
      </span>
    </div>
    <p
      v-if="mix && mix.total"
      class="mt-1.5 px-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed"
    >
      {{ mixLine }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { VERDICT_STYLE, type ClaimVerdict } from '~/utils/claimCheck'

const props = defineProps<{
  verdict: ClaimVerdict | null
  checking?: boolean
  mix?: { total: number, guidelines: number, people: number, lab: number } | null
}>()

const { t } = useI18n()

const mixLine = computed(() => {
  const m = props.mix
  if (!m) return ''
  const parts = [t('foodScholarLearn.claim.mixBased', m.total)]
  if (m.guidelines) parts.push(t('foodScholarLearn.check.guidelines', m.guidelines))
  if (m.people) parts.push(t('foodScholarLearn.check.humanStudies', m.people))
  if (m.lab) parts.push(t('foodScholarLearn.check.labStudies', { n: m.lab }))
  return parts.join(' · ')
})
</script>
