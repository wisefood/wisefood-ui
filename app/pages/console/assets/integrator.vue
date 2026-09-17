<!--
  Source Integrator — research sources, review what it proposes, approve.

  Two columns because there are two jobs: on the left a conversation that can
  search the web and read the catalog, on the right the proposals it has filed
  and the queue it is working from. The decision a curator makes lives on the
  right and never inside the chat, which is the point — approving is an act
  with a record, not a sentence typed at a model.
-->
<template>
  <UPage class="mx-auto max-w-[105rem] px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbs"
      class="mb-4"
    />
    <UPageHeader
      title="Source Integrator"
      description="Find candidate sources, check what their licence permits, and bring the good ones into the catalog."
      :ui="{ root: 'relative py-6 border-b-0' }"
    >
      <template #links>
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-plus"
          @click="startSession"
        >
          New conversation
        </UButton>
      </template>
    </UPageHeader>

    <!--
      `min-w-0` on both columns is load-bearing, not tidying. A grid item
      defaults to `min-width: auto`, so one unbreakable string — a pasted URL,
      a long URN in a step detail — makes the track wider than its share and
      the conversation runs underneath the cards beside it.
    -->
    <div class="grid items-start gap-6 lg:grid-cols-5">
      <!-- The conversation -->
      <UCard
        class="flex min-w-0 flex-col border border-gray-200/70 lg:col-span-3 dark:border-white/10"
        :ui="{ body: 'p-0' }"
      >
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <h2 class="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {{ activeSession?.title || 'New conversation' }}
              </h2>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Searches the web when it needs to. Every tool it runs is recorded.
              </p>
            </div>
            <USelectMenu
              v-if="sessions.length > 1"
              :model-value="sessionId"
              :items="sessionOptions"
              value-key="value"
              size="xs"
              class="w-48 shrink-0"
              aria-label="Conversation"
              @update:model-value="(id: string) => openSession(id)"
            />
          </div>
        </template>

        <div
          ref="transcript"
          class="h-[min(62vh,44rem)] min-h-[22rem] space-y-4 overflow-y-auto overflow-x-hidden p-5"
        >
          <!-- What it can do, said before it is asked. A curator meeting an
               empty box guesses at its range; saying it removes the guessing
               and sets the expectation that it proposes rather than acts. -->
          <div
            v-if="!messages.length && !thinking"
            class="py-8"
          >
            <p class="text-center text-sm text-gray-500 dark:text-gray-400">
              I look for sources and check whether we may use them.
            </p>
            <ul class="mx-auto mt-4 max-w-md space-y-2">
              <li
                v-for="item in capabilities"
                :key="item.text"
                class="flex items-start gap-2.5 text-xs text-gray-600 dark:text-gray-300"
              >
                <UIcon
                  :name="item.icon"
                  class="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400"
                />
                <span>{{ item.text }}</span>
              </li>
            </ul>
            <p class="mx-auto mt-4 max-w-md text-center text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
              I cannot approve anything or write to the catalog myself — I propose, you decide.
            </p>
            <div class="mt-5 flex flex-wrap justify-center gap-2">
              <UButton
                v-for="example in examples"
                :key="example"
                color="neutral"
                variant="soft"
                size="xs"
                @click="draft = example"
              >
                {{ example }}
              </UButton>
            </div>
          </div>

          <div
            v-for="message in visibleMessages"
            :key="message.seq"
            class="space-y-2"
            :class="message.role === 'user' ? 'flex flex-col items-end' : ''"
          >
            <!-- The work comes before the answer it produced, so the reading
                 order matches the order things happened. -->
            <ConsoleIntegratorStepTimeline
              v-if="message.role === 'assistant' && message.steps?.length"
              :steps="message.steps"
              :default-open="message.seq === latestAssistantSeq"
              class="w-full"
            />
            <div
              class="max-w-[85%] min-w-0 rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
              :class="message.role === 'user'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-100'"
            >
              <!-- `anywhere` rather than `break-words`: a pasted URL has no
                   break opportunity at all, and is exactly what people paste
                   here. -->
              <!-- The assistant cites sources by URL constantly; leaving them
                   as text means copying them out by hand to check one, which
                   is the action this whole surface is for.

                   Rendered as segments rather than with `v-html`: this text
                   comes from a model, and the safest way to put a link in it
                   is to never build markup from it at all. User messages are
                   one plain segment — nothing somebody typed becomes
                   clickable. -->
              <p class="whitespace-pre-wrap [overflow-wrap:anywhere]">
                <template
                  v-for="(part, i) in segments(message)"
                  :key="i"
                >
                  <a
                    v-if="part.href"
                    :href="part.href"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="underline decoration-current/40 underline-offset-2 hover:decoration-current"
                  >{{ part.text }}</a>
                  <!-- `v-text`, not interpolation: the linter wants a line
                       break around element content, and inside
                       `whitespace-pre-wrap` that break becomes a visible
                       space in the reply. -->
                  <span
                    v-else
                    v-text="part.text"
                  />
                </template>
              </p>
            </div>
          </div>

          <div
            v-if="thinking"
            class="space-y-2"
          >
            <ConsoleIntegratorStepTimeline
              v-if="liveSteps.length"
              :steps="liveSteps"
              running
            />
            <!-- Names what it is doing right now rather than saying it is
                 busy. "Searching the web · Bulgaria dietary guidelines" is a
                 thing somebody can judge; a spinner is a thing they wait
                 behind. -->
            <div class="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
              <UIcon
                name="i-lucide-loader-2"
                class="mt-0.5 h-4 w-4 shrink-0 animate-spin"
              />
              <span class="min-w-0">
                <span class="text-gray-700 dark:text-gray-200">{{ liveStatus }}</span>
                <span
                  v-if="liveDetail"
                  class="ml-1 truncate font-mono text-xs opacity-70"
                >{{ liveDetail }}</span>
              </span>
            </div>
          </div>
        </div>

        <template #footer>
          <form
            class="flex items-end gap-2"
            @submit.prevent="send"
          >
            <UTextarea
              v-model="draft"
              :rows="2"
              autoresize
              class="w-full"
              placeholder="Ask for sources, or paste a URL to check"
              :disabled="thinking"
              @keydown.enter.exact.prevent="send"
            />
            <UButton
              type="submit"
              color="primary"
              icon="i-lucide-send"
              class="shrink-0"
              :loading="thinking"
              :disabled="!draft.trim()"
            >
              Send
            </UButton>
          </form>
          <p
            v-if="lastRun"
            class="mt-2 text-[11px] text-gray-400 dark:text-gray-500"
          >
            {{ lastRun }}
          </p>
        </template>
      </UCard>

      <!--
        One panel, three tables, switched by a tab — not three cards stacked
        down the page. Stacking meant the queue and the activity log were
        below the fold on every screen, each with its own header eating
        vertical space the tables needed, and each collapsing its own
        subtitle. A tab costs one click and gives every table the full height
        of the column.
      -->
      <UCard
        class="min-w-0 border border-gray-200/70 lg:col-span-2 dark:border-white/10"
        :ui="{ body: 'p-0', header: 'px-4 py-3 sm:px-5' }"
      >
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <div class="flex gap-1">
              <button
                v-for="tab in TABS"
                :key="tab.value"
                type="button"
                class="rounded-lg px-2.5 py-1.5 text-xs font-medium transition"
                :class="panel === tab.value
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
                  : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'"
                @click="panel = tab.value"
              >
                {{ tab.label }}
                <span
                  v-if="tab.count"
                  class="ml-1 tabular-nums opacity-60"
                >{{ tab.count }}</span>
              </button>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-lucide-refresh-cw"
              class="cursor-pointer"
              :loading="loadingProposals"
              @click="refreshPanel"
            />
          </div>
        </template>

        <!-- Proposals: a table, because a curator compares them. Cards made
             every row as tall as its longest field and put the decision below
             the fold. -->
        <div
          v-show="panel === 'proposals'"
          class="max-h-[min(62vh,44rem)] overflow-y-auto"
        >
          <p
            v-if="!proposals.length"
            class="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500"
          >
            Nothing proposed yet.
          </p>
          <div
            v-else
            class="space-y-3 p-4"
          >
            <ConsoleIntegratorProposalCard
              v-for="proposal in proposals"
              :key="proposal.id"
              :proposal="proposal"
              :busy="busyProposal === proposal.id ? busyAction : null"
              :reorderable="proposals.length > 1"
              @approve="confirmApprove"
              @reject="rejectProposal"
              @move="moveProposal"
              @integrated="loadProposals"
            />
          </div>
        </div>

        <!-- Queue: a table. Country and language are columns, so the eye can
             run down them instead of reading each row as a sentence. -->
        <div
          v-show="panel === 'queue'"
          class="max-h-[min(62vh,44rem)] overflow-y-auto"
        >
          <div class="flex flex-wrap gap-1.5 border-b border-gray-100 px-4 py-3 dark:border-zinc-800">
            <UButton
              v-for="option in kindFilters"
              :key="option.value"
              size="xs"
              class="cursor-pointer"
              :color="backlogKind === option.value ? 'primary' : 'neutral'"
              :variant="backlogKind === option.value ? 'soft' : 'ghost'"
              @click="setBacklogKind(option.value)"
            >
              {{ option.label }}
            </UButton>
          </div>
          <table class="w-full text-left text-xs">
            <thead class="sticky top-0 bg-white/95 backdrop-blur dark:bg-zinc-900/95">
              <tr class="border-b border-gray-100 text-[10px] uppercase tracking-wide text-gray-400 dark:border-zinc-800 dark:text-gray-500">
                <th class="px-4 py-2 font-medium">
                  Source
                </th>
                <th class="px-2 py-2 font-medium">
                  Country
                </th>
                <th class="px-2 py-2 font-medium">
                  Lang
                </th>
                <th class="px-4 py-2" />
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50 dark:divide-zinc-800/70">
              <tr
                v-for="item in backlog"
                :key="item.id"
                class="transition hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <td class="max-w-0 px-4 py-2">
                  <span
                    class="block truncate font-medium text-gray-900 dark:text-white"
                    :title="item.title"
                  >{{ item.title }}</span>
                </td>
                <td class="whitespace-nowrap px-2 py-2 text-gray-500 dark:text-gray-400">
                  {{ item.country || '—' }}
                </td>
                <td class="whitespace-nowrap px-2 py-2 text-gray-500 dark:text-gray-400">
                  {{ item.language || '—' }}
                </td>
                <td class="px-4 py-2 text-right">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    icon="i-lucide-search"
                    class="cursor-pointer"
                    :title="`Ask about ${item.title}`"
                    @click="askAbout(item)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <p
            v-if="!backlog.length"
            class="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500"
          >
            Nothing in the queue.
          </p>
        </div>

        <div v-show="panel === 'activity'">
          <ConsoleIntegratorAuditTrail
            :session-id="sessionId"
            embedded
          />
        </div>
      </UCard>
    </div>

    <!-- Approving an undetermined licence needs a reason, and the server
         refuses without one. Asking here rather than showing that refusal. -->
    <UModal
      v-model:open="approving"
      title="Approve this source?"
      :description="pendingProposal?.title"
    >
      <template #body>
        <div class="space-y-3">
          <UAlert
            v-if="needsReason"
            color="warning"
            variant="soft"
            icon="i-lucide-alert-triangle"
            title="The licence could not be established"
            description="Approving anyway needs a reason. It is stored with your approval and is what makes the decision answerable later."
          />
          <UFormField
            v-if="needsReason"
            label="Why is this source usable?"
            required
          >
            <UTextarea
              v-model="overrideReason"
              :rows="3"
              class="w-full"
              placeholder="e.g. the ministry confirmed reuse by email on 2026-09-01"
            />
          </UFormField>
          <p
            v-else
            class="text-sm text-gray-600 dark:text-gray-300"
          >
            Your approval is recorded with your name and the licence evidence behind it.
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="approving = false"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide-check"
            :loading="busyAction === 'approve'"
            :disabled="needsReason && !overrideReason.trim()"
            @click="approveProposal"
          >
            Approve
          </UButton>
        </div>
      </template>
    </UModal>
  </UPage>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import integratorApi, {
  failureText, type BacklogItem, type ChatTurn, type IntegratorMessage,
  type IntegratorSession,
  type IntegratorStep, type Proposal, type SourceKind
} from '~/services/integratorApi'
import { assetBreadcrumb, consoleAssetSections } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })
useHead({ title: 'Source Integrator · Console' })

