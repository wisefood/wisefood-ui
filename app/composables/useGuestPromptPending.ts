import { createSharedComposable } from '@vueuse/core'

/**
 * Whether the guest preferences wizard is about to open, or is open.
 *
 * The consent bar holds back while this is true: the wizard is offered
 * first, the bar afterwards. Two things asking at once at the foot of a phone
 * is a wall, and of the two the wizard is the one that makes the visit worth
 * anything — the bar can wait a minute. Shared, because the prompt lives on
 * the dashboard and the bar in the app shell; the prompt clears it on its
 * way out so the bar is never held back by a page that is gone.
 */
export const useGuestPromptPending = createSharedComposable(() => ref(false))
