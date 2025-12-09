import { createI18n } from 'vue-i18n'
import en from '~/i18n/locales/en.json'
import el from '~/i18n/locales/el.json'

export default defineNuxtPlugin((nuxtApp) => {
  // Get the initial locale from the request cookie on server
  let initialLocale = 'en'
  
  if (import.meta.server) {
    // Server-side: Read from the incoming request
    const cookie = useRequestHeaders(['cookie'])?.cookie
    const match = cookie?.match(/wisefood_locale=([^;]+)/)
    initialLocale = match ? match[1] : 'en'
  } else {
    // Client-side: Read from document.cookie
    const match = document.cookie.match(/wisefood_locale=([^;]+)/)
    initialLocale = match ? match[1] : 'en'
  }

  const i18n = createI18n({
    legacy: false,
    locale: initialLocale,
    fallbackLocale: 'en',
    messages: {
      en,  
      el,
    },
  })

  nuxtApp.vueApp.use(i18n)

  return {
    provide: {
      i18n,
      t: i18n.global.t,
    },
  }
})