const toast = useToast()

const breadcrumbs = assetBreadcrumb(consoleAssetSections.integrator)

/* Said in the empty state, and true of the tools the agent is actually given
   — this list and the tool registry have to stay in step. */
const capabilities = [
  { icon: 'i-lucide-globe', text: 'Search the web and open pages and PDFs' },
  { icon: 'i-lucide-library', text: 'Check what the catalog already holds, and where the gaps are' },
  { icon: 'i-lucide-scale', text: 'Work out a licence from the source\'s own words, or from Unpaywall for a DOI' },
  { icon: 'i-lucide-clipboard-list', text: 'File a proposal for you to review, with its evidence attached' }
]

const examples = [
  'What dietary guidance exists for Bulgaria?',
  'Find open-licensed food composition tables for Greece',
  'Check the licence on who.int/publications/i/item/9789240073876'
]

const kindFilters: Array<{ label: string, value: SourceKind | '' }> = [
  { label: 'All', value: '' },
  { label: 'Guides', value: 'guide' },
  { label: 'Articles', value: 'article' },
  { label: 'Tables', value: 'fctable' },
  { label: 'Textbooks', value: 'textbook' },
  { label: 'Recipes', value: 'rcollection' }
]

const sessions = ref<IntegratorSession[]>([])
const sessionId = ref('')
const messages = ref<IntegratorMessage[]>([])
/* Steps from the turn in flight. The timeline for a finished turn rides
   its assistant message; this is only for while it is running. */
