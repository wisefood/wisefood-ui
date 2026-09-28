<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAccessibilityStore, type FontScale, type ContrastMode } from '@/stores/accessibility'

/**
 * The accessibility controls, without a container. The floating dock puts
 * them in a card beside the trigger on a desktop and in a bottom sheet on a
 * phone; the controls themselves are the same either way.
 */
defineEmits<{ close: [] }>()

const { t } = useI18n()
const a11y = useAccessibilityStore()

const fontScales: { value: FontScale, label: string, size: string }[] = [
  { value: 'sm', label: 'A', size: 'text-xs' },
  { value: 'md', label: 'A', size: 'text-sm' },
  { value: 'lg', label: 'A', size: 'text-base' },
  { value: 'xl', label: 'A', size: 'text-lg' }
]

const contrastModes: { value: ContrastMode, key: string, icon: string }[] = [
  { value: 'normal', key: 'a11y.contrast.normal', icon: 'i-lucide-circle' },
  { value: 'high', key: 'a11y.contrast.high', icon: 'i-lucide-contrast' },
  { value: 'grayscale', key: 'a11y.contrast.grayscale', icon: 'i-lucide-droplet-off' }
]
</script>

<template>
  <div data-wf-dock>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <UIcon name="i-lucide-person-standing" class="w-4 h-4 text-brand-500" />
        {{ t('a11y.title') }}
      </h2>
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        icon="i-lucide-x"
        class="pointer-coarse:min-h-11 pointer-coarse:min-w-11 justify-center"
        :aria-label="t('a11y.close')"
        @click="$emit('close')"
      />
    </div>

    <!-- Font size -->
    <section class="mb-4">
      <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
        {{ t('a11y.fontSize') }}
      </p>
      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="opt in fontScales"
          :key="opt.value"
          type="button"
          class="py-2 min-h-11 rounded-md font-semibold border transition-colors flex items-center justify-center"
          :class="[
            opt.size,
            a11y.fontScale === opt.value
              ? 'bg-brand-500 text-white border-brand-500'
              : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
          ]"
          :aria-pressed="a11y.fontScale === opt.value"
          @click="a11y.setFontScale(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </section>

    <!-- Contrast -->
    <section class="mb-4">
      <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
        {{ t('a11y.contrast.label') }}
      </p>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="mode in contrastModes"
          :key="mode.value"
          type="button"
          class="py-2 px-2 min-h-11 rounded-md text-xs font-medium border transition-colors flex flex-col items-center gap-1"
          :class="a11y.contrast === mode.value
            ? 'bg-brand-500 text-white border-brand-500'
            : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'"
          :aria-pressed="a11y.contrast === mode.value"
          @click="a11y.setContrast(mode.value)"
        >
          <UIcon :name="mode.icon" class="w-4 h-4" />
          {{ t(mode.key) }}
        </button>
      </div>
    </section>

    <!-- Toggles -->
    <section class="space-y-1 mb-4">
      <label class="flex items-center justify-between gap-3 py-2 min-h-11 cursor-pointer">
        <span class="text-sm text-gray-800 dark:text-gray-200">{{ t('a11y.dyslexiaFont') }}</span>
        <USwitch :model-value="a11y.dyslexiaFont" @update:model-value="a11y.toggleDyslexiaFont()" />
      </label>
      <label class="flex items-center justify-between gap-3 py-2 min-h-11 cursor-pointer">
        <span class="text-sm text-gray-800 dark:text-gray-200">{{ t('a11y.reducedMotion') }}</span>
        <USwitch :model-value="a11y.reducedMotion" @update:model-value="a11y.toggleReducedMotion()" />
      </label>
      <label class="flex items-center justify-between gap-3 py-2 min-h-11 cursor-pointer">
        <span class="text-sm text-gray-800 dark:text-gray-200">{{ t('a11y.underlineLinks') }}</span>
        <USwitch :model-value="a11y.underlineLinks" @update:model-value="a11y.toggleUnderlineLinks()" />
      </label>
      <label class="hidden pointer-fine:flex items-center justify-between gap-3 py-2 min-h-11 cursor-pointer">
        <span class="text-sm text-gray-800 dark:text-gray-200">{{ t('a11y.largeCursor') }}</span>
        <USwitch :model-value="a11y.largeCursor" @update:model-value="a11y.toggleLargeCursor()" />
      </label>
    </section>

    <UButton
      block
      variant="outline"
      color="neutral"
      size="sm"
      icon="i-lucide-rotate-ccw"
      class="min-h-11"
      @click="a11y.reset()"
    >
      {{ t('a11y.reset') }}
    </UButton>
  </div>
</template>
