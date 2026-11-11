<template>
  <div
    class="inline-flex items-end gap-1"
    role="img"
    :aria-label="t('foodScholarLearn.meterLabel', { bars, total: 4 })"
  >
    <span
      v-for="i in 4"
      :key="i"
      :class="[
        'rounded-sm transition-colors',
        size === 'sm' ? 'w-1.5' : 'w-2.5',
        barHeight(i),
        i <= bars ? toneClass : 'bg-zinc-200 dark:bg-zinc-700'
      ]"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(defineProps<{
  /** 0-4; 0 draws an empty meter ("not recorded"). */
  bars: number
  size?: 'sm' | 'md'
}>(), { size: 'md' })

const { t } = useI18n()

const toneClass = computed(() => {
  if (props.bars >= 4) return 'bg-emerald-500'
  if (props.bars === 3) return 'bg-lime-500'
  if (props.bars === 2) return 'bg-amber-400'
  return 'bg-orange-400'
})

function barHeight(i: number): string {
  const sm = ['h-1.5', 'h-2.5', 'h-3.5', 'h-4']
  const md = ['h-2.5', 'h-4', 'h-5', 'h-6']
  return (props.size === 'sm' ? sm : md)[i - 1] ?? 'h-4'
}
</script>
