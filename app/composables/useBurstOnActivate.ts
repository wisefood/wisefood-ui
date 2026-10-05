import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

/**
 * A short "burst" flag for like/save toggles: true for half a second after
 * `active` turns on, but only when a click on the hosting control just
 * happened. Favourites arrive from localStorage and the API as well, and a
 * page of already-liked cards must not pop on load, so the watch alone is not
 * enough — the click is the signal that a person did this.
 *
 * `host` is any element inside the control; the nearest button-like ancestor
 * is listened to in the capture phase so the flag is set before the click
 * handler flips `active`.
 */
export function useBurstOnActivate(host: Ref<HTMLElement | null>, active: () => boolean, options: { window?: number, duration?: number } = {}) {
  // Generous on purpose: the plan save only flips after its request and a
  // session refetch, and a slow network must not swallow the feedback. The
  // window is measured from a click on this very control, so a favourite
  // that arrives on page load still never animates.
  const { window: windowMs = 5000, duration = 520 } = options
  const bursting = ref(false)

  let lastInteraction = 0
  let control: HTMLElement | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  const markInteraction = () => {
    lastInteraction = Date.now()
  }

  onMounted(() => {
    control = host.value?.closest('button, [role="button"], a') ?? host.value
    control?.addEventListener('pointerdown', markInteraction, true)
    control?.addEventListener('keydown', markInteraction, true)
  })

  onBeforeUnmount(() => {
    control?.removeEventListener('pointerdown', markInteraction, true)
    control?.removeEventListener('keydown', markInteraction, true)
    if (timer) clearTimeout(timer)
  })

  watch(active, (isActive, wasActive) => {
    if (!isActive || wasActive) return
    if (Date.now() - lastInteraction > windowMs) return
    if (timer) clearTimeout(timer)
    bursting.value = false
    // Next frame, so a burst that is still running restarts rather than
    // being swallowed by the class already being present.
    requestAnimationFrame(() => {
      bursting.value = true
      timer = setTimeout(() => {
        bursting.value = false
      }, duration)
    })
  })

  return { bursting }
}
