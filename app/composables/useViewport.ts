import { breakpointsTailwind, createSharedComposable, useBreakpoints, useMediaQuery } from '@vueuse/core'

/**
 * The one place the app asks how wide the screen is.
 *
 * `lg` (1024px) is the single-pane threshold. It is where Nuxt UI's header
 * trades its links for a hamburger, so every layout that splits into panes
 * collapses at the same width the navigation does. `sm` (640px) is the phone
 * threshold, for things only a narrow portrait screen needs.
 *
 * Prefer Tailwind's `lg:` / `sm:` / `pointer-coarse:` prefixes for anything
 * CSS can decide. Reach for this when the *structure* changes: a pane that
 * becomes a drawer, a table that becomes a list, a default that flips.
 *
 * Every route that matters renders client-only (`ssr: false`), but the SSR
 * width is a desktop value anyway so a server render never paints the phone
 * layout on a desktop.
 */
export const useViewport = createSharedComposable(() => {
  const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: 1280 })

  /** Below `sm`: a phone in portrait. */
  const isPhone = breakpoints.smaller('sm')
  /** Below `lg`: phones and portrait tablets. One pane at a time. */
  const isCompact = breakpoints.smaller('lg')
  /** `lg` and up. */
  const isDesktop = breakpoints.greaterOrEqual('lg')
  /** The primary input can hover. Hover-revealed controls are fine here. */
  const hasHover = useMediaQuery('(hover: hover)')
  /** The primary input is a finger. Targets need 44px. */
  const isCoarsePointer = useMediaQuery('(pointer: coarse)')

  return { breakpoints, isPhone, isCompact, isDesktop, hasHover, isCoarsePointer }
})
