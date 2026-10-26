import { ref, readonly } from 'vue'
import { addFloatingBlocksChangeListener, getCurrentFloatingBlocks, startWorkflow } from '@flows/js'

/**
 * Starting a Flows walkthrough on request, from the help panel.
 *
 * Flows is only initialised when an org id is configured and someone is
 * signed in (`02.flows.client.ts`), so `ready` gates every "Show me" button.
 *
 * `startWorkflow` resolves the same way whether or not anything started: an
 * unpublished workflow, a block key that does not exist yet, or a user the
 * start block's targeting excludes all look like success. A button that does
 * nothing is worse than no button, so `start` waits briefly for a new
 * floating block to appear and reports whether one did; the panel says so
 * when it did not.
 */

/** Long enough for the SDK's round trip to the proxy on a slow connection. */
const APPEAR_TIMEOUT_MS = 3500

const ready = ref(false)

/** Called by the Flows plugin once `init()` has run. */
export function markWalkthroughsReady(): void {
  ready.value = true
}

export function useWalkthroughs() {
  function start(blockKey: string): Promise<boolean> {
    if (!ready.value) return Promise.resolve(false)

    return new Promise((resolve) => {
      let settled = false
      let timer: ReturnType<typeof setTimeout> | null = null
      let dispose: (() => void) | null = null

      const before = new Set(getCurrentFloatingBlocks().map(block => block.id))
      const appeared = (blocks: Array<{ id: string }>) => blocks.some(block => !before.has(block.id))

      const finish = (started: boolean) => {
        if (settled) return
        settled = true
        if (timer) clearTimeout(timer)
        dispose?.()
        resolve(started)
      }

      dispose = addFloatingBlocksChangeListener((blocks) => {
        if (appeared(blocks)) finish(true)
      })
      timer = setTimeout(() => finish(appeared(getCurrentFloatingBlocks())), APPEAR_TIMEOUT_MS)

      startWorkflow(blockKey).catch(() => finish(false))
    })
  }

  return { ready: readonly(ready), start }
}
