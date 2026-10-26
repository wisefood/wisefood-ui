/**
 * The shape of the in-app help.
 *
 * Two halves, kept apart on purpose:
 *
 * - `topics.ts` is the structure: which pages a topic covers, its features,
 *   and which of them have a guided tour or a video. One file, no language.
 * - `content/<locale>.ts` is the words. One file per interface language, each
 *   typed against `HelpContent`, so a translation that skips a topic or a
 *   feature does not compile.
 *
 * WRITING CONVENTIONS (they keep the text short and in step with the UI)
 *
 * - A control the person has to find is written `[[i18n.key]]`, and renders
 *   as that key's text in the interface language: the help always names the
 *   button exactly as the page labels it, including after somebody renames
 *   it. `[[=Literal]]` is for the few labels still hard-coded in English in a
 *   template; they show the same text in every language, as on the page.
 * - Steps are imperative and one action each. Three to five per feature.
 * - `body` is one or two sentences: what it is for, not how it works.
 */

export type HelpArea = 'start' | 'foodchat' | 'foodscholar' | 'recipewrangler' | 'account'

export type HelpTopicId
  = | 'dashboard'
    | 'foodchat'
    | 'foodscholar'
    | 'foodscholar-catalog'
    | 'foodscholar-article'
    | 'foodscholar-guides'
    | 'foodscholar-textbooks'
    | 'foodscholar-hierarchy'
    | 'recipes'
    | 'recipe'
    | 'recipes-compare'
    | 'library'
    | 'my-profile'
    | 'profiles'

export interface HelpFeatureDef {
  id: string
  /** Lucide icon. */
  icon: string
  /** Block key of the Flows manual-start block for this feature's tour. */
  tour?: string
  /** Id of the clip in the help media manifest (`<media base>/manifest.json`). */
  video?: string
  /** Shown only to guests, or only to people with a real account. */
  audience?: 'guest' | 'member'
}

export interface HelpTopicDef {
  id: HelpTopicId
  area: HelpArea
  icon: string
  /** The page a tour for this topic starts on, and where the topic list links to. */
  home: string
  /** Route paths (no base URL) this topic explains. */
  match: (path: string) => boolean
  features: HelpFeatureDef[]
}

export interface HelpFeatureText {
  title: string
  body: string
  steps: string[]
  /** A caveat worth a line of its own: a precondition, a limit. */
  note?: string
}

export interface HelpTopicText {
  title: string
  summary: string
  features: Record<string, HelpFeatureText>
  tips?: string[]
}

export interface HelpUiText {
  button: string
  title: string
  close: string
  whatYouCanDo: string
  tips: string
  allTopics: string
  backToPage: string
  thisPage: string
  showMe: string
  tourStarting: string
  tourUnavailable: string
  tourUnavailableBody: string
  watch: string
  videoLabel: string
  stillStuck: string
  stillStuckBody: string
  sendFeedback: string
  reportBug: string
  noTopic: string
  keyboardHint: string
  areas: Record<HelpArea, string>
}

export interface HelpContent {
  ui: HelpUiText
  topics: Record<HelpTopicId, HelpTopicText>
}
