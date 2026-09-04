/**
 * The pure half of real-user monitoring.
 *
 * Everything here takes values in and returns values out: no listeners, no
 * network, no module state. That is deliberate — the rules that decide what a
 * click is called, what a stack trace is allowed to say and whether a metric
 * counts as "poor" are the part worth reasoning about, and none of it should
 * need a browser to be read or exercised.
 *
 * The capture side (`useErrorCapture`, `useInteractionCapture`, `useWebVitals`)
 * holds the state and does the I/O.
 */

/** Coordinates are ten-thousandths of the page box, matching the column. */
export const PCT_SCALE = 10000

/** DB column widths, so a value is never truncated server-side. */
export const MAX_ELEMENT_KEY = 160
export const MAX_MESSAGE = 512
export const MAX_STACK = 4000
export const MAX_URL_PATH = 255

export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}

/**
 * Redact anything that looks like it came from a person rather than from the
 * code.
 *
 * Error messages and stack traces are the one place where free text reaches
 * this pipeline by accident: a failed request puts the URL it called into the
 * message, a validation error quotes the value it rejected, a token ends up in
 * a header dump. The rules below are deliberately greedy — a redacted stack is
 * still perfectly debuggable, and a leaked bearer token is not recoverable.
 */
export function redactText(input: unknown, maxLength = MAX_MESSAGE): string {
  if (input === null || input === undefined) return ''
  let text: string
  try {
    text = typeof input === 'string' ? input : String(input)
  } catch {
    return ''
  }
  try {
    text = text
      // Anything presented as a credential, before the generic rules can only
      // partly mangle it.
      .replace(/\b(bearer|token|authorization|api[-_]?key)\s*[:=]?\s*\S+/gi, '$1 [redacted]')
      // JWTs, which the generic long-string rule would only catch in pieces.
      .replace(/\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}(?:\.[A-Za-z0-9_-]*)?/g, '[jwt]')
      .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[uuid]')
      // Query-string *values* only: the parameter names say which call failed
      // and are worth keeping, the values are whatever the user typed.
      .replace(/([?&][A-Za-z0-9_[\]-]{1,40}=)[^&\s"'<>)]*/g, '$1[v]')
      // Long hex or base64-ish runs: hashes, ids, session keys, raw secrets.
      .replace(/\b[0-9a-f]{16,}\b/gi, '[hash]')
      .replace(/\b[A-Za-z0-9_-]{40,}\b/g, '[hash]')
  } catch {
    return ''
  }
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text
}

/** A stack trace: same redaction, a longer budget, and no absolute origins. */
export function redactStack(stack: unknown): string {
  if (!stack) return ''
  const text = redactText(stack, MAX_STACK)
  try {
    // `https://app.example/_nuxt/x.js` -> `/_nuxt/x.js`. The host is the same
    // on every row and the origin is the only part that can carry a userinfo
    // segment.
    return text.replace(/\bhttps?:\/\/[^/\s)]+/g, '')
  } catch {
    return text
  }
}

/**
 * The path of a URL, without the query or the fragment.
 *
 * Both of those routinely carry a search term, and neither is needed to say
 * which call failed.
 */
export function urlPathOnly(url: unknown): string {
  const raw = typeof url === 'string' ? url : ''
  if (!raw) return ''
  try {
    const parsed = new URL(raw, 'http://x.invalid')
    return redactText(parsed.pathname, MAX_URL_PATH)
  } catch {
    const cut = raw.split(/[?#]/)[0] ?? ''
    return redactText(cut, MAX_URL_PATH)
  }
}

// ------------------------------------------------------------------ elements

/** Tags that are a control by definition. */
const INTERACTIVE_TAGS = new Set(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'OPTION', 'SUMMARY', 'LABEL'])

/**
 * Whether a click on this element was aimed at something that does anything.
 *
 * Used only to decide whether a click is a *candidate* for being dead — the
 * final answer also needs the page to have failed to react.
 */
export function interactiveAncestor(target: Element | null): Element | null {
  let node: Element | null = target
  let depth = 0
  while (node && depth < 12) {
    const tag = node.tagName
    if (INTERACTIVE_TAGS.has(tag)) return node
    if (node.hasAttribute('data-track')) return node
    if (node.hasAttribute('onclick')) return node
    const role = node.getAttribute('role')
    if (role && ['button', 'link', 'menuitem', 'tab', 'switch', 'checkbox', 'radio', 'option'].includes(role)) {
      return node
    }
    if (node.hasAttribute('contenteditable')) return node
    node = node.parentElement
    depth += 1
  }
  return null
}

/** ARIA role if the markup states one, else the tag name. Never text. */
export function elementRole(target: Element | null): string {
  if (!target) return ''
  const role = target.getAttribute('role')
  if (role) return role.slice(0, 32)
  return target.tagName.toLowerCase().slice(0, 32)
}

/**
 * An id worth putting in a key.
 *
 * Framework-generated ids (`reka-content-v-3`, `headlessui-menu-4`, a uuid, a
 * bare number) differ between sessions, so a key built on one groups nothing
 * and inflates the cardinality of the very column the report groups by.
 */
export function isStableId(id: string): boolean {
  if (!id || id.length > 24) return false
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(id)) return false
  if (/\d{3,}/.test(id)) return false
  if (/^[0-9a-f]{8,}$/i.test(id)) return false
  if (/^(reka|radix|headlessui|v|el|uid|nuxt|app)[-_]?\d/i.test(id)) return false
  return true
}

