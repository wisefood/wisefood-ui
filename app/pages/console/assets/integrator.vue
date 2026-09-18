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
            <p class="mx-auto mt-4 max-w-md text-center text-[0.6875rem] leading-relaxed text-gray-400 dark:text-gray-500">
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
              class="min-w-0 rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
              :class="message.role === 'user'
                ? 'max-w-[85%] bg-brand-600 text-white'
                : 'w-full bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-100'"
            >
              <!-- The assistant writes markdown — tables of candidate
                   sources, headings, links — so it is rendered as markdown.
                   Showing it raw showed a curator pipes and asterisks where a
                   table of eight sources was meant.

                   Sanitised before it gets here: the text comes from a model,
                   and `renderMarkdown` runs it through DOMPurify, which is the
                   same treatment FoodChat gives the same class of content.
                   What somebody typed is never rendered as markup — only
                   assistant turns take this branch. -->
              <div
                v-if="message.role === 'assistant'"
                class="integrator-prose [overflow-wrap:anywhere]"
                v-html="renderMarkdown(message.content || '')"
              />
              <!-- `anywhere` rather than `break-words`: a pasted URL has no
                   break opportunity at all, and is exactly what people paste
                   here. -->
              <p
                v-else
                class="whitespace-pre-wrap [overflow-wrap:anywhere]"
                v-text="message.content"
              />
            </div>

            <!--
              What this turn actually filed, from the calls rather than the
              reply. The assistant has claimed eight filings for five calls
              and invented the ids when asked; this is the line that cannot.
            -->
            <div
              v-if="filedIn(message.steps).length"
              class="flex w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-green-50/70 px-3 py-2 text-xs text-green-800 dark:bg-green-500/10 dark:text-green-300"
            >
              <UIcon
                name="i-lucide-check"
                class="h-3.5 w-3.5 shrink-0"
              />
              <span class="font-medium">
                {{ filedIn(message.steps).length }} filed this turn:
              </span>
              <button
                v-for="filed in filedIn(message.steps)"
                :key="filed.proposal_id"
                type="button"
                class="cursor-pointer truncate underline decoration-current/40 underline-offset-2 hover:decoration-current"
                :title="filed.title"
                @click="openFiled(filed.proposal_id)"
              >
                {{ filed.title || filed.proposal_id }}
              </button>
            </div>

            <!-- Candidates it is offering rather than filing. Placed after
                 the reply, which is where the decision naturally falls. -->
            <ConsoleIntegratorSuggestionCard
              v-for="offer in suggestionsIn(message)"
              :key="offer.key"
              :suggestion="offer.suggestion"
              :session-id="sessionId"
              class="w-full"
              @filed="loadProposals"
            />
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
            <!-- The answer as it is written. Plain text while it streams —
                 links are resolved once the turn lands, because a URL being
                 typed out is not yet a URL. -->
            <div
              v-if="liveReply"
              class="max-w-[85%] min-w-0 rounded-2xl bg-gray-100 px-4 py-2.5 text-sm leading-relaxed text-gray-800 dark:bg-zinc-800 dark:text-gray-100"
            >
              <p
                class="whitespace-pre-wrap [overflow-wrap:anywhere]"
                v-text="liveReply"
              />
            </div>
            <!-- Names what it is doing right now rather than saying it is
                 busy. "Searching the web · Bulgaria dietary guidelines" is a
                 thing somebody can judge; a spinner is a thing they wait
                 behind. -->
            <div
              v-if="!liveReply"
              class="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400"
            >
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
            class="mt-2 text-[0.6875rem] text-gray-400 dark:text-gray-500"
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

        <div
          v-show="panel === 'proposals'"
          class="max-h-[min(62vh,44rem)] overflow-y-auto"
        >
          <ConsoleIntegratorProposalTable
            :proposals="proposals"
            :selected-id="openProposal?.id ?? null"
            :busy-id="busyProposal"
            :busy-action="busyAction"
            @open="showProposal"
            @approve="confirmApprove"
            @reject="rejectProposal"
          />
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
              <tr class="border-b border-gray-100 text-[0.625rem] uppercase tracking-wide text-gray-400 dark:border-zinc-800 dark:text-gray-500">
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

    <!--
      The detail behind a row. A drawer rather than a page: what a curator is
      reading here is the evidence for a decision they make in the same
      motion, and a route change would lose the conversation that produced it.
    -->
    <USlideover
      v-model:open="detailOpen"
      :title="openProposal?.title || 'Proposal'"
      :description="openProposal ? KIND_LABELS[openProposal.kind] : ''"
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <ConsoleIntegratorProposalCard
          v-if="openProposal"
          :proposal="openProposal"
          :busy="busyProposal === openProposal.id ? busyAction : null"
          :reorderable="proposals.length > 1"
          @approve="confirmApprove"
          @reject="rejectProposal"
          @move="moveProposal"
          @integrated="loadProposals"
        />
      </template>
    </USlideover>

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
  failureText, filedIn, stepSuggestion, type BacklogItem, type ChatTurn,
  type IntegratorMessage, type IntegratorSession,
  type IntegratorStep, type Proposal, type SourceKind, type SourceSuggestion
} from '~/services/integratorApi'
import { assetBreadcrumb, consoleAssetSections } from '~/utils/consoleBreadcrumbs'
import { KIND_LABELS, stageOf } from '~/utils/integratorSources'
import { renderMarkdown } from '~/utils/markdown'

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
/* The reply as it is being written, replaced by the server's copy when the
   turn lands. */
