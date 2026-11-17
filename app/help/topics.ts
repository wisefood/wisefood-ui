import type { HelpTopicDef, HelpTopicId } from './types'

/**
 * Which help topic explains which page, and what each topic covers.
 *
 * Order matters twice: `HELP_TOPICS` is the order the topic list shows, and
 * `topicForPath` takes the first match, so a pattern that would swallow its
 * neighbours (`/foodscholar/<anything>` is an article) is tried after them.
 *
 * `video` names a clip in the media manifest, and a clip the manifest does
 * not list simply is not shown — features can name their clip before it is
 * recorded. (Features also named a Flows "Show me" tour until 2026-11-17,
 * when Help dropped them for the clips; flows.sh keeps their spec.)
 */

const normalise = (path: string) => (path.length > 1 ? path.replace(/\/+$/, '') : path)

const FOODSCHOLAR_SECTIONS = new Set(['catalog', 'guides', 'textbooks', 'hierarchy'])

export const HELP_TOPICS: HelpTopicDef[] = [
  {
    id: 'dashboard',
    area: 'start',
    icon: 'i-lucide-layout-dashboard',
    home: '/dashboard',
    match: p => p === '/dashboard',
    features: [
      { id: 'open-apps', icon: 'i-lucide-layout-grid' },
      { id: 'todays-meals', icon: 'i-lucide-calendar-days' },
      { id: 'tips', icon: 'i-lucide-lightbulb' },
      { id: 'recommendations', icon: 'i-lucide-chef-hat' },
      { id: 'switch-profile', icon: 'i-lucide-users' },
      { id: 'guest', icon: 'i-lucide-user-round', audience: 'guest' }
    ]
  },
  {
    id: 'foodchat',
    area: 'foodchat',
    icon: 'i-lucide-messages-square',
    home: '/foodchat',
    match: p => p === '/foodchat',
    features: [
      { id: 'generate-plan', icon: 'i-lucide-sparkles', video: 'foodchat-generate-plan' },
      { id: 'refine', icon: 'i-lucide-message-square-text', video: 'foodchat-refine' },
      { id: 'tools', icon: 'i-lucide-wand-sparkles', video: 'foodchat-tools' },
      { id: 'save-share', icon: 'i-lucide-bookmark', video: 'foodchat-save-share' },
      { id: 'pantry', icon: 'i-lucide-refrigerator', video: 'foodchat-pantry' },
      { id: 'settings', icon: 'i-lucide-sliders-horizontal', video: 'foodchat-settings' },
      { id: 'diners', icon: 'i-lucide-users', video: 'foodchat-diners' },
      { id: 'compose', icon: 'i-lucide-list-plus', video: 'foodchat-compose' }
      // 'adapt' (icon i-lucide-pencil-ruler, video foodchat-adapt) is left out
      // until adapting reaches the plan: most plan meals get "already in great
      // shape", and a saved version changes no plan already made. It returns
      // with RecipeWrangler PR #13; its text is still in content/<locale>.ts.
    ]
  },
  {
    id: 'foodscholar',
    area: 'foodscholar',
    icon: 'i-lucide-graduation-cap',
    home: '/foodscholar',
    match: p => p === '/foodscholar',
    features: [
      { id: 'ask', icon: 'i-lucide-message-circle-question', video: 'foodscholar-ask' },
      { id: 'sources', icon: 'i-lucide-quote', video: 'foodscholar-sources' },
      { id: 'remember', icon: 'i-lucide-brain', video: 'foodscholar-memory' },
      { id: 'follow-up', icon: 'i-lucide-messages-square' },
      { id: 'rate', icon: 'i-lucide-thumbs-up' },
      { id: 'advanced', icon: 'i-lucide-settings-2' },
      { id: 'library', icon: 'i-lucide-library' }
    ]
  },
  {
    id: 'foodscholar-catalog',
    area: 'foodscholar',
    icon: 'i-lucide-newspaper',
    home: '/foodscholar/catalog',
    match: p => p.startsWith('/foodscholar/catalog'),
    features: [
      { id: 'search', icon: 'i-lucide-search', video: 'foodscholar-catalog-search' },
      { id: 'filters', icon: 'i-lucide-filter' },
      { id: 'summary', icon: 'i-lucide-sparkles' }
    ]
  },
  {
    id: 'foodscholar-guides',
    area: 'foodscholar',
    icon: 'i-lucide-map',
    home: '/foodscholar/guides',
    match: p => p.startsWith('/foodscholar/guides'),
    features: [
      { id: 'find', icon: 'i-lucide-search' },
      { id: 'map', icon: 'i-lucide-map-pin', video: 'foodscholar-guides-map' },
      { id: 'explorer', icon: 'i-lucide-list-filter', video: 'foodscholar-guides-explorer' },
      { id: 'read', icon: 'i-lucide-file-text' }
    ]
  },
  {
    id: 'foodscholar-textbooks',
    area: 'foodscholar',
    icon: 'i-lucide-book-open',
    home: '/foodscholar/textbooks',
    match: p => p.startsWith('/foodscholar/textbooks'),
    features: [
      { id: 'find', icon: 'i-lucide-search', video: 'foodscholar-textbooks' },
      { id: 'inside', icon: 'i-lucide-book-open-text' }
    ]
  },
  {
    id: 'foodscholar-hierarchy',
    area: 'foodscholar',
    icon: 'i-lucide-network',
    home: '/foodscholar/hierarchy',
    match: p => p === '/foodscholar/hierarchy',
    features: [
      { id: 'search', icon: 'i-lucide-search' },
      { id: 'browse', icon: 'i-lucide-list-tree', video: 'foodscholar-hierarchy' },
      { id: 'ask', icon: 'i-lucide-message-circle-question' }
    ]
  },
  {
    // Last of the FoodScholar topics: any other single segment is an article.
    id: 'foodscholar-article',
    area: 'foodscholar',
    icon: 'i-lucide-file-text',
    home: '/foodscholar/catalog',
    match: (p) => {
      const m = /^\/foodscholar\/([^/]+)$/.exec(p)
      return Boolean(m && !FOODSCHOLAR_SECTIONS.has(m[1]!))
    },
    features: [
      { id: 'read', icon: 'i-lucide-book-open-text', video: 'foodscholar-article' },
      { id: 'questions', icon: 'i-lucide-messages-square', video: 'foodscholar-article' },
      { id: 'save', icon: 'i-lucide-bookmark' }
    ]
  },
  {
    id: 'recipes',
    area: 'recipewrangler',
    icon: 'i-lucide-chef-hat',
    home: '/recipe-wrangler',
    match: p => p === '/recipe-wrangler'
      || p.startsWith('/recipe-wrangler/collections/')
      || p.startsWith('/recipe-wrangler/fctables/'),
    features: [
      { id: 'search', icon: 'i-lucide-search', video: 'recipes-search' },
      { id: 'personalized', icon: 'i-lucide-user-check' },
      { id: 'filters', icon: 'i-lucide-filter' },
      { id: 'compare', icon: 'i-lucide-columns-3' },
      { id: 'analyze', icon: 'i-lucide-scan-text', video: 'recipes-analyze' },
      { id: 'favorites', icon: 'i-lucide-heart' },
      { id: 'sources', icon: 'i-lucide-database' }
    ]
  },
  {
    id: 'recipes-compare',
    area: 'recipewrangler',
    icon: 'i-lucide-columns-3',
    home: '/recipe-wrangler/compare',
    match: p => p === '/recipe-wrangler/compare',
    features: [
      { id: 'read', icon: 'i-lucide-table' },
      { id: 'manage', icon: 'i-lucide-list-x' }
    ]
  },
  {
    // After compare: any other single segment is a recipe.
    id: 'recipe',
    area: 'recipewrangler',
    icon: 'i-lucide-utensils',
    home: '/recipe-wrangler',
    match: p => /^\/recipe-wrangler\/[^/]+$/.test(p),
    features: [
      { id: 'scores', icon: 'i-lucide-gauge' },
      { id: 'nutrition', icon: 'i-lucide-chart-pie' },
      { id: 'servings', icon: 'i-lucide-replace' },
      { id: 'improve', icon: 'i-lucide-wand-sparkles', video: 'recipe-improve' },
      { id: 'save', icon: 'i-lucide-heart' },
      { id: 'report', icon: 'i-lucide-flag' }
    ]
  },
  {
    id: 'library',
    area: 'account',
    icon: 'i-lucide-library',
    home: '/library',
    match: p => p === '/library',
    features: [
      { id: 'saved', icon: 'i-lucide-bookmark' },
      { id: 'plans', icon: 'i-lucide-calendar-check' }
    ]
  },
  {
    id: 'my-profile',
    area: 'account',
    icon: 'i-lucide-user-round-cog',
    home: '/my-profile',
    match: p => p === '/my-profile',
    features: [
      { id: 'quick-setup', icon: 'i-lucide-wand-sparkles' },
      { id: 'diet-allergies', icon: 'i-lucide-shield-alert' },
      { id: 'likes', icon: 'i-lucide-thumbs-up' },
      { id: 'memory', icon: 'i-lucide-brain' },
      { id: 'details', icon: 'i-lucide-id-card' },
      { id: 'privacy', icon: 'i-lucide-lock' }
    ]
  },
  {
    id: 'profiles',
    area: 'account',
    icon: 'i-lucide-users',
    home: '/profiles',
    match: p => p === '/profiles',
    features: [
      { id: 'choose', icon: 'i-lucide-mouse-pointer-click' },
      { id: 'add', icon: 'i-lucide-user-plus' },
      { id: 'manage', icon: 'i-lucide-user-cog' },
      { id: 'setup', icon: 'i-lucide-house' }
    ]
  }
]

const BY_ID = new Map(HELP_TOPICS.map(topic => [topic.id, topic]))

export function helpTopic(id: HelpTopicId): HelpTopicDef | undefined {
  return BY_ID.get(id)
}

/** The topic explaining this route path, if any page of ours is there. */
export function topicForPath(path: string): HelpTopicDef | undefined {
  const p = normalise(path)
  return HELP_TOPICS.find(topic => topic.match(p))
}
