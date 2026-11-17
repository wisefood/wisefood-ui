import { fetchWorkflows, resetWorkflowProgress } from '@flows/js'
import type { Workflow } from '@flows/js'

/**
 * Tours that no longer run, and the people still inside one.
 *
 * Help's "Show me" walkthroughs were retired on 2026-11-17; the help videos
 * and written steps do that job. The automatic "Let's finish your food
 * profile" tour was switched off the same day (02.flows.client.ts no longer
 * sends the properties that start it). Both kinds stay in progress in Flows
 * for anyone who left one halfway, and a tour in progress comes back by
 * itself: its step reappears whenever its page is open again or what it was
 * waiting for happens, long after the person walked away. The profile tour
 * was the worst of them: its second step showed on every page but My Profile,
 * visit after visit.
 *
 * So on every load, take the user out of each of them. Resetting puts a
 * workflow back to not-started, and nothing starts these again: Help no longer
 * calls startWorkflow, and the profile tour's targeting now matches nobody.
 *
 * The welcome tour (workflow ea9ea99f, frequency once) is not touched.
 */

/** Help tours were the only workflows with frequency "every time". */
const isHelpTour = (workflow: Workflow) => workflow.frequency === 'every-time'

/**
 * "Nutrition preferences setup" (flows.sh). The SDK gives workflows no name,
 * only the UUID, and this is the first block of it.
 */
const PROFILE_TOUR_ID_PREFIX = 'ce0988c9'

/** The workflows a user should be taken out of. */
export function retiredInProgress(workflows: readonly Workflow[]): string[] {
  return workflows
    .filter(workflow => workflow.user_state === 'in-progress')
    .filter(workflow => isHelpTour(workflow) || workflow.id.startsWith(PROFILE_TOUR_ID_PREFIX))
    .map(workflow => workflow.id)
}

/** Best effort: a failure leaves things as they were, which is no worse. */
export async function leaveRetiredTours(): Promise<void> {
  try {
    const { workflows } = await fetchWorkflows()
    await Promise.all(retiredInProgress(workflows).map(id => resetWorkflowProgress(id)))
  } catch (err) {
    console.warn('[Flows] Could not leave retired tours:', err)
  }
}
