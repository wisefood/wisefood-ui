/**
 * Naming a device in one word and one glyph.
 *
 * The session board is read by scanning, not by reading: an expert looking for
 * "the ones on iPhones" should find them without parsing a version string on
 * every row. So each of browser, operating system and form factor resolves to
 * an icon and a colour, and unknown values resolve to a neutral one rather
 * than to nothing — a blank cell reads as a bug, and "we could not tell" is a
 * real and common answer for a stripped user agent.
 *
 * Icons are Lucide plus Simple Icons, both already in the console's icon set.
 */

export interface Glyph {
  icon: string
  /** Tailwind text colour classes, light and dark. */
  tone: string
  label: string
}

const UNKNOWN: Glyph = {
  icon: 'i-lucide-circle-help',
  tone: 'text-gray-400 dark:text-gray-500',
  label: 'Unknown'
}

const OPERATING_SYSTEMS: Record<string, Glyph> = {
  'windows': { icon: 'i-simple-icons-windows', tone: 'text-sky-600 dark:text-sky-400', label: 'Windows' },
  'macos': { icon: 'i-simple-icons-apple', tone: 'text-gray-700 dark:text-gray-200', label: 'macOS' },
  'ios': { icon: 'i-simple-icons-apple', tone: 'text-gray-700 dark:text-gray-200', label: 'iOS' },
  'android': { icon: 'i-simple-icons-android', tone: 'text-emerald-600 dark:text-emerald-400', label: 'Android' },
  'linux': { icon: 'i-simple-icons-linux', tone: 'text-amber-600 dark:text-amber-400', label: 'Linux' },
  'ubuntu': { icon: 'i-simple-icons-ubuntu', tone: 'text-orange-600 dark:text-orange-400', label: 'Ubuntu' },
  'chrome os': { icon: 'i-simple-icons-googlechrome', tone: 'text-blue-600 dark:text-blue-400', label: 'ChromeOS' }
}

const BROWSERS: Record<string, Glyph> = {
  'chrome': { icon: 'i-simple-icons-googlechrome', tone: 'text-blue-600 dark:text-blue-400', label: 'Chrome' },
  'safari': { icon: 'i-simple-icons-safari', tone: 'text-sky-600 dark:text-sky-400', label: 'Safari' },
  'firefox': { icon: 'i-simple-icons-firefoxbrowser', tone: 'text-orange-600 dark:text-orange-400', label: 'Firefox' },
  'edge': { icon: 'i-simple-icons-microsoftedge', tone: 'text-teal-600 dark:text-teal-400', label: 'Edge' },
  'opera': { icon: 'i-simple-icons-opera', tone: 'text-red-600 dark:text-red-400', label: 'Opera' },
  'brave': { icon: 'i-simple-icons-brave', tone: 'text-orange-600 dark:text-orange-400', label: 'Brave' },
  'vivaldi': { icon: 'i-simple-icons-vivaldi', tone: 'text-red-600 dark:text-red-400', label: 'Vivaldi' },
  'samsung internet': { icon: 'i-simple-icons-samsung', tone: 'text-indigo-600 dark:text-indigo-400', label: 'Samsung' },
  'internet explorer': { icon: 'i-lucide-globe', tone: 'text-gray-500', label: 'Internet Explorer' }
}

const DEVICES: Record<string, Glyph> = {
  desktop: { icon: 'i-lucide-monitor', tone: 'text-gray-600 dark:text-gray-300', label: 'Desktop' },
  mobile: { icon: 'i-lucide-smartphone', tone: 'text-gray-600 dark:text-gray-300', label: 'Phone' },
  tablet: { icon: 'i-lucide-tablet', tone: 'text-gray-600 dark:text-gray-300', label: 'Tablet' },
  // Crawlers are excluded from the board by default, so where one appears it
  // is because somebody asked for it and should be able to see which it is.
  bot: { icon: 'i-lucide-bot', tone: 'text-purple-500 dark:text-purple-400', label: 'Crawler' }
}

const pick = (table: Record<string, Glyph>, value: string | null | undefined): Glyph =>
  (value && table[value.trim().toLowerCase()]) || UNKNOWN

export const osGlyph = (os: string | null | undefined): Glyph => pick(OPERATING_SYSTEMS, os)
export const browserGlyph = (browser: string | null | undefined): Glyph => pick(BROWSERS, browser)
export const deviceGlyph = (device: string | null | undefined): Glyph => pick(DEVICES, device)

/**
 * A screen size as a name rather than a number.
 *
 * The useful question about a viewport is which side of a layout breakpoint it
 * falls on, and these are the console's own Tailwind breakpoints.
 */
export function viewportClass(width: number | null | undefined): string {
  if (!width) return 'unknown'
  if (width < 640) return 'phone'
  if (width < 1024) return 'tablet'
  if (width < 1440) return 'laptop'
  return 'desktop'
}

/** A flag emoji from a two-letter country code, or an empty string. */
export function countryFlag(code: string | null | undefined): string {
  const value = (code || '').trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(value)) return ''
  // Regional indicator symbols sit at a fixed offset from the ASCII letters.
  return String.fromCodePoint(...[...value].map(c => 0x1f1e6 + c.charCodeAt(0) - 65))
}

/** "2m 14s" — a duration a person reads, not a number of seconds. */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || seconds < 0) return '—'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${Math.round(seconds % 60)}s`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}
