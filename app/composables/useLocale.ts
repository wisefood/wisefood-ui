import { watch } from "vue";
import { useI18n } from "vue-i18n";
import type { SupportedLanguages } from "@/i18n";

const LOCALE_STORAGE_KEY = "wisefood-locale";

export function useI18nWithStorage() {
  const { t, locale, availableLocales } = useI18n();

  // Function to save locale to localStorage
  const saveLocale = (newLocale: SupportedLanguages): void => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch (error) {
      console.warn("Failed to save locale to localStorage:", error);
    }
  };

  // Function to load locale from localStorage
  const loadLocale = (): SupportedLanguages => {
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (saved && availableLocales.includes(saved)) {
        return saved as SupportedLanguages;
      }
    } catch (error) {
      console.warn("Failed to load locale from localStorage:", error);
    }

    // Default to 'en'
    return "en";
  };

  // Function to change language
  const changeLanguage = (lng: SupportedLanguages) => {
    locale.value = lng;
    saveLocale(lng);
  };

  // Watch for locale changes and auto-save
  watch(locale, (newLocale) => {
    saveLocale(newLocale as SupportedLanguages);
  });

  // Initialize with saved locale
  const initializeLocale = () => {
    const savedLocale = loadLocale();
    if (locale.value !== savedLocale) {
      locale.value = savedLocale;
    }
  };

  return {
    t,
    locale,
    changeLanguage,
    initializeLocale,
    saveLocale,
    loadLocale,
  };
}