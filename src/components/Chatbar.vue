<template>
  <form class="chatbar" @submit.prevent="handleSubmit">
    <label class="chatbar__label" for="chatbar-input">
      <span class="chatbar__title">Ask FoodScholar</span>
      <span v-if="helperText" class="chatbar__helper">{{ helperText }}</span>
    </label>

    <div class="chatbar__input-wrapper">
      <textarea
        id="chatbar-input"
        ref="inputRef"
        v-model="message"
        class="chatbar__input"
        :placeholder="placeholder"
        :disabled="disabled || loading"
        rows="1"
        @keydown.enter.exact.prevent="handleSubmit"
        @input="resize"
      />
      <button
        type="submit"
        class="chatbar__submit"
        :disabled="!canSubmit || loading"
        aria-label="Submit message"
      >
        <span v-if="!loading" aria-hidden="true">➤</span>
        <span v-else class="chatbar__spinner" aria-hidden="true" />
      </button>
    </div>

    <div v-if="suggestionsToShow.length" class="chatbar__suggestions">
      <span class="chatbar__suggestions-label">Try one of these:</span>
      <div class="chatbar__suggestions-list">
        <button
          v-for="suggestion in suggestionsToShow"
          :key="suggestion"
          type="button"
          class="chatbar__suggestion"
          :disabled="disabled || loading"
          @click="applySuggestion(suggestion)"
        >
          {{ suggestion }}
        </button>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch, withDefaults } from 'vue'

const emit = defineEmits<{
  (e: 'submit', value: string): void
  (e: 'search', value: string): void
}>()

const props = withDefaults(
  defineProps<{
    modelValue?: string
    loading?: boolean
    disabled?: boolean
    suggestions?: string[]
    placeholder?: string
    helperText?: string
    maxLength?: number
  }>(),
  {
    modelValue: '',
    loading: false,
    disabled: false,
    suggestions: () => [],
    placeholder: 'Ask about nutrition, ingredients, or culinary history…',
    helperText: 'Press Enter to submit',
    maxLength: 4000,
  }
)

const message = ref(props.modelValue)
const inputRef = ref<HTMLTextAreaElement | null>(null)

const suggestionsToShow = computed(() => props.suggestions.slice(0, 6))

const canSubmit = computed(() => {
  const trimmed = message.value.trim()
  return trimmed.length > 0 && trimmed.length <= props.maxLength
})

const helperText = computed(() =>
  props.maxLength && props.maxLength < Infinity
    ? `${props.helperText} • Max ${props.maxLength} characters`
    : props.helperText
)

const placeholder = computed(() => props.placeholder)
const loading = computed(() => props.loading)
const disabled = computed(() => props.disabled)

const emitSubmit = (value: string) => {
  emit('submit', value)
  emit('search', value)
}

const handleSubmit = () => {
  const trimmed = message.value.trim()
  if (!trimmed || disabled.value || loading.value) return

  emitSubmit(trimmed)
  message.value = ''
  resize()
}

const applySuggestion = (suggestion: string) => {
  if (disabled.value || loading.value) return
  message.value = suggestion
  nextTick(() => handleSubmit())
}

const resize = () => {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`
}

watch(
  () => props.modelValue,
  value => {
    if (value === message.value) return
    message.value = value ?? ''
    nextTick(resize)
  }
)

watch(message, value => {
  if (value.length > props.maxLength) {
    message.value = value.slice(0, props.maxLength)
  }
})

nextTick(resize)
</script>

<style scoped>
.chatbar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chatbar__label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.chatbar__title {
  font-weight: 600;
  font-size: 0.95rem;
  color: rgba(15, 23, 42, 0.72);
}

.chatbar__helper {
  font-size: 0.75rem;
  color: rgba(71, 85, 105, 0.75);
}

.chatbar__input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 0.65rem;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 18px;
  padding: 0rem 0.75rem 0.9rem 1rem;
  box-shadow: 0 16px 30px -18px rgba(15, 23, 42, 0.35);
}

.chatbar__input {
  flex: 1 1 auto;
  background: transparent;
  border: none;
  resize: none;
  outline: none;
  font-size: 1rem;
  line-height: 1.5;
  color: rgba(15, 23, 42, 0.92);
}

.chatbar__input::placeholder {
  color: rgba(100, 116, 139, 0.6);
}

.chatbar__submit {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, rgba(199, 140, 168, 0.92), rgba(248, 129, 157, 0.92));
  color: #fff;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.chatbar__submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.chatbar__submit:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.35);
}

.chatbar__spinner {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.65);
  border-top-color: #fff;
  animation: chatbar__spin 1s linear infinite;
}

.chatbar__suggestions {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.chatbar__suggestions-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(71, 85, 105, 0.75);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.chatbar__suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chatbar__suggestion {
  border: 1px solid rgba(191, 99, 241, 0.35);
  background: rgba(197, 115, 227, 0.08);
  color: rgba(152, 48, 134, 0.95);
  border-radius: 9999px;
  padding: 0.4rem 0.85rem;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.chatbar__suggestion:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.16);
  border-color: rgba(79, 70, 229, 0.55);
}

.chatbar__suggestion:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes chatbar__spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .chatbar__input-wrapper {
    padding: 0.65rem 0.65rem 0.65rem 0.9rem;
  }
}
</style>