const liveSteps = ref<IntegratorStep[]>([])
const draft = ref('')
const thinking = ref(false)
const lastRun = ref('')
const transcript = ref<HTMLElement | null>(null)

const proposals = ref<Proposal[]>([])
const loadingProposals = ref(false)
const panel = ref<'proposals' | 'queue' | 'activity'>('proposals')

const TABS = computed(() => [
  { value: 'proposals' as const, label: 'Proposals', count: proposals.value.length },
  { value: 'queue' as const, label: 'Queue', count: backlogTotal.value },
  { value: 'activity' as const, label: 'Activity', count: 0 }
])

function refreshPanel() {
  if (panel.value === 'queue') return loadBacklog()
  return loadProposals()
}
const backlog = ref<BacklogItem[]>([])
const backlogTotal = ref(0)
const backlogKind = ref<SourceKind | ''>('')

const approving = ref(false)
const pendingProposal = ref<Proposal | null>(null)
const overrideReason = ref('')
const busyProposal = ref<string | null>(null)
const busyAction = ref<'approve' | 'reject' | null>(null)

const activeSession = computed(() => sessions.value.find(s => s.id === sessionId.value))
const sessionOptions = computed(() =>
  sessions.value.map(s => ({ label: s.title || 'Untitled', value: s.id })))

