<template>
  <div
    ref="rootRef"
    :class="['qa-composer-box', { 'is-focused': focused, 'is-docked': docked }]"
    data-flows="foodscholar-qa-input"
  >
    <FoodscholarNLInput
      :model-value="modelValue"
      :disabled="disabled"
      :placeholder="placeholder"
      multiline
      :max-rows="8"
      input-class="w-full min-h-[3.25rem] px-4 sm:px-5 pt-3.5 pb-1 bg-transparent text-base leading-7 text-gray-900 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-zinc-400 focus:outline-none"
      @update:model-value="emit('update:modelValue', $event)"
      @enter="emit('submit', $event)"
      @focus="onFocus"
      @blur="onBlur"
    />

    <div class="flex items-center justify-between gap-2 px-2.5 sm:px-3 pb-2.5 pt-1">
      <div class="flex items-center gap-1 min-w-0">
        <slot name="leading" />
        <UDropdownMenu
          :items="levelItems"
          :content="{ align: 'start', side: docked ? 'top' : 'bottom', sideOffset: 8, collisionPadding: 12 }"
          :ui="{ content: 'w-64 z-[140]' }"
        >
          <button
            type="button"
            class="qa-composer-tool"
            :title="levelTitle"
            data-flows="foodscholar-qa-level"
          >
            <UIcon
              :name="levelIcon"
              class="w-4 h-4 shrink-0"
            />
            <span class="hidden sm:inline">{{ levelLabel }}</span>
            <UIcon
              name="i-lucide-chevron-down"
              class="w-3.5 h-3.5 shrink-0 opacity-60"
            />
          </button>
        </UDropdownMenu>
      </div>

      <div class="flex items-center gap-1.5 shrink-0">
        <!-- One click opens or closes the advanced panel. -->
        <button
          type="button"
          :class="['qa-composer-tool', { 'is-active': advancedActive }]"
          :aria-pressed="advancedActive"
          :aria-label="advancedLabel"
          :title="advancedLabel"
          data-flows="foodscholar-qa-advanced"
          @click="emit('toggle-advanced')"
        >
          <UIcon
            name="i-lucide-sliders-horizontal"
            class="w-4 h-4 shrink-0"
          />
          <span class="hidden md:inline">{{ advancedLabel }}</span>
        </button>
        <button
          type="button"
          :disabled="disabled"
          :class="['qa-composer-send', { 'is-empty': !String(modelValue ?? '').trim() }]"
          :aria-label="sendLabel"
          data-flows="foodscholar-qa-submit"
          @click="emit('submit', modelValue)"
        >
          <UIcon
            v-if="busy"
            name="i-lucide-loader-2"
            class="w-4 h-4 animate-spin"
          />
          <UIcon
            v-else
            name="i-lucide-arrow-up"
            class="w-4 h-4"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { DropdownMenuItem } from '@nuxt/ui'

/**
 * FoodScholar's question box: the text on top, the controls along the
 * bottom edge inside the same frame (explanation level on the left; advanced
 * settings and send on the right). `docked` is the conversation form, pinned
 * to the bottom of the screen, whose menus open upwards.
 */
withDefaults(defineProps<{
  modelValue: string
  placeholder: string
  disabled?: boolean
  busy?: boolean
  docked?: boolean
  levelItems: DropdownMenuItem[]
  levelLabel: string
  levelTitle?: string
  levelIcon: string
  advancedActive?: boolean
  advancedLabel: string
  sendLabel: string
}>(), {
  disabled: false,
  busy: false,
  docked: false,
  levelTitle: undefined,
  advancedActive: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'submit': [value?: string]
  'toggle-advanced': []
  'focus': []
  'blur': []
}>()

const rootRef = ref<HTMLElement | null>(null)
const focused = ref(false)

function onFocus() {
  focused.value = true
  emit('focus')
}

function onBlur() {
  focused.value = false
  emit('blur')
}

function focus() {
  rootRef.value?.querySelector('textarea')?.focus()
}

defineExpose({ focus })
</script>

<style scoped>
.qa-composer-box {
  position: relative;
  border-radius: 1.5rem;
  border: 1px solid rgba(0, 0, 0, 0.09);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 28px -12px rgba(0, 0, 0, 0.12);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.dark .qa-composer-box {
  border-color: rgba(255, 255, 255, 0.09);
  background: rgba(30, 30, 33, 0.92);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 8px 28px -12px rgba(0, 0, 0, 0.6);
}

.qa-composer-box.is-focused {
  border-color: var(--color-brandp-300);
  box-shadow: 0 0 0 3px rgb(from var(--color-brandp-400) r g b / 0.12), 0 8px 28px -12px rgba(0, 0, 0, 0.16);
}

.dark .qa-composer-box.is-focused {
  border-color: var(--color-brandp-400);
}

.qa-composer-tool {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  height: 2.25rem;
  padding: 0 0.625rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgb(75 85 99);
  white-space: nowrap;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.qa-composer-tool:hover {
  background: rgba(0, 0, 0, 0.05);
  color: rgb(17 24 39);
}

.dark .qa-composer-tool {
  color: rgb(212 212 216);
}

.dark .qa-composer-tool:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.qa-composer-tool.is-active {
  color: var(--color-brand-600);
  background: rgb(from var(--color-brand-500) r g b / 0.1);
}

.qa-composer-send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.375rem;
  height: 2.375rem;
  border-radius: 9999px;
  background: var(--color-brand-500);
  color: white;
  box-shadow: 0 4px 12px -4px rgb(from var(--color-brand-700) r g b / 0.5);
  transition: transform 0.15s ease, opacity 0.15s ease, background-color 0.15s ease;
}

.qa-composer-send:hover:not(:disabled) {
  transform: translateY(-1px);
  background: var(--color-brand-600);
}

.qa-composer-send.is-empty {
  opacity: 0.55;
}

.qa-composer-send:disabled {
  opacity: 0.5;
}
</style>
