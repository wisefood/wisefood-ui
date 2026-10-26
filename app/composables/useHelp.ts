import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { HELP_TOPICS, helpTopic, topicForPath } from '~/help/topics'
import type { HelpContent, HelpFeatureDef, HelpTopicDef, HelpTopicId } from '~/help/types'
import en from '~/help/content/en'
import hu from '~/help/content/hu'
import sl from '~/help/content/sl'
import { track } from '~/composables/useTelemetry'
import { ignoreTroubleUnder } from '~/composables/useTroubleSignal'
import { useAuthStore } from '~/stores/auth'

/**
 * The help companion's state, shared by the header button, the dock and the
 * panel itself.
 *
 * Module-level refs rather than a store: there is one panel, and anything
 * that can open it — the header, the dock's speed-dial, the `?` key, a link
 * inside another component — needs the same `open` without a provider.
 *
 * The panel follows the page. Opened on FoodChat it explains FoodChat; leave
 * it open and go to a recipe and it explains the recipe. Picking another
 * topic from the list pins that topic until the next navigation.
 */

const CONTENT: Record<string, HelpContent> = { en, hu, sl }
const SEEN_KEY = 'wisefood-help-seen'

export type HelpVia = 'header' | 'dock' | 'keyboard' | 'link'

const open = ref(false)
/** A topic picked from the list; `null` follows the current page. */
const pinnedTopic = ref<HelpTopicId | null>(null)
const showingIndex = ref(false)
/** The feature to expand and scroll to when the panel opens. */
const focusFeature = ref<string | null>(null)
const seen = ref<Set<string>>(readSeen())

function readSeen(): Set<string> {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(SEEN_KEY)
    const list = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

function markSeen(id: string | undefined): void {
  if (!id || seen.value.has(id)) return
  const next = new Set(seen.value)
  next.add(id)
  seen.value = next
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...next]))
  } catch {
    // Private mode: the dot comes back next visit, which is harmless.
  }
}

function emit(action: string, props: Record<string, unknown>): void {
  track('feature.used', { feature: 'help', action, ...props })
}

/**
 * A dock panel somebody else asked to open. The help panel's "Send feedback"
 * hands over to the dock's own feedback panel rather than growing a copy.
 */
export const dockRequest = ref<{ panel: 'feedback', at: number } | null>(null)

export function requestDockPanel(panel: 'feedback'): void {
  dockRequest.value = { panel, at: Date.now() }
}

/** Called when the route changes: a new page gets its own topic. */
export function followPage(path: string): void {
  pinnedTopic.value = null
  showingIndex.value = false
  focusFeature.value = null
  if (open.value) markSeen(topicForPath(path)?.id)
}

export function useHelp() {
  const route = useRoute()
  const { locale } = useI18n()
  const authStore = useAuthStore()

  const content = computed<HelpContent>(() => CONTENT[locale.value] ?? en)
  const pageTopic = computed(() => topicForPath(route.path))
  const topic = computed<HelpTopicDef | undefined>(() =>
    pinnedTopic.value ? helpTopic(pinnedTopic.value) : pageTopic.value
  )
  const isPageTopic = computed(() => Boolean(topic.value && topic.value.id === pageTopic.value?.id))
  const unseen = computed(() => Boolean(pageTopic.value && !seen.value.has(pageTopic.value.id)))

  /** A topic's features, minus the ones written for somebody else. */
  function featuresOf(def: HelpTopicDef): HelpFeatureDef[] {
    const guest = authStore.isGuest
    return def.features.filter(f => !f.audience || (f.audience === 'guest') === guest)
  }

  function openHelp(options: { via: HelpVia, topic?: HelpTopicId, feature?: string }): void {
    if (options.topic && options.topic !== pageTopic.value?.id) pinnedTopic.value = options.topic
    focusFeature.value = options.feature ?? null
    showingIndex.value = !options.topic && !pageTopic.value
    open.value = true
    markSeen(pageTopic.value?.id)
    emit('open', { via: options.via, topic: options.topic ?? pageTopic.value?.id ?? null })
  }

  function closeHelp(): void {
    open.value = false
  }

  function toggleHelp(via: HelpVia): void {
    if (open.value) closeHelp()
    else openHelp({ via })
  }

  function showTopic(id: HelpTopicId): void {
    pinnedTopic.value = id === pageTopic.value?.id ? null : id
    showingIndex.value = false
    focusFeature.value = null
    emit('topic', { topic: id })
  }

  function showIndex(): void {
    showingIndex.value = true
  }

  function backToPage(): void {
    pinnedTopic.value = null
    showingIndex.value = false
  }

  return {
    open,
    content,
    topics: HELP_TOPICS,
    topic,
    pageTopic,
    isPageTopic,
    showingIndex,
    focusFeature,
    unseen,
    featuresOf,
    openHelp,
    closeHelp,
    toggleHelp,
    showTopic,
    showIndex,
    backToPage,
    emit
  }
}

// ------------------------------------------------------------------ media

export interface HelpClip {
  src: string
  poster?: string
  /** Seconds, shown on the poster so nobody starts a five-minute video by accident. */
  duration?: number
  captions?: string
}

interface ManifestClip {
  src: string
  /** A recording of the interface in another language, keyed by locale. */
  sources?: Record<string, string>
  poster?: string
  duration?: number
  /** WebVTT files keyed by locale. */
  captions?: Record<string, string>
}

const manifest = shallowRef<Record<string, ManifestClip> | null>(null)
let manifestBase = ''
let manifestLoad: Promise<void> | null = null

function resolveMedia(file: string | undefined): string | undefined {
  if (!file) return undefined
  if (/^https?:\/\//.test(file) || file.startsWith('/')) return file
  return `${manifestBase}/${file}`
}

/**
 * Read `<base>/manifest.json` once. Clips are optional: a missing manifest,
 * a refused bucket or a malformed file all mean "no videos yet", and the
 * panel shows the written steps alone.
 */
export function loadHelpMedia(base: string): Promise<void> {
  if (manifestLoad) return manifestLoad
  manifestBase = base
  ignoreTroubleUnder(base)
  manifestLoad = fetch(`${base}/manifest.json`, { cache: 'no-cache' })
    .then(response => (response.ok ? response.json() : null))
    .then((json: { videos?: Record<string, ManifestClip> } | null) => {
      const videos = json && typeof json.videos === 'object' && json.videos ? json.videos : {}
      manifest.value = Object.fromEntries(
        Object.entries(videos).filter(([, clip]) => clip && typeof clip.src === 'string')
      )
    })
    .catch(() => {
      manifest.value = {}
    })
  return manifestLoad
}

export function useHelpClip() {
  const { locale } = useI18n()
  return (id: string | undefined): HelpClip | null => {
    const clip = id ? manifest.value?.[id] : undefined
    if (!clip) return null
    return {
      src: resolveMedia(clip.sources?.[locale.value] ?? clip.src)!,
      poster: resolveMedia(clip.poster),
      duration: typeof clip.duration === 'number' ? clip.duration : undefined,
      captions: resolveMedia(clip.captions?.[locale.value] ?? clip.captions?.en)
    }
  }
}
