import { createI18n } from "vue-i18n";
import type { App } from "vue";

// Import translation files
import en from "./locales/en.json";
import hu from "./locales/hu.json";
import sl from "./locales/sl.json";

export type SupportedLanguages = "en" | "hu" | "sl";

const messages = {
  en,
  hu,
  sl,
};

const LOCALE_STORAGE_KEY = "wisefood-locale";

// Function to get saved locale from localStorage
function getSavedLocale(): SupportedLanguages {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && (saved === "en" || saved === "hu" || saved === "sl")) {
      return saved as SupportedLanguages;
    }
  } catch (error) {
    console.warn("localStorage not available:", error);
  }

  // Default to 'en'
  return "en";
}

// Function to save locale to localStorage
function saveLocale(locale: SupportedLanguages): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch (error) {
    console.warn("Failed to save locale:", error);
  }
}

const initialLocale = getSavedLocale();

export const i18n = createI18n({
  locale: initialLocale,
  fallbackLocale: "en",
  messages,
  legacy: false,
});

export default function setupI18n(app: App) {
  app.use(i18n);
  return app;
}

export { saveLocale, getSavedLocale, LOCALE_STORAGE_KEY };
