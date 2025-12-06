// plugins/i18n.ts
import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import el from './locales/el.json'

export default defineNuxtPlugin(({ vueApp }) => {
  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
      en,
      el
    }
  })

  vueApp.use(i18n)
})