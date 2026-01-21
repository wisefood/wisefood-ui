<template>
  <USelectMenu
    v-model="selectedCode"
    :items="countries"
    searchable
    :search-placeholder="searchPlaceholder"
    :placeholder="placeholder"
    :size="size"
    :disabled="disabled"
    value-key="code"
  >
    <template #leading>
      <span v-if="selectedCountry" class="text-lg">{{ selectedCountry.flag }}</span>
      <UIcon v-else name="i-lucide-globe" class="w-4 h-4 text-gray-400" />
    </template>

    <template #default>
      <span v-if="selectedCountry">{{ selectedCountry.name }}</span>
      <span v-else class="text-gray-400">{{ placeholder }}</span>
    </template>

    <template #item="{ item }">
      <span class="text-lg mr-2">{{ item.flag }}</span>
      <span>{{ item.name }}</span>
      <span class="ml-auto text-xs text-gray-400">{{ item.code }}</span>
    </template>
  </USelectMenu>
</template>

<script setup lang="ts">
import { countries, getCountryByCode } from '~/utils/countries'

interface Props {
  modelValue?: string  // ISO country code
  placeholder?: string
  searchPlaceholder?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string | undefined): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  placeholder: 'Select a country',
  searchPlaceholder: 'Search countries...',
  size: 'lg',
  disabled: false
})

const emit = defineEmits<Emits>()

// When using value-key, v-model receives the primitive value (code string)
const selectedCode = computed({
  get: () => props.modelValue,
  set: (code: string | undefined) => emit('update:modelValue', code)
})

// Get the full country object for display in the trigger
const selectedCountry = computed(() => {
  return props.modelValue ? getCountryByCode(props.modelValue) : undefined
})
</script>
