/**
 * One definition of the analytics console's sections.
 *
 * Shared between the persistent menu and the overview page's launcher, so the
 * two cannot drift — a page added to one and forgotten in the other is a page
 * nobody finds.
 *
 * The groups are the questions people arrive with, not the tables the data
 * lives in: someone knows they want to see whether the product is working
 * before they know the page is called "Service health".
 */
export interface InsightsLink {
  label: string
  to: string
  icon: string
  /** One line on what this page answers. Shown in the menu and the launcher. */
  hint: string
}

export interface InsightsGroup {
  title: string
  icon: string
  links: InsightsLink[]
}

export const INSIGHTS_NAV: InsightsGroup[] = [
  {
    title: 'Activity',
    icon: 'i-lucide-activity',
    links: [
      {
        label: 'Search insights',
        to: '/console/insights/queries',
        icon: 'i-lucide-search',
        hint: 'What people look for, and what the catalogue is missing'
      },
      {
        label: 'Content & answers',
        to: '/console/insights/content',
        icon: 'i-lucide-file-text',
        hint: 'How answers were made, chat intents, top pages'
      },
      {
        label: 'Usage patterns',
        to: '/console/insights/patterns',
        icon: 'i-lucide-calendar-clock',
        hint: 'When people use it, how deep a visit goes, who returns'
      },
      {
        label: 'Expert activity',
        to: '/console/insights/activity',
        icon: 'i-lucide-clipboard-list',
        hint: 'What admins and experts did in the console'
      }
    ]
  },
  {
    title: 'People',
    icon: 'i-lucide-users',
    links: [
      {
        label: 'People',
        to: '/console/insights/users',
        icon: 'i-lucide-user',
        hint: 'Per-person activity and cost, where consent allows'
      },
      {
        label: 'Sessions',
        to: '/console/insights/sessions',
        icon: 'i-lucide-monitor-smartphone',
        hint: 'Every visit with its device, duration and errors'
      },
      {
        label: 'Audience',
        to: '/console/insights/audience',
        icon: 'i-lucide-languages',
        hint: 'Browser or SDK, which language, which role'
      }
    ]
  },
  {
    title: 'Quality',
    icon: 'i-lucide-badge-check',
    links: [
      {
        label: 'Q&A review',
        to: '/console/insights/qa',
        icon: 'i-lucide-message-circle-question',
        hint: 'Read the questions asked and record a verdict'
      },
      {
        label: 'Feedback inbox',
        to: '/console/insights/feedback',
        icon: 'i-lucide-message-square',
        hint: 'What people rated, and what they complained about'
      }
    ]
  },
  {
    title: 'Health',
    icon: 'i-lucide-gauge',
    links: [
      {
        label: 'Service health',
        to: '/console/insights/performance',
        icon: 'i-lucide-server',
        hint: 'Latency and error rate per endpoint'
      },
      {
        label: 'Browser errors',
        to: '/console/insights/errors',
        icon: 'i-lucide-bug',
        hint: 'What broke, grouped, ranked by people affected'
      },
      {
        label: 'Page speed',
        to: '/console/insights/speed',
        icon: 'i-lucide-timer',
        hint: 'How fast pages felt, as the browser measured it'
      },
      {
        label: 'Click maps',
        to: '/console/insights/heatmaps',
        icon: 'i-lucide-mouse-pointer-click',
        hint: 'Where people click, and where they get stuck'
      }
    ]
  },
  {
    title: 'Cost',
    icon: 'i-lucide-banknote',
    links: [
      {
        label: 'Model usage',
        to: '/console/insights/usage',
        icon: 'i-lucide-cpu',
        hint: 'Tokens and spend by model, app, feature and person'
      }
    ]
  }
]

/** The group a path belongs to, for breadcrumbs. */
export function insightsGroupFor(path: string): InsightsGroup | null {
  return INSIGHTS_NAV.find(group => group.links.some(l => path.startsWith(l.to))) ?? null
}
