/**
 * On-demand machine translation for catalogue content.
 *
 * Why this exists
 * ---------------
 * Recipes, articles, guides and collections are stored English text. There is
 * no generation step to ask for Hungarian, the way there is for a FoodScholar
 * tip or answer, so the only options are translating at ingest or translating
 * in the page. This is the second one.
 *
 * What it is NOT for
 * ------------------
 * Anything vue-i18n already translates. The UI chrome has hand-written hu/sl/el
 * bundles, and running a machine translator over them produces worse Hungarian
 * than the Hungarian we already have. The layout root carries `translate="no"`
 * and only `<TranslatableContent>` re-enables it, so the widget can reach the
 * catalogue text and nothing else.
 *
 * Known fragility — read before extending this
 * --------------------------------------------
 * Google Translate rewrites text nodes in the live DOM. Vue holds references to
 * those same nodes, so a component that re-renders a translated subtree can
 * throw `NotFoundError: Failed to execute 'removeChild' on 'Node'`. That is why
 * this is opt-in per region and why the regions it is used on should be
 * settled content, not lists that stream, filter or re-sort under the user.
 * Do not wrap search results or an SSE-streamed answer in it.
 *
 * It is also a third-party script: activating it sends the wrapped content to
 * Google from the reader's browser. `isActive` is exposed so the page can say
 * so, and nothing loads until the reader asks for it.
 */
import { ref, computed } from 'vue'

const SCRIPT_ID = 'wf-google-translate'
const WIDGET_ID = 'wf-google-translate-element'
const CALLBACK = 'wfGoogleTranslateInit'

/** Locales we offer a translation into, matching the i18n bundles. */
export const TRANSLATABLE_LOCALES = ['hu', 'sl', 'el'] as const

// Module scope, not per-component: the widget is a singleton on the page and
// a second initialisation re-renders it into a detached node.
const scriptState = ref<'idle' | 'loading' | 'ready' | 'failed'>('idle')
const activeLanguage = ref<string | null>(null)

/**
 * Whether this reader has been told, once, that pressing Translate sends the
 * text to Google.
 *
 * Deliberately a local preference and not a consent record. The platform
 * records consent server-side for analytics, at /users/me/analytics-consent,
 * because analytics happens TO somebody passively. Translation only happens
 * when they press a button that names the processor, so what is needed here is
 * an informed first use and a way to stop — not an auditable grant. If a
 * recorded, revocable consent is wanted, it belongs beside the analytics one
 * rather than in localStorage.
 */
const ACK_KEY = 'wisefood_translation_ack'
const acknowledged = ref(false)

function readAck(): boolean {
  // Storage throws in some privacy modes, and a failure here must not block
  // translation — it only means we ask again.
  try {
    return window.localStorage.getItem(ACK_KEY) === '1'
  } catch {
    return false
  }
}

function writeAck(): void {
  try {
    window.localStorage.setItem(ACK_KEY, '1')
  } catch {
    // Non-fatal: the reader is asked once more next time.
  }
}

function injectScript(): Promise<void> {
  if (scriptState.value === 'ready') return Promise.resolve()
  if (typeof document === 'undefined') return Promise.reject(new Error('client only'))

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID)
    if (existing && scriptState.value === 'ready') return resolve()

    scriptState.value = 'loading'

    // The widget renders its own <select>. It has to exist in the DOM before
    // the script runs, and it stays visually hidden — the page drives it.
    if (!document.getElementById(WIDGET_ID)) {
      const host = document.createElement('div')
      host.id = WIDGET_ID
      host.setAttribute('aria-hidden', 'true')
      host.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);'
      document.body.appendChild(host)
    }

    // Google calls this global by name once element.js has parsed.
    ;(window as unknown as Record<string, unknown>)[CALLBACK] = () => {
      const g = (window as unknown as { google?: { translate?: { TranslateElement?: new (o: unknown, id: string) => unknown } } }).google
      const Ctor = g?.translate?.TranslateElement
      if (!Ctor) {
        scriptState.value = 'failed'
        return reject(new Error('TranslateElement unavailable'))
      }
      new Ctor({ pageLanguage: 'en', autoDisplay: false }, WIDGET_ID)
      scriptState.value = 'ready'
      resolve()
    }

    if (existing) return

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = `https://translate.google.com/translate_a/element.js?cb=${CALLBACK}`
    script.async = true
    script.onerror = () => {
      scriptState.value = 'failed'
      reject(new Error('element.js failed to load'))
    }
    document.head.appendChild(script)
  })
}

/**
 * Drive the widget's own <select>.
 *
 * There is no public API for this — the documented integration is a visible
 * dropdown — so the select is the only handle, and it may not exist for a few
 * frames after the script reports ready. Hence the short retry rather than a
 * single attempt.
 */
async function setLanguage(lang: string | null): Promise<boolean> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo')
    if (combo) {
      combo.value = lang ?? ''
      combo.dispatchEvent(new Event('change'))
      return true
    }
    await new Promise(r => setTimeout(r, 100))
  }
  return false
}

export function useGoogleTranslate() {
  const isActive = computed(() => activeLanguage.value !== null)
  const isLoading = computed(() => scriptState.value === 'loading')
  const hasFailed = computed(() => scriptState.value === 'failed')

  /** Translate the opted-in regions into `lang`. Resolves false if unavailable. */
  const translateTo = async (lang: string): Promise<boolean> => {
    try {
      await injectScript()
    } catch {
      return false
    }
    const ok = await setLanguage(lang)
    if (ok) activeLanguage.value = lang
    return ok
  }

  /** Put the original English back. */
  const showOriginal = async (): Promise<void> => {
    if (scriptState.value !== 'ready') {
      activeLanguage.value = null
      return
    }
    await setLanguage(null)
    activeLanguage.value = null
  }

  /** True once the reader has been told where the text goes. */
  const hasAcknowledged = computed(() => acknowledged.value)

  const refreshAck = () => {
    if (import.meta.client) acknowledged.value = readAck()
  }

  const acknowledge = () => {
    acknowledged.value = true
    if (import.meta.client) writeAck()
  }

  return {
    isActive,
    isLoading,
    hasFailed,
    activeLanguage,
    hasAcknowledged,
    refreshAck,
    acknowledge,
    translateTo,
    showOriginal
  }
}
