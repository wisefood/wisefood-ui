<template>
  <NuxtLink
    ref="cardRef"
    :to="to"
    class="app-nav-card group"
    :style="{ '--glow': glowColor }"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <span
      class="app-nav-card__border"
      :style="{ '--angle': angleDeg }"
      aria-hidden="true"
    />

    <!-- "About this app" affordance. Always present (not hover-only) so it works
         on touch and via keyboard; visually subtle at rest, emphasized on hover.
         stop/prevent so it opens the modal instead of navigating the card link. -->
    <button
      v-if="hasAbout"
      type="button"
      class="app-nav-card__info"
      :aria-label="aboutLabel"
      :title="aboutLabel"
      @click.stop.prevent="emit('about')"
      @mousedown.stop
      @keydown.enter.stop
    >
      <UIcon
        name="i-lucide-info"
        class="w-4 h-4"
      />
    </button>

    <UIcon
      :name="icon"
      class="w-8 h-8 mb-3 relative z-10"
      :class="iconClass"
    />
    <h3 class="font-semibold text-gray-900 dark:text-white mb-1 relative z-10">{{ title }}</h3>
    <p class="text-sm text-gray-600 dark:text-gray-300 font-light relative z-10">{{ description }}</p>
  </NuxtLink>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  to: string
  icon: string
  iconClass?: string
  title: string
  description: string
  glowColor: string
  hasAbout?: boolean
  aboutLabel?: string
}>()

const emit = defineEmits<{ about: [] }>()

const cardRef = ref<{ $el: HTMLElement } | null>(null)
const angleDeg = ref('0deg')
const hovered = ref(false)

const onMouseMove = (e: MouseEvent) => {
  const el = cardRef.value?.$el
  if (!el) return

  hovered.value = true
  const rect = el.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const rad = Math.atan2(e.clientY - cy, e.clientX - cx)
  angleDeg.value = `${(rad * 180) / Math.PI + 90}deg`
}

const onMouseLeave = () => {
  hovered.value = false
}
</script>

<style scoped>
@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.app-nav-card {
  position: relative;
  display: block;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 2px 8px -2px rgba(15, 23, 42, 0.07);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.app-nav-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px -6px rgba(15, 23, 42, 0.12);
}

.app-nav-card__border {
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1.5px;
  background: conic-gradient(
    from var(--angle),
    transparent 0%,
    var(--glow) 12%,
    color-mix(in srgb, var(--glow) 50%, white) 20%,
    transparent 35%
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
  z-index: 0;
}

.app-nav-card:hover .app-nav-card__border {
  opacity: 1;
}

.app-nav-card__info {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  color: rgb(107 114 128); /* gray-500 */
  background: transparent;
  opacity: 0.55;
  transition: opacity 0.2s ease, background-color 0.2s ease, color 0.2s ease;
}

.app-nav-card__info:hover,
.app-nav-card:hover .app-nav-card__info {
  opacity: 1;
  background: rgba(15, 23, 42, 0.06);
  color: rgb(55 65 81); /* gray-700 */
}

.app-nav-card__info:focus-visible {
  opacity: 1;
  outline: 2px solid var(--glow, #6366f1);
  outline-offset: 2px;
}

:global(.dark) .app-nav-card__info {
  color: rgb(156 163 175); /* gray-400 */
}

:global(.dark) .app-nav-card__info:hover,
:global(.dark) .app-nav-card:hover .app-nav-card__info {
  background: rgba(255, 255, 255, 0.1);
  color: rgb(229 231 235); /* gray-200 */
}
</style>
