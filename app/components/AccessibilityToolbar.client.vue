<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onClickOutside } from '@vueuse/core'
import { useAccessibilityStore, type FontScale, type ContrastMode } from '@/stores/accessibility'

const { t } = useI18n()
const a11y = useAccessibilityStore()

const isOpen = ref(false)
const panel = ref<HTMLElement | null>(null)

onMounted(() => {
  a11y.apply()
})

onClickOutside(panel, () => {
  isOpen.value = false
})

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
  <Teleport to="body">
    <div class="a11y-toolbar-root">
      <UButton
      :aria-label="t('a11y.open')"
      :title="t('a11y.open')"
      color="primary"
      variant="solid"
      icon="i-lucide-person-standing"
      size="lg"
      class="a11y-trigger fixed bottom-5 left-5 z-[140] rounded-full shadow-lg shadow-brand-500/25 hover:shadow-brand-500/35 hover:scale-105 transition-transform"
      @click="isOpen = !isOpen"
    />

    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="isOpen"
        ref="panel"
        role="dialog"
        :aria-label="t('a11y.title')"
        class="fixed bottom-24 left-5 z-[140] w-80 max-w-[calc(100vw-3rem)] rounded-xl shadow-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-800 p-5"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <UIcon name="i-lucide-person-standing" class="w-4 h-4 text-brand-500" />
            {{ t('a11y.title') }}
          </h2>
          <UButton
            variant="ghost"
            color="gray"
            size="xs"
            icon="i-lucide-x"
            :aria-label="t('a11y.close')"
            @click="isOpen = false"
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
              class="py-2 rounded-md font-semibold border transition-colors flex items-center justify-center"
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
              class="py-2 px-2 rounded-md text-xs font-medium border transition-colors flex flex-col items-center gap-1"
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
        <section class="space-y-2 mb-4">
          <label class="flex items-center justify-between gap-3 py-1.5 cursor-pointer">
            <span class="text-sm text-gray-800 dark:text-gray-200">{{ t('a11y.dyslexiaFont') }}</span>
            <USwitch :model-value="a11y.dyslexiaFont" @update:model-value="a11y.toggleDyslexiaFont()" />
          </label>
          <label class="flex items-center justify-between gap-3 py-1.5 cursor-pointer">
            <span class="text-sm text-gray-800 dark:text-gray-200">{{ t('a11y.reducedMotion') }}</span>
            <USwitch :model-value="a11y.reducedMotion" @update:model-value="a11y.toggleReducedMotion()" />
          </label>
          <label class="flex items-center justify-between gap-3 py-1.5 cursor-pointer">
            <span class="text-sm text-gray-800 dark:text-gray-200">{{ t('a11y.underlineLinks') }}</span>
            <USwitch :model-value="a11y.underlineLinks" @update:model-value="a11y.toggleUnderlineLinks()" />
          </label>
          <label class="flex items-center justify-between gap-3 py-1.5 cursor-pointer">
            <span class="text-sm text-gray-800 dark:text-gray-200">{{ t('a11y.largeCursor') }}</span>
            <USwitch :model-value="a11y.largeCursor" @update:model-value="a11y.toggleLargeCursor()" />
          </label>
        </section>

        <UButton
          block
          variant="outline"
          color="gray"
          size="sm"
          icon="i-lucide-rotate-ccw"
          @click="a11y.reset()"
        >
          {{ t('a11y.reset') }}
        </UButton>
      </div>
    </Transition>
  </div>
  </Teleport>
</template>
