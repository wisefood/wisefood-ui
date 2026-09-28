import { useI18n } from 'vue-i18n'
import { en, hu, sl } from '@nuxt/ui/locale'
import type { Locale, Messages } from '@nuxt/ui'

const UI_LOCALES: Record<string, Locale<Messages>> = { en, hu, sl }

/**
 * Nuxt UI's own strings ("Open menu", "No data", the pagination labels),
 * in the app's current language rather than always English.
 *
 * The header's mobile menu also announces itself with `header.title` and
 * `header.description`, which Nuxt UI 4.2 references but never shipped in
 * its locale files, so a screen reader was read the raw keys. They come
 * from the app's own bundle instead.
 */
export function useUiLocale() {
  const { locale, t } = useI18n()

  return computed<Locale<Messages>>(() => {
    const base = UI_LOCALES[locale.value] ?? en
    return {
      ...base,
      messages: {
        ...base.messages,
        header: {
          ...base.messages.header,
          title: t('header.menu.title'),
          description: t('header.menu.description')
        }
      }
    } as Locale<Messages>
  })
}
