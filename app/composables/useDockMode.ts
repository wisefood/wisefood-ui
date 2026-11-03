import type { RouteMeta } from 'vue-router'

type DockMode = NonNullable<RouteMeta['dock']>

/**
 * The floating dock's mode for pages where it depends on the page's own
 * state rather than a fixed `definePageMeta({ dock })`.
 *
 * The FoodScholar and FoodChat start screens keep the composer near the top
 * of the page and only pin it to the bottom edge once a conversation is on
 * screen, so a fixed `raised` lifted the buttons over empty space on the
 * start screen. Keyed by path: a page that unmounts after the next one has
 * mounted cannot undo the next page's choice.
 */
export function useDockModes() {
  return useState<Record<string, DockMode>>('wf-dock-modes', () => ({}))
}

export function usePageDockMode(mode: () => DockMode) {
  const path = useRoute().path
  const modes = useDockModes()
  // Not before mount: the getter usually reads page state declared further
  // down the same setup, and running it during setup throws on those
  // not-yet-initialised bindings. A watcher made in onMounted still stops
  // when the page unmounts.
  onMounted(() => {
    watchEffect(() => {
      const next = mode()
      if (modes.value[path] !== next) modes.value = { ...modes.value, [path]: next }
    })
  })
}