/** Tool turns are shown as the trail of badges, not as chat bubbles. */
const visibleMessages = computed(() =>
  messages.value.filter(m => m.role === 'user' || (m.role === 'assistant' && m.content)))

/*
 * The newest assistant turn shows its work expanded. Older ones collapse to a
 * summary — what it did most recently is what a curator is judging, and
 * making them click to see it is making transparency opt-in.
 */
const latestAssistantSeq = computed(() => {
  const withSteps = visibleMessages.value
    .filter(m => m.role === 'assistant' && m.steps?.length)
  return withSteps.length ? withSteps[withSteps.length - 1]!.seq : -1
})

/** The step in flight, for the line under the transcript. */
const liveStatus = computed(() => {
  const running = [...liveSteps.value].reverse().find(s => s.status === 'running')
  if (running) return running.title
  const last = liveSteps.value.at(-1)
  return last ? last.title : 'Working out what to look for'
})

const liveDetail = computed(() => {
  const running = [...liveSteps.value].reverse().find(s => s.status === 'running')
  return running?.detail ?? ''
})

/**
 * Split a reply into plain text and links.
 *
 * No HTML is built from model output — the template renders each segment as
 * text or as an anchor, so there is nothing to escape and nothing to get
 * wrong. Only assistant messages are scanned.
 */
