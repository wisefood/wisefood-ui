<!--
  One candidate source, and the decision a curator has to make about it.

  The licence is the top line rather than a detail, because it is the thing
  that decides whether this can be used at all — and it is shown with the
  evidence behind it, so approving is reading rather than trusting.
-->
<template>
  <UCard
    :ui="{ body: 'p-4' }"
    class="border"
    :class="borderTone"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge
            size="sm"
            variant="soft"
            color="neutral"
          >
            {{ kindLabel }}
          </UBadge>
          <UBadge
            size="sm"
            variant="soft"
            :color="statusTone"
          >
            {{ proposal.status }}
          </UBadge>
          <span
            v-if="proposal.country"
            class="text-xs text-gray-500 dark:text-gray-400"
          >{{ proposal.country }}<template v-if="proposal.language"> · {{ proposal.language }}</template></span>
        </div>
        <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
          {{ proposal.title }}
        </h3>
        <a
          v-if="proposal.source_url"
          :href="proposal.source_url"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-0.5 block truncate font-mono text-[11px] text-brand-600 hover:underline dark:text-brand-300"
        >{{ proposal.source_url }}</a>
      </div>
      <div
        v-if="rankLabel"
        class="flex shrink-0 items-center gap-1"
      >
        <!-- Moving a proposal writes expert_rank beside the agent's score,
             never over it — so anyone can later ask whether the rubric
             actually agrees with the people using it. -->
        <div
          v-if="reorderable"
          class="flex flex-col"
        >
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-chevron-up"
            :ui="{ base: 'p-0.5' }"
            aria-label="Move up"
            @click="$emit('move', { proposal, direction: -1 })"
          />
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-chevron-down"
            :ui="{ base: 'p-0.5' }"
            aria-label="Move down"
            @click="$emit('move', { proposal, direction: 1 })"
          />
        </div>
        <div class="text-right">
          <p class="text-[10px] uppercase tracking-wide text-gray-400">
            {{ proposal.expert_rank != null ? 'Your order' : 'Score' }}
          </p>
          <p class="text-sm font-semibold tabular-nums text-gray-700 dark:text-gray-200">
            {{ rankLabel }}
          </p>
        </div>
      </div>
    </div>

    <!-- The licence, and what it was concluded from. A proposal without
         evidence is a guess that has been promoted to a fact. -->
    <div
      class="mt-3 rounded-lg p-3"
      :class="licenceTone"
    >
      <div class="flex flex-wrap items-center gap-2">
        <UIcon
          :name="licenceIcon"
          class="h-4 w-4 shrink-0"
        />
        <span class="text-sm font-medium">{{ licenceLabel }}</span>
        <span
          v-if="proposal.licence_confidence != null"
          class="text-xs opacity-70"
        >confidence {{ Math.round(proposal.licence_confidence * 100) }}%</span>
      </div>
      <ul
        v-if="proposal.licence_evidence?.length"
        class="mt-2 space-y-1"
      >
        <li
          v-for="(item, i) in proposal.licence_evidence.slice(0, 3)"
          :key="i"
          class="text-xs leading-relaxed opacity-80"
        >
          <span class="font-medium">{{ item.where || 'evidence' }}:</span>
          {{ item.quote || item.url || item.licence }}
        </li>
      </ul>
      <p
        v-else
        class="mt-1 text-xs opacity-70"
      >
        No licence evidence was found. Approving this needs a written reason.
      </p>
    </div>

    <p
      v-if="proposal.rationale"
      class="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300"
    >
      {{ proposal.rationale }}
    </p>

    <!-- The arithmetic behind the score, so a curator can disagree with a
         clause rather than with a number. -->
    <UCollapsible
      v-if="breakdown.length"
      v-model:open="showScore"
      class="mt-3"
    >
      <button
        type="button"
        class="flex w-full items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <UIcon
          :name="showScore ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
          class="h-3 w-3"
        />
        Why this score
      </button>
      <template #content>
        <ul class="mt-2 space-y-1">
          <li
            v-for="row in breakdown"
            :key="row.component"
            class="flex items-baseline gap-2 text-[11px]"
          >
            <span class="w-24 shrink-0 text-gray-400">{{ label(row.component) }}</span>
            <span class="w-10 shrink-0 tabular-nums text-gray-600 dark:text-gray-300">
              {{ row.score.toFixed(2) }}
            </span>
            <span class="w-12 shrink-0 tabular-nums text-gray-400">
              ×{{ row.weight.toFixed(2) }}
            </span>
            <span class="min-w-0 flex-1 text-gray-500 dark:text-gray-400">{{ row.why }}</span>
          </li>
        </ul>
      </template>
    </UCollapsible>

    <div v-if="proposal.plan?.length">
      <p class="mt-3 text-[10px] uppercase tracking-wide text-gray-400">
        Integration steps
      </p>
      <ol class="mt-1 list-decimal space-y-0.5 pl-4 text-xs text-gray-500 dark:text-gray-400">
        <li
          v-for="(step, i) in proposal.plan"
          :key="i"
        >
          {{ step }}
        </li>
      </ol>
    </div>

    <div
      v-if="proposal.status === 'approved'"
      class="mt-3 text-xs text-gray-500 dark:text-gray-400"
    >
      {{ approvalLine }}
      <template v-if="proposal.licence_override_reason">
        Reason given: “{{ proposal.licence_override_reason }}”.
      </template>
    </div>

    <!-- Approved: the decision is made, and this is where it gets carried
         out. Shown on the card rather than on a page of its own, because
         what was approved and what the integration did are the same story. -->
    <template
      v-if="proposal.status === 'approved' || proposal.status === 'imported'
        || proposal.status === 'failed'"
      #footer
    >
      <ConsoleIntegratorRunPanel
        :proposal="proposal"
        @finished="$emit('integrated', proposal)"
      />
    </template>

    <template
      v-else-if="actionable"
      #footer
    >
      <div class="flex flex-wrap items-center justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-x"
          :loading="busy === 'reject'"
          @click="$emit('reject', proposal)"
        >
          Reject
        </UButton>
        <UButton
          color="primary"
          size="sm"
          icon="i-lucide-check"
          :loading="busy === 'approve'"
          @click="$emit('approve', proposal)"
        >
          Approve
        </UButton>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Proposal } from '~/services/integratorApi'

