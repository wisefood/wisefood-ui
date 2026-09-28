<template>
  <ul
    class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.65rem] text-zinc-500 dark:text-zinc-400"
    :aria-label="t('graph.legend.title')"
  >
    <li
      v-for="kind in GRAPH_KINDS"
      :key="kind"
      class="flex items-center gap-1"
      :title="t(`graph.kindHint.${kind}`)"
    >
      <span
        class="h-2 w-2 shrink-0 rounded-sm"
        :style="{ backgroundColor: palette.kind[kind] }"
      />
      {{ t(`graph.kind.${kind}`) }}
    </li>
    <li class="flex items-center gap-1">
      <UIcon
        name="i-lucide-file-text"
        class="h-3 w-3 shrink-0 text-emerald-500 dark:text-emerald-400"
      />
      {{ t('graph.tree.hasCard') }}
    </li>
    <li class="flex items-center gap-1">
      <span class="tabular-nums text-zinc-400 dark:text-zinc-500">123</span>
      {{ t('graph.legend.passages') }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { GRAPH_KINDS } from '~/services/graphApi'
import { GRAPH_THEME_DARK, GRAPH_THEME_LIGHT } from '~/utils/graphPalette'

/**
 * What the marks on a tree row mean, in one line.
 *
 * Only what a row cannot say for itself: the colour of its square (the kind of
 * node), the summary icon, and the number at its end. Facets need no key here,
 * because the tree shows each one as a heading with its name beside the shape.
 */

const props = defineProps<{ isDark?: boolean }>()
const { t } = useI18n()
const palette = computed(() => (props.isDark ? GRAPH_THEME_DARK : GRAPH_THEME_LIGHT))
</script>