function segments(message: IntegratorMessage): Array<{ text: string, href?: string }> {
  const text = message.content ?? ''
  if (message.role !== 'assistant') return [{ text }]

  const out: Array<{ text: string, href?: string }> = []
  const pattern = /https?:\/\/[^\s<]+/g
  let cursor = 0
  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0
    if (at > cursor) out.push({ text: text.slice(cursor, at) })
    // Trailing punctuation belongs to the sentence, not the address.
    const raw = match[0]
    const href = raw.replace(/[.,;:)\]]+$/, '')
    out.push({ text: href, href })
    if (href.length < raw.length) out.push({ text: raw.slice(href.length) })
    cursor = at + raw.length
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor) })
  return out.length ? out : [{ text }]
}

const needsReason = computed(() => !pendingProposal.value?.licence)

async function scrollDown() {
  await nextTick()
  if (transcript.value) transcript.value.scrollTop = transcript.value.scrollHeight
}

async function startSession() {
  try {
    const session = await integratorApi.createSession()
    sessions.value = [session, ...sessions.value]
    sessionId.value = session.id
    messages.value = []
    liveSteps.value = []
    lastRun.value = ''
  } catch (error) {
    toast.add({ title: failureText(error, 'Could not start a conversation'), color: 'error' })
  }
}

async function openSession(id: string) {
  sessionId.value = id
  messages.value = await integratorApi.history(id)
  liveSteps.value = []
  await loadProposals()
  await scrollDown()
}

async function send() {
  const text = draft.value.trim()
  if (!text || thinking.value) return
  if (!sessionId.value) await startSession()
  if (!sessionId.value) return

  draft.value = ''
  // Shown immediately so the question does not vanish while the turn runs;
  // replaced by the server's copy when it lands.
  messages.value = [...messages.value, {
    seq: (messages.value.at(-1)?.seq ?? -1) + 1,
    role: 'user', content: text, tool_name: null, steps: null, created_at: null
  }]
  thinking.value = true
  await scrollDown()

  try {
    /*
     * Streamed, so the timeline fills as the assistant works. A turn can run
     * for minutes across a web search and several fetches; waiting for the
     * whole thing before showing anything is what made it look hung, and is
     * what every proxy in between eventually decided was a dead connection.
     */
    /* A holder rather than two `let`s: TypeScript's control-flow analysis
       assumes a callback never ran, so assigning to a local from inside one
       narrows it to `never` at every later use. */
    const outcome: { turn: ChatTurn | null, failure: string } = {
      turn: null, failure: ''
    }
    await integratorApi.chatStream(sessionId.value, text, {
      onStep: (step) => {
        // A step arrives twice: once running, once finished. Replace by id so
        // the row updates in place rather than the list growing duplicates.
        const at = liveSteps.value.findIndex(s => s.id === step.id)
        liveSteps.value = at === -1
          ? [...liveSteps.value, step]
          : liveSteps.value.map((s, i) => (i === at ? step : s))
        void scrollDown()
      },
      onDone: (finished) => { outcome.turn = finished },
      onError: (detail) => { outcome.failure = detail }
    })
    if (outcome.failure) throw new Error(outcome.failure)
    if (!outcome.turn) throw new Error('The assistant stopped without answering.')
    const turn = outcome.turn

    messages.value = await integratorApi.history(sessionId.value)
    liveSteps.value = []
    lastRun.value = turn.stop_reason === 'completed'
      ? `${turn.steps} step${turn.steps === 1 ? '' : 's'} · ${turn.tokens.toLocaleString()} tokens · ${turn.model}`
      : `Stopped: ${turn.stop_reason}`
    await loadProposals()
    if (!sessions.value.find(s => s.id === sessionId.value)?.title) {
      sessions.value = await integratorApi.listSessions()
    }
  } catch (error) {
    toast.add({ title: failureText(error, 'The assistant could not answer'), color: 'error' })
  } finally {
    thinking.value = false
    await scrollDown()
  }
}