/**
 * A class name worth putting in a key.
 *
 * Tailwind variants (`md:flex`, `hover:bg-white/10`) and hashed module classes
 * are noise here: they are either enormous in number or different on the next
 * build. What survives is the hand-written, semantic sort.
 */
export function isStableClass(name: string): boolean {
  if (!name || name.length > 32) return false
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(name)) return false
  if (/^[0-9a-f]{6,}$/i.test(name)) return false
  if (/\d{3,}/.test(name)) return false
  return true
}

function nthOfType(element: Element): number {
  const parent = element.parentElement
  if (!parent) return 1
  let index = 1
  for (const sibling of Array.from(parent.children)) {
    if (sibling === element) return index
    if (sibling.tagName === element.tagName) index += 1
  }
  return index
}

function segment(element: Element): string {
  let out = element.tagName.toLowerCase()
  const id = element.getAttribute('id') || ''
  if (isStableId(id)) return `${out}#${id}`
  const classes: string[] = []
  const raw = element.getAttribute('class') || ''
  for (const name of raw.split(/\s+/)) {
    if (classes.length >= 2) break
    if (isStableClass(name)) classes.push(name)
  }
  if (classes.length) out += `.${classes.join('.')}`
  const nth = nthOfType(element)
  if (nth > 1) out += `:nth-of-type(${nth})`
  return out
}

/**
 * A stable name for the thing that was clicked.
 *
 * An explicit `data-track` wins outright: it is the only key that survives a
 * redesign, and marking the controls that matter is cheap. Everything else
 * gets a short structural path — three levels, no text, no generated ids —
 * which is imperfect but groups well enough to show that nine hundred people
 * clicked the same non-button.
 */
export function elementKey(target: Element | null): string {
  if (!target) return ''
  try {
    const tracked = target.closest('[data-track]')
    const explicit = tracked?.getAttribute('data-track')?.trim()
    if (explicit) return explicit.slice(0, MAX_ELEMENT_KEY)

    const parts: string[] = []
    let node: Element | null = target
    let depth = 0
    while (node && depth < 3 && node.tagName !== 'BODY' && node.tagName !== 'HTML') {
      parts.unshift(segment(node))
      node = node.parentElement
      depth += 1
    }
    const key = parts.join('>')
    return key.length > MAX_ELEMENT_KEY ? key.slice(key.length - MAX_ELEMENT_KEY) : key
  } catch {
    return ''
  }
}

// --------------------------------------------------------------- page metrics

export interface PageBox {
  width: number
  height: number
  viewportWidth: number
  viewportHeight: number
  scrollY: number
}

/**
 * The full scrollable page, not the window.
 *
 * A heatmap keyed to the viewport puts the same click in a different place
 * depending on how far the reader had scrolled, which makes the picture a
 * picture of scrolling rather than of clicking.
 */
export function pageBox(doc: Document, win: Window): PageBox {
  const root = doc.documentElement
  const body = doc.body
  const width = Math.max(root?.scrollWidth || 0, body?.scrollWidth || 0, root?.clientWidth || 0, 1)
  const height = Math.max(root?.scrollHeight || 0, body?.scrollHeight || 0, root?.clientHeight || 0, 1)
  return {
    width,
    height,
    viewportWidth: win.innerWidth || root?.clientWidth || 0,
    viewportHeight: win.innerHeight || root?.clientHeight || 0,
    scrollY: win.scrollY || root?.scrollTop || 0
  }
}

/** A page-relative coordinate as ten-thousandths, clamped into the box. */
export function pagePercent(value: number, extent: number): number {
  if (!extent) return 0
  return clampInt((value / extent) * PCT_SCALE, 0, PCT_SCALE)
}

/** How far down the page the reader has got, on the same scale. */
export function scrollDepthPercent(box: PageBox): number {
  return pagePercent(box.scrollY + box.viewportHeight, box.height)
}

/**
 * A coarse class for the viewport.
 *
 * The session row is re-sent when this changes rather than on every resize: a
 * phone rotating matters, a window nudged four pixels wider does not.
 */
export function viewportClass(width: number): string {
  if (width < 640) return 'xs'
  if (width < 1024) return 'sm'
  if (width < 1536) return 'md'
  return 'lg'
}

// ---------------------------------------------------------------- web vitals

export type VitalMetric = 'LCP' | 'CLS' | 'INP' | 'TTFB' | 'FCP'
export type VitalRating = 'good' | 'needs-improvement' | 'poor'

/** Google's published thresholds: at or below the first is good, above the
 *  second is poor. */
export const VITAL_THRESHOLDS: Record<VitalMetric, [number, number]> = {
  LCP: [2500, 4000],
  CLS: [0.1, 0.25],
  INP: [200, 500],
  TTFB: [800, 1800],
  FCP: [1800, 3000]
}

export function vitalRating(metric: VitalMetric, value: number): VitalRating {
  const [good, poor] = VITAL_THRESHOLDS[metric]
  if (value <= good) return 'good'
  if (value <= poor) return 'needs-improvement'
  return 'poor'
}

// ------------------------------------------------------------------ sampling

/**
 * A stable number in [0, 1) for a string.
 *
 * Sampling is decided once per session rather than per event, so a sampled-in
 * session yields a whole story — every click on the page, not a scatter of one
 * in ten — and a sampled-out one costs nothing at all.
 */
export function unitHash(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return ((hash >>> 0) % 100000) / 100000
}

export function sampledIn(seed: string, rate: number): boolean {
  if (!(rate > 0)) return false
  if (rate >= 1) return true
  return unitHash(seed) < rate
}
