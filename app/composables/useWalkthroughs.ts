import { ref, readonly } from 'vue'
import {
  addFloatingBlocksChangeListener,
  fetchWorkflows,
  getCurrentFloatingBlocks,
  resetWorkflowProgress,
  startWorkflow
} from '@flows/js'
import type { ActiveBlock } from '@flows/js'

/**
 * Starting a Flows walkthrough on request, from the help panel.
 *
 * Flows is only initialised when an org id is configured and someone other
 * than a guest is signed in (`02.flows.client.ts`), so `ready` gates every
 * "Show me" button.
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

/**
 * Flows lets nobody re-enter a workflow they have not left, so a Help tour
 * left halfway (walked off its page, the tab closed, a wait step for
 * something that never happened) made its "Show me" do nothing until Flows
 * gave up on the session, and the user could not tell why. Help tours are
 * the workflows that run every time; the automatic ones run once and are left
 * alone, so resetting them never brings them back. Leaving every unfinished
 * Help tour, not just the requested one, also closes one still on screen:
 * the tour asked for last is the one that shows. Returns the workflows left.
 */
async function leaveUnfinishedHelpTours(): Promise<Set<string>> {
  try {
    const { workflows } = await fetchWorkflows()
    const unfinished = workflows
      .filter(workflow => workflow.frequency === 'every-time' && workflow.user_state === 'in-progress')
      .map(workflow => workflow.id)
    await Promise.all(unfinished.map(id => resetWorkflowProgress(id)))
    return new Set(unfinished)
  } catch {
    // Starting may still work; the appear check below reports if it did not.
    return new Set()
  }
}

export function useWalkthroughs() {
  async function start(blockKey: string): Promise<boolean> {
    if (!ready.value) return false

    const left = await leaveUnfinishedHelpTours()

    return new Promise((resolve) => {
      let settled = false
      let timer: ReturnType<typeof setTimeout> | null = null
      let dispose: (() => void) | null = null

      // Steps of a tour just left can stay on screen until Flows confirms.
      // They are not news, but once gone they count again, so the same tour
      // starting over from its first step is seen.
      const current = getCurrentFloatingBlocks()
      const isLeft = (block: ActiveBlock) => left.has(block.props.__flows.workflowId)
      const before = new Set(current.filter(block => !isLeft(block)).map(block => block.id))
      const leaving = new Set(current.filter(isLeft).map(block => block.id))
      const appeared = (blocks: ActiveBlock[]) => {
        const onScreen = new Set(blocks.map(block => block.id))
        for (const id of leaving) if (!onScreen.has(id)) leaving.delete(id)
        return blocks.some(block => !before.has(block.id) && !leaving.has(block.id))
      }

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