const liveReply = ref('')
const draft = ref('')
const thinking = ref(false)
const lastRun = ref('')
const transcript = ref<HTMLElement | null>(null)

const proposals = ref<Proposal[]>([])
const loadingProposals = ref(false)
const panel = ref<'proposals' | 'queue' | 'activity'>('proposals')

/*
 * The proposal count is how many need a decision, not how many rows exist.
 * A badge that keeps counting things already dealt with stops meaning
 * anything, and this one is the reason to look at the tab at all.
 */
const awaitingReview = computed(() =>
  proposals.value.filter(p => stageOf(p) === 'review').length)

const TABS = computed(() => [
  { value: 'proposals' as const, label: 'Proposals', count: awaitingReview.value },
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

const detailOpen = ref(false)
const openProposalId = ref<string | null>(null)

/*
 * Read through the list rather than held as its own copy, so a row that
 * changes — a run finishing, a status moving on — updates the open drawer
 * too. A snapshot here would show a curator the proposal as it was when
 * they clicked it.
 */
const openProposal = computed(() =>
  proposals.value.find(p => p.id === openProposalId.value) ?? null)

/** Open a proposal this turn filed, by id, switching to the panel it is on. */
function openFiled(proposalId: string) {
  panel.value = 'proposals'
  openProposalId.value = proposalId
  detailOpen.value = true
}

function showProposal(proposal: Proposal) {
  openProposalId.value = proposal.id
  detailOpen.value = true
}

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
 * The candidates a turn offered, read off its steps.
 *
 * They ride on the step rather than in a table of their own: a suggestion is
 * something that happened in this turn, it is already persisted and already
 * streamed, and nothing about it needs to outlive the conversation until a
 * person presses the button.
 */
function suggestionsIn(message: IntegratorMessage):
Array<{ key: string, suggestion: SourceSuggestion }> {
  return (message.steps ?? [])
    .map(step => ({ key: `${message.seq}:${step.id}`, suggestion: stepSuggestion(step) }))
    .filter((row): row is { key: string, suggestion: SourceSuggestion } =>
      row.suggestion !== null)
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
    liveReply.value = ''
    lastRun.value = ''
  } catch (error) {
    toast.add({ title: failureText(error, 'Could not start a conversation'), color: 'error' })
  }
}

async function openSession(id: string) {
  sessionId.value = id
  messages.value = await integratorApi.history(id)
  liveSteps.value = []
  liveReply.value = ''
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
      onText: (delta) => {
        liveReply.value += delta
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
    liveReply.value = ''
    lastRun.value = turn.stop_reason === 'completed'
      ? `${turn.steps} step${turn.steps === 1 ? '' : 's'} · ${turn.tokens.toLocaleString()} tokens · ${turn.model}`
      : `Stopped: ${turn.stop_reason}`
    // The reload, and the switch to the proposals tab when a turn filed
    // something, happen in `finally` — a turn that stopped early filed just
    // as much as one that finished.
    if (!sessions.value.find(s => s.id === sessionId.value)?.title) {
      sessions.value = await integratorApi.listSessions()
    }
  } catch (error) {
    toast.add({ title: failureText(error, 'The assistant could not answer'), color: 'error' })
  } finally {
    thinking.value = false
    liveReply.value = ''
    // However the turn ended. A turn that files four proposals and then runs
    // out of tokens throws before the reload above, so the count stayed at
    // what it was before the turn — the proposals were there, the panel said
    // otherwise, and the assistant was believed over the database.
    const before = proposals.value.length
    await loadProposals()
    if (proposals.value.length > before) panel.value = 'proposals'
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

<!--
  Styling for the rendered markdown. Scoped styles do not reach `v-html`
  output, which carries no scope attribute, so these are deliberately global
  and namespaced under one class instead.
-->
<style>
.integrator-prose > :first-child { margin-top: 0; }
.integrator-prose > :last-child { margin-bottom: 0; }

.integrator-prose p,
.integrator-prose ul,
.integrator-prose ol { margin: 0.5rem 0; }

.integrator-prose ul { list-style: disc; padding-left: 1.15rem; }
.integrator-prose ol { list-style: decimal; padding-left: 1.35rem; }
.integrator-prose li { margin: 0.15rem 0; }

.integrator-prose h1,
.integrator-prose h2,
.integrator-prose h3,
.integrator-prose h4 {
  margin: 0.9rem 0 0.35rem;
  font-weight: 600;
  line-height: 1.3;
}
.integrator-prose h1 { font-size: 1rem; }
.integrator-prose h2 { font-size: 0.9375rem; }
.integrator-prose h3,
.integrator-prose h4 { font-size: 0.875rem; }

.integrator-prose a {
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-color: color-mix(in srgb, currentColor 40%, transparent);
}
.integrator-prose a:hover { text-decoration-color: currentColor; }

.integrator-prose code {
  border-radius: 0.25rem;
  background: rgb(0 0 0 / 6%);
  padding: 0.05rem 0.3rem;
  font-size: 0.8125em;
}
.integrator-prose pre {
  overflow-x: auto;
  border-radius: 0.5rem;
  background: rgb(0 0 0 / 6%);
  padding: 0.6rem 0.75rem;
  margin: 0.5rem 0;
}
.integrator-prose pre code { background: none; padding: 0; }

/*
  The assistant answers a "what exists for this country" question with a
  table, so the table is the answer and has to read as one. It scrolls in its
  own container: a comparison of eight sources is wider than a chat column,
  and the alternative to scrolling here is the page scrolling sideways.
*/
.integrator-prose .table-scroll {
  overflow-x: auto;
  margin: 0.6rem 0;
}
.integrator-prose table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
  /* Long URLs in a cell would otherwise set the column's width. */
  table-layout: auto;
}
.integrator-prose th,
.integrator-prose td {
  border: 1px solid rgb(0 0 0 / 10%);
  padding: 0.3rem 0.5rem;
  text-align: left;
  vertical-align: top;
}
.integrator-prose th {
  background: rgb(0 0 0 / 4%);
  font-weight: 600;
  white-space: nowrap;
}

.integrator-prose blockquote {
  border-left: 2px solid rgb(0 0 0 / 15%);
  padding-left: 0.65rem;
  margin: 0.5rem 0;
  opacity: 0.85;
}
.integrator-prose hr {
  border: 0;
  border-top: 1px solid rgb(0 0 0 / 10%);
  margin: 0.75rem 0;
}

.dark .integrator-prose code,
.dark .integrator-prose pre,
.dark .integrator-prose th { background: rgb(255 255 255 / 8%); }
.dark .integrator-prose th,
.dark .integrator-prose td,
.dark .integrator-prose hr { border-color: rgb(255 255 255 / 12%); }
.dark .integrator-prose blockquote { border-left-color: rgb(255 255 255 / 20%); }
</style>
