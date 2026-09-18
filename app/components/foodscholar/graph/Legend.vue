<template>
  <div class="rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 bg-white/85 dark:bg-zinc-900/85 p-3 shadow-sm backdrop-blur-sm">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-2"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="text-[0.6rem] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {{ t('graph.legend.title') }}
      </span>
      <UIcon
        :name="open ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
        class="h-3.5 w-3.5 text-zinc-400"
      />
    </button>

    <div
      v-if="open"
      class="mt-2.5 space-y-3"
    >
      <!--
        Colour = kind. Three, because a node-link view scatters every category
        against every other and six hues cannot stay distinguishable under
        all-pairs comparison — two of them come out below the threshold at
        which full-colour vision tells them apart, before colour-vision
        deficiency is considered.
      -->
      <div>
        <p class="mb-1 text-[0.6rem] font-medium text-zinc-400 dark:text-zinc-500">
          {{ t('graph.legend.colourIsKind') }}
        </p>
        <ul class="space-y-0.5">
          <li
            v-for="kind in GRAPH_KINDS"
            :key="kind"
            class="flex items-center gap-1.5"
          >
            <span
              class="h-2.5 w-2.5 shrink-0 rounded-sm"
              :style="{ backgroundColor: palette.kind[kind] }"
            />
            <span class="text-[0.7rem] text-zinc-700 dark:text-zinc-200">{{ t(`graph.kind.${kind}`) }}</span>
            <span class="truncate text-[0.65rem] text-zinc-400 dark:text-zinc-500">{{ t(`graph.kindHint.${kind}`) }}</span>
          </li>
        </ul>
      </div>

      <!-- Shape = facet. The second encoding, so facet identity never rests
           on a hue that would not survive the comparison. -->
      <div>
        <p class="mb-1 text-[0.6rem] font-medium text-zinc-400 dark:text-zinc-500">
          {{ t('graph.legend.shapeIsFacet') }}
        </p>
        <ul class="grid grid-cols-2 gap-x-2 gap-y-0.5">
          <li
            v-for="facet in GRAPH_FACETS"
            :key="facet"
            class="flex items-center gap-1.5"
          >
            <FoodscholarGraphShapeGlyph
              :facet="facet"
              :size="10"
              class="shrink-0 text-zinc-500 dark:text-zinc-400"
            />
            <span class="truncate text-[0.7rem] text-zinc-700 dark:text-zinc-200">{{ t(`graph.facets.${facet}`) }}</span>
          </li>
        </ul>
      </div>

      <p class="border-t border-zinc-200 dark:border-zinc-800 pt-2 text-[0.65rem] leading-relaxed text-zinc-500 dark:text-zinc-400">
        {{ t('graph.legend.sizeIsEvidence') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { GRAPH_FACETS, GRAPH_KINDS } from '~/services/graphApi'
import { GRAPH_THEME_DARK, GRAPH_THEME_LIGHT } from '~/utils/graphPalette'

/**
 * What the marks mean.
 *
 * Present by default rather than behind a control, because the encoding uses
 * two channels — colour for kind, shape for facet — and neither is guessable.
 * Collapsible, because once you know it you do not need it taking up the
 * corner of the map.
 */

const props = defineProps<{ isDark?: boolean }>()
const { t } = useI18n()
const open = ref(true)
const palette = computed(() => (props.isDark ? GRAPH_THEME_DARK : GRAPH_THEME_LIGHT))
</script>
