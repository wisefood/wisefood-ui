<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { onClickOutside } from '@vueuse/core'

const { locale } = useI18n()

const languages = [
  { code: 'en', name: 'English', flagSrc: '/flags/gb.svg' },
  { code: 'hu', name: 'Magyar', flagSrc: '/flags/hu.svg' },
  { code: 'sl', name: 'Slovenščina', flagSrc: '/flags/si.svg' }
]

const currentLanguage = computed(() =>
  languages.find(l => l.code === locale.value) || languages[0]
)

const isOpen = ref(false)
const dropdown = ref(null)

const changeLanguage = (code: string) => {
  locale.value = code
  if (import.meta.client) {
    document.cookie = `wisefood_locale=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
  }
  isOpen.value = false
}

onClickOutside(dropdown, () => {
  isOpen.value = false
})
</script>

<template>
  <div ref="dropdown" class="relative">
    <UButton
      color="gray"
      variant="ghost"
      trailing-icon="i-heroicons-chevron-down-20-solid"
      @click="isOpen = !isOpen"
    >
      <img
        :src="currentLanguage.flagSrc"
        :alt="currentLanguage.code.toUpperCase()"
        class="h-4 w-6 rounded-[2px] object-cover shadow-sm"
      >
      <span>{{ currentLanguage.name }}</span>
    </UButton>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50 py-1"
      >
        <button
          v-for="lang in languages"
          :key="lang.code"
          @click="changeLanguage(lang.code)"
          class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
          :class="{ 'bg-primary-50 dark:bg-primary-900': locale === lang.code }"
        >
          <img
            :src="lang.flagSrc"
            :alt="lang.code.toUpperCase()"
            class="h-4 w-6 rounded-[2px] object-cover shadow-sm"
          >
          <span>{{ lang.name }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>
