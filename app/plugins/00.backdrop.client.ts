import { defineNuxtPlugin } from '#imports'
import { backdropViewportHeight, isClickmapBackdrop } from '~/utils/clickmapBackdrop'

/**
 * Lay the page out as a visitor saw it, for the click map drawn over it.
 *
 * First of the plugins, so the page is marked before anything renders. The
 * console stretches this frame to the full height of the page so the whole of
 * it can sit under the map — and that would stretch everything sized to the
 * window with it: Nuxt UI's main area is `calc(100vh - header)` tall, so in a
 * three-thousand-pixel frame the footer drops three thousand pixels and every
 * pin on it lands below the page. Listing the classes that do this missed the
 * one that mattered, so every viewport-height length in the page's own
 * stylesheets is rewritten instead, to the height of the window the clicks
 * were made in.
 *
 * Animations are stopped for the same reason: the map is a picture of the page
 * at rest, and a section still sliding in — or a card waiting at zero opacity
 * for an observer that never fires in a frame — is not where anybody clicked.
 */
const BACKDROP_CSS = `
html.wf-backdrop *, html.wf-backdrop *::before, html.wf-backdrop *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  transition: none !important;
  scroll-behavior: auto !important;
}
html.wf-backdrop .scroll-fade-in { opacity: 1 !important; transform: none !important; }
`

/** `100vh`, `62dvh`, `.5svh` — any viewport-height length. */
const VIEWPORT_HEIGHT = /(-?(?:\d+\.?\d*|\.\d+))[dsl]?vh\b/g

const pinned = new WeakSet<CSSStyleSheet>()

function pinRules(rules: CSSRuleList, px: number): void {
  for (const rule of Array.from(rules)) {
    // @media, @supports, @layer and nested rules all hold rules of their own.
    const nested = (rule as CSSGroupingRule).cssRules
    if (nested?.length) pinRules(nested, px)
    const style = (rule as CSSStyleRule).style
    if (!style) continue
    for (let i = 0; i < style.length; i += 1) {
      const property = style.item(i)
      const value = style.getPropertyValue(property)
      if (!value.includes('vh')) continue
      const next = value.replace(VIEWPORT_HEIGHT, (_, amount: string) => `${(Number(amount) * px) / 100}px`)
      if (next !== value) style.setProperty(property, next, style.getPropertyPriority(property))
    }
  }
}

function pinSheet(sheet: CSSStyleSheet | null, px: number): void {
  if (!sheet || pinned.has(sheet)) return
  try {
    pinRules(sheet.cssRules, px)
    pinned.add(sheet)
  } catch {
    // A cross-origin sheet (the web fonts) cannot be read, and holds no
    // layout; one still loading is retried when it finishes.
  }
}

function pinNode(node: Node, px: number): void {
  if (node instanceof HTMLStyleElement) {
    pinSheet(node.sheet, px)
  } else if (node instanceof HTMLLinkElement && node.rel === 'stylesheet') {
    if (node.sheet) pinSheet(node.sheet, px)
    node.addEventListener('load', () => pinSheet(node.sheet, px), { once: true })
  }
}

export default defineNuxtPlugin(() => {
  if (!isClickmapBackdrop()) return
  try {
    const px = backdropViewportHeight() ?? window.innerHeight
    document.documentElement.classList.add('wf-backdrop')
    const style = document.createElement('style')
    style.setAttribute('data-wf-backdrop', '')
    style.textContent = BACKDROP_CSS
    document.head.appendChild(style)

    for (const sheet of Array.from(document.styleSheets)) pinSheet(sheet, px)
    document.querySelectorAll('link[rel="stylesheet"]').forEach(node => pinNode(node, px))
    // A page's own chunk of CSS arrives after the app has started.
    new MutationObserver((records) => {
      for (const record of records) record.addedNodes.forEach(node => pinNode(node, px))
    }).observe(document.head, { childList: true })
  } catch {
    // An unpinned backdrop still lays out; the map is merely less exact.
  }
})
