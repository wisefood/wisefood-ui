import { createSharedComposable } from '@vueuse/core'

/**
 * Whether a dialog is open anywhere on the page.
 *
 * The floating dock (accessibility, feedback, bug report) hides while one is,
 * because a fixed button with a z-index paints over every modal's footer and
 * every toast's action no matter where it sits in the DOM. The dock's own
 * panels are dialogs too; anything marked `data-wf-dock`, or containing such a
 * mark, does not count.
 *
 * Reka unmounts dialog content when it closes, so watching for `role="dialog"`
 * elements coming and going is enough; `data-state` is watched as well so the
 * dock reappears as the close animation starts rather than when it ends.
 */
export const useOverlayOpen = createSharedComposable(() => {
  const open = ref(false)

  if (import.meta.client) {
    let frame = 0

    const measure = () => {
      frame = 0
      const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"], [role="alertdialog"]')
      open.value = Array.from(dialogs).some(el =>
        el.dataset.state !== 'closed'
        && !el.closest('[data-wf-dock]')
        && !el.querySelector('[data-wf-dock]')
      )
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    const observer = new MutationObserver(schedule)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['role', 'data-state']
    })
    schedule()
  }

  return open
})
