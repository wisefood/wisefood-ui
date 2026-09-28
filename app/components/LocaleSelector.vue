<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DropdownMenuItem } from '@nuxt/ui'

/**
 * The language switch. A flag alone in the site header, where width is
 * scarce; flag and name inside the mobile menu and at wide desktop sizes.
 */
const props = defineProps<{
  /** Always show the language name, not only from `xl` up. */
  showLabel?: boolean
}>()

const { locale } = useI18n()

const languages = [
  { code: 'en', name: 'English', flagSrc: '/app/flags/gb.svg' },
  { code: 'hu', name: 'Magyar', flagSrc: '/app/flags/hu.svg' },
  { code: 'sl', name: 'Slovenščina', flagSrc: '/app/flags/si.svg' }
]

const currentLanguage = computed(() =>
  languages.find(l => l.code === locale.value) || languages[0]!
)

const changeLanguage = (code: string) => {
  locale.value = code
  if (import.meta.client) {
    document.cookie = `wisefood_locale=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
  }
}

const items = computed<DropdownMenuItem[]>(() => languages.map(lang => ({
  label: lang.name,
  type: 'checkbox' as const,
  checked: lang.code === locale.value,
  flagSrc: lang.flagSrc,
  onSelect: () => changeLanguage(lang.code)
})))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
    :ui="{ content: 'w-48 z-[130]' }"
  >
    <UButton
      color="neutral"
      variant="ghost"
      trailing-icon="i-lucide-chevron-down"
      :aria-label="currentLanguage.name"
      class="min-h-11 lg:min-h-0"
    >
      <img
        :src="currentLanguage.flagSrc"
        alt=""
        aria-hidden="true"
        class="h-4 w-6 rounded-[2px] object-cover shadow-sm"
      >
      <span :class="props.showLabel ? '' : 'hidden xl:inline'">{{ currentLanguage.name }}</span>
    </UButton>

    <template #item-leading="{ item }">
      <img
        :src="(item as { flagSrc: string }).flagSrc"
        alt=""
        aria-hidden="true"
        class="h-4 w-6 rounded-[2px] object-cover shadow-sm"
      >
    </template>
  </UDropdownMenu>
</template>