/** Put a queued source into the conversation rather than a form. */
function askAbout(item: BacklogItem) {
  draft.value = `Look into "${item.title}"${item.country ? ` (${item.country})` : ''}`
    + `${item.url ? ` — ${item.url}` : ''}. Check the licence and whether we already have it.`
}

async function loadProposals() {
  loadingProposals.value = true
  proposals.value = await integratorApi.listProposals(
    sessionId.value ? { sessionId: sessionId.value } : {})
  loadingProposals.value = false
}

async function loadBacklog() {
  const page = await integratorApi.backlog({
    kind: backlogKind.value || undefined, status: 'pending', limit: 20
  })
  backlog.value = page.items
  backlogTotal.value = page.total
}

async function setBacklogKind(kind: SourceKind | '') {
  backlogKind.value = kind
  await loadBacklog()
}

function confirmApprove(proposal: Proposal) {
  pendingProposal.value = proposal
  overrideReason.value = ''
  approving.value = true
}

async function approveProposal() {
  const proposal = pendingProposal.value
  if (!proposal) return
  busyProposal.value = proposal.id
  busyAction.value = 'approve'
  try {
    await integratorApi.approve(proposal.id, overrideReason.value.trim() || undefined)
    approving.value = false
    await loadProposals()
    toast.add({ title: 'Approved', icon: 'i-lucide-check', color: 'success' })
  } catch (error) {
    toast.add({ title: failureText(error, 'Could not approve that'), color: 'error' })
  } finally {
    busyProposal.value = null
    busyAction.value = null
  }
}

/**
 * Move a proposal up or down, and persist the whole order.
 *
 * The list is sent rather than the one move, because `expert_rank` is a
 * position and positions are only meaningful together — sending "this one is
 * now third" leaves whatever used to be third also claiming it.
 */
async function moveProposal({ proposal, direction }: { proposal: Proposal, direction: -1 | 1 }) {
  const order = [...proposals.value]
  const from = order.findIndex(p => p.id === proposal.id)
  const to = from + direction
  if (from < 0 || to < 0 || to >= order.length) return

  const [moved] = order.splice(from, 1)
  order.splice(to, 0, moved!)
  proposals.value = order // optimistic: the arrows should feel immediate

  try {
    await integratorApi.rerank(order.map(p => p.id))
  } catch (error) {
    await loadProposals() // put it back the way the server has it
    toast.add({ title: failureText(error, 'Could not save that order'), color: 'error' })
  }
}

async function rejectProposal(proposal: Proposal) {
  busyProposal.value = proposal.id
  busyAction.value = 'reject'
  try {
    await integratorApi.reject(proposal.id)
    await loadProposals()
  } catch (error) {
    toast.add({ title: failureText(error, 'Could not reject that'), color: 'error' })
  } finally {
    busyProposal.value = null
    busyAction.value = null
  }
}

onMounted(async () => {
  sessions.value = await integratorApi.listSessions()
  if (sessions.value.length) {
    await openSession(sessions.value[0]!.id)
  } else {
    await loadProposals()
  }
  await loadBacklog()
})
</script>