const props = withDefaults(defineProps<{
  proposal: Proposal
  /** Which action is in flight, so only that button spins. */
  busy?: 'approve' | 'reject' | null
  /** Up/down arrows. Off for a single card or a decided proposal. */
  reorderable?: boolean
}>(), { busy: null, reorderable: false })

defineEmits<{
  approve: [Proposal]
  reject: [Proposal]
  move: [{ proposal: Proposal, direction: -1 | 1 }]
  /** A run finished, so the list's copy of this proposal is now stale. */
  integrated: [Proposal]
}>()

const showScore = ref(false)

interface ScoreRow { component: string, score: number, weight: number, why: string }

const COMPONENT_LABELS: Record<string, string> = {
  licence: 'Licence',
  coverage_gap: 'Coverage',
  authority: 'Authority',
  tractability: 'Effort',
  completeness: 'Detail'
}
const label = (component: string) => COMPONENT_LABELS[component] || component

const breakdown = computed<ScoreRow[]>(() => {
  const ranking = props.proposal.metadata?.ranking as { breakdown?: ScoreRow[] } | undefined
  return ranking?.breakdown ?? []
})

const KIND_LABELS: Record<string, string> = {
  guide: 'Dietary guide',
  article: 'Article',
  textbook: 'Textbook',
  fctable: 'Food composition table',
  rcollection: 'Recipe collection'
}

/*
 * Which licences allow the content itself to be brought in. The server is the
 * authority — this only decides how the card reads, so a curator is not
 * surprised by a refusal after clicking approve.
 */
const CONTENT_OK = new Set([
  'CC-BY-4.0', 'CC-BY-SA-4.0', 'CCBY', 'CCBYSA', 'CCBYNC', 'CCBYNCSA',
  'CC0', 'public-domain', 'MIT', 'Apache-2.0', 'GPL-3.0'
])

const kindLabel = computed(() => KIND_LABELS[props.proposal.kind] || props.proposal.kind)

const actionable = computed(() =>
  props.proposal.status === 'proposed' || props.proposal.status === 'researching')

const statusTone = computed(() => {
  switch (props.proposal.status) {
    case 'approved': case 'imported': return 'success' as const
    case 'rejected': case 'failed': return 'error' as const
    case 'running': return 'info' as const
    default: return 'neutral' as const
  }
})

const rankLabel = computed(() => {
  if (props.proposal.expert_rank != null) return `#${props.proposal.expert_rank}`
  if (props.proposal.proposed_rank != null) return props.proposal.proposed_rank.toFixed(2)
  return ''
})

const licenceState = computed(() => {
  const licence = props.proposal.licence
  if (!licence) return 'unknown'
  return CONTENT_OK.has(licence) ? 'permitted' : 'restricted'
})

const licenceLabel = computed(() => {
  switch (licenceState.value) {
    case 'permitted': return `${props.proposal.licence} — content may be brought in`
    case 'restricted': return `${props.proposal.licence} — pointer only, content may not be copied`
    default: return 'Licence undetermined'
  }
})

const licenceIcon = computed(() => ({
  permitted: 'i-lucide-check-circle-2',
  restricted: 'i-lucide-alert-triangle',
  unknown: 'i-lucide-help-circle'
}[licenceState.value]))

const licenceTone = computed(() => ({
  permitted: 'bg-green-50 text-green-900 dark:bg-green-500/10 dark:text-green-200',
  restricted: 'bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200',
  unknown: 'bg-gray-50 text-gray-700 dark:bg-white/5 dark:text-gray-300'
}[licenceState.value]))

/** "Approved by X on <date>." Built here so the template stays one line. */
const approvalLine = computed(() => {
  const who = props.proposal.approved_by || 'a curator'
  const when = props.proposal.approved_at
    ? ` on ${new Date(props.proposal.approved_at).toLocaleString()}`
    : ''
  return `Approved by ${who}${when}.`
})

const borderTone = computed(() => ({
  permitted: 'border-gray-200/70 dark:border-white/10',
  restricted: 'border-amber-200 dark:border-amber-500/30',
  unknown: 'border-gray-200/70 dark:border-white/10'
}[licenceState.value]))
</script>
