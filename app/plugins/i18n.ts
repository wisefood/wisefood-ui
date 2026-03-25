import { createI18n } from 'vue-i18n'
import en from '~/i18n/locales/en.json'
import hu from '~/i18n/locales/hu.json'
import sl from '~/i18n/locales/sl.json'

const SUPPORTED_LOCALES = ['en', 'hu', 'sl'] as const
type SupportedLocale = typeof SUPPORTED_LOCALES[number]
const LOCALE_STATE_KEY = 'wisefood-locale-state'

const resolveInitialLocale = (candidate: string | undefined): SupportedLocale => {
  if (!candidate) return 'en'

  const decoded = decodeURIComponent(candidate).trim()
  if (SUPPORTED_LOCALES.includes(decoded as SupportedLocale)) {
    return decoded as SupportedLocale
  }
  return 'en'
}

export default defineNuxtPlugin((nuxtApp) => {
  const localeState = useState<SupportedLocale>(LOCALE_STATE_KEY, () => 'en')

  if (import.meta.server) {
    const cookieLocale = useCookie<string | undefined>('wisefood_locale').value
    localeState.value = resolveInitialLocale(cookieLocale)
  } else if (!nuxtApp.isHydrating) {
    const cookieLocale = useCookie<string | undefined>('wisefood_locale').value
    localeState.value = resolveInitialLocale(cookieLocale)
  }

  const i18n = createI18n({
    legacy: false,
    locale: localeState.value,
    fallbackLocale: 'en',
    messages: {
      en,
      hu,
      sl
    }
  })

  nuxtApp.vueApp.use(i18n)

  if (import.meta.client) {
    nuxtApp.hook('app:mounted', () => {
      const cookieLocale = useCookie<string | undefined>('wisefood_locale').value
      const resolvedLocale = resolveInitialLocale(cookieLocale)

      if (i18n.global.locale.value !== resolvedLocale) {
        i18n.global.locale.value = resolvedLocale
      }

      localeState.value = resolvedLocale
    })
  }

  return {
    provide: {
      i18n,
      t: i18n.global.t
    }
  }
})
