import { createI18n } from 'vue-i18n'
import en from '~/i18n/locales/en.json'
import hu from '~/i18n/locales/hu.json'
import sl from '~/i18n/locales/sl.json'

const SUPPORTED_LOCALES = ['en', 'hu', 'sl'] as const
type SupportedLocale = typeof SUPPORTED_LOCALES[number]

const resolveInitialLocale = (candidate: string | undefined): SupportedLocale => {
  if (candidate && SUPPORTED_LOCALES.includes(candidate as SupportedLocale)) {
    return candidate as SupportedLocale
  }
  return 'en'
}

export default defineNuxtPlugin((nuxtApp) => {
  // Get the initial locale from the request cookie on server
  let initialLocale: SupportedLocale = 'en'

  if (import.meta.server) {
    // Server-side: Read from the incoming request
    const cookie = useRequestHeaders(['cookie'])?.cookie
    const match = cookie?.match(/wisefood_locale=([^;]+)/)
    initialLocale = resolveInitialLocale(match?.[1])
  } else {
    // Client-side: Read from document.cookie
    const match = document.cookie.match(/wisefood_locale=([^;]+)/)
    initialLocale = resolveInitialLocale(match?.[1])
  }

  const i18n = createI18n({
    legacy: false,
    locale: initialLocale,
    fallbackLocale: 'en',
    messages: {
      en,
      hu,
      sl,
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
