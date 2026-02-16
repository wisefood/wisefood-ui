<template>
  <div class="space-y-4">
    <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
      {{ t('profileSelection.avatarSelector.chooseAvatar') }}
    </p>

    <div class="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-64 overflow-y-auto p-2">
      <button
        v-for="(avatar, index) in avatarPresets"
        :key="index"
        type="button"
        class="group relative aspect-square rounded-full overflow-hidden transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        :class="selectedIndex === index ? 'ring-3 ring-brand-500 ring-offset-2 dark:ring-offset-gray-800 scale-105' : 'hover:shadow-lg'"
        @click="selectAvatar(index)"
      >
        <ProfileAvatar :avatar="avatar" size="sm" class="w-full h-full" />

        <!-- Selection indicator -->
        <div
          v-if="selectedIndex === index"
          class="absolute inset-0 flex items-center justify-center bg-brand-500/20"
        >
          <UIcon name="i-lucide-check" class="w-6 h-6 text-brand-600 drop-shadow-md" />
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { avatarPresets, type AvatarConfig } from '~/utils/avatarPresets'

interface Props {
  modelValue?: number
}

interface Emits {
  (e: 'update:modelValue', value: number): void
  (e: 'select', avatar: AvatarConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

const selectedIndex = computed({
  get: () => props.modelValue,
  set: (value: number) => emit('update:modelValue', value)
})

function selectAvatar(index: number) {
  selectedIndex.value = index
  emit('select', avatarPresets[index])
}
</script>
