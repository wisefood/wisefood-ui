// composables/useLocale.ts
import { useI18n } from 'vue-i18n'

export const useLocale = () => {
  const { locale, availableLocales } = useI18n()
  
  const locales = [
    { code: 'en', name: 'English' },
    { code: 'el', name: 'Ελληνικά' }
  ]
  
  const setLocale = (code: string) => {
    locale.value = code
  }
  
  return {
    locale,
    locales,
    availableLocales,
    setLocale
  }
}