<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Help text with the controls it mentions set apart.
 *
 * `[[some.key]]` renders as that key's text in the interface language, so a
 * step always names a button exactly as the page labels it; `[[=Text]]` is a
 * label that is still hard-coded in a template. Both render as a small chip,
 * which is what lets someone scan a step for the word to look for.
 */
const props = defineProps<{ text: string }>()

const { t, te } = useI18n()

interface Part {
  label: boolean
  value: string
}

const TOKEN = /\[\[(=)?([^\]]+)\]\]/g

const parts = computed<Part[]>(() => {
  const out: Part[] = []
  let last = 0
  for (const match of props.text.matchAll(TOKEN)) {
    const index = match.index ?? 0
    if (index > last) out.push({ label: false, value: props.text.slice(last, index) })
    const body = match[2] ?? ''
    const literal = Boolean(match[1])
    // A key that went missing still reads as a word, not as a dotted path.
    const known = te(body) || te(body, 'en')
    const value = literal ? body : known ? t(body) : (body.split('.').pop() ?? body)
    out.push({ label: true, value })
    last = index + match[0].length
  }
  if (last < props.text.length) out.push({ label: false, value: props.text.slice(last) })
  return out
})
</script>

<template>
  <span><template
    v-for="(part, index) in parts"
    :key="index"
  ><span
    v-if="part.label"
    class="rounded-md bg-gray-100 px-1.5 py-px font-medium text-gray-900 [box-decoration-break:clone] dark:bg-white/10 dark:text-white"
  >{{ part.value }}</span><template v-else>{{ part.value }}</template></template></span>
</template>
