<!--
  Every candidate the assistant has filed, as rows.

  A curator's question here is comparative — which of these is worth my
  attention first — and cards answer it badly: each was as tall as its
  longest field, so two filled the panel and the rest were scrolling. A row
  per proposal puts kind, licence and state in columns the eye runs down,
  ordered so what is waiting on a person is at the top. The detail is one
  click away rather than always open.
-->
<template>
  <div>
    <div
      v-if="!proposals.length"
      class="px-5 py-12 text-center"
    >
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Nothing proposed yet.
      </p>
      <p class="mx-auto mt-1 max-w-xs text-xs text-gray-400 dark:text-gray-500">
        Ask the assistant for sources on the left. What it finds is filed here
        for you to decide on.
      </p>
    </div>

    <table
      v-else
      class="w-full text-left text-xs"
    >
      <thead class="sticky top-0 z-10 bg-white/95 backdrop-blur dark:bg-zinc-900/95">
        <tr class="border-b border-gray-100 text-[0.625rem] uppercase tracking-wide text-gray-400 dark:border-zinc-800 dark:text-gray-500">
          <th class="px-4 py-2 font-medium">
            Source
          </th>
          <th class="px-2 py-2 font-medium">
            Licence
          </th>
          <th class="px-2 py-2 font-medium">
            State
          </th>
          <th class="px-4 py-2 text-right font-medium">
            <span class="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-50 dark:divide-zinc-800/70">
        <tr
          v-for="proposal in ordered"
          :key="proposal.id"
          class="cursor-pointer transition"
          :class="proposal.id === selectedId
            ? 'bg-brand-50/70 dark:bg-brand-500/10'
            : 'hover:bg-gray-50 dark:hover:bg-white/5'"
          @click="$emit('open', proposal)"
        >
          <td class="max-w-0 px-4 py-2.5">
            <div class="flex items-center gap-1.5">
              <!-- A running integration is the one thing worth noticing
                   without opening anything. -->
              <UIcon
                v-if="proposal.status === 'running'"
                name="i-lucide-loader-2"
                class="h-3 w-3 shrink-0 animate-spin text-brand-500"
              />
              <span
                class="truncate font-medium text-gray-900 dark:text-white"
                :title="proposal.title"
              >{{ proposal.title }}</span>
            </div>
            <span class="mt-0.5 block truncate text-[0.625rem] text-gray-400 dark:text-gray-500">
              {{ KIND_SHORT[proposal.kind] || proposal.kind }}<template v-if="proposal.country"> · {{ proposal.country }}</template><template v-if="proposal.language"> · {{ proposal.language }}</template>
            </span>
          </td>
          <td class="whitespace-nowrap px-2 py-2.5">
            <UBadge
              size="sm"
              variant="soft"
              :color="LICENCE_STATE[licenceState(proposal.licence)].badge"
              :title="LICENCE_STATE[licenceState(proposal.licence)].long(proposal.licence)"
            >
              {{ LICENCE_STATE[licenceState(proposal.licence)].short }}
            </UBadge>
          </td>
          <td class="whitespace-nowrap px-2 py-2.5">
            <span
              class="text-[0.6875rem]"
              :class="proposal.status === 'imported'
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-500 dark:text-gray-400'"
            >{{ STATUS_LABELS[proposal.status] || proposal.status }}</span>
          </td>
          <td class="whitespace-nowrap px-4 py-2.5 text-right">
            <!-- Approve and reject inline: the common case is a row a curator
                 has already read about in the conversation beside it, and
                 making them open a drawer to agree is a click spent on
                 nothing. Everything else lives in the detail. -->
            <div
              v-if="stageOf(proposal) === 'review' || proposal.status === 'failed'"
              class="flex items-center justify-end gap-0.5"
            >
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-lucide-x"
                aria-label="Reject"
                title="Reject"
                :loading="busyId === proposal.id && busyAction === 'reject'"
                @click.stop="$emit('reject', proposal)"
              />
              <UButton
                color="primary"
                variant="ghost"
                size="xs"
                :icon="proposal.status === 'failed' ? 'i-lucide-rotate-ccw' : 'i-lucide-check'"
                :aria-label="proposal.status === 'failed' ? 'Approve again' : 'Approve'"
                :title="proposal.status === 'failed' ? 'Approve again' : 'Approve'"
                :loading="busyId === proposal.id && busyAction === 'approve'"
                @click.stop="$emit('approve', proposal)"
              />
            </div>
            <UIcon
              v-else
              name="i-lucide-chevron-right"
              class="h-3.5 w-3.5 text-gray-300 dark:text-gray-600"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Proposal } from '~/services/integratorApi'
import {
  KIND_SHORT, LICENCE_STATE, STAGE_ORDER, STATUS_LABELS, licenceState, stageOf
} from '~/utils/integratorSources'

const props = defineProps<{
  proposals: Proposal[]
  /** Which row is open in the drawer, so the table shows where you are. */
  selectedId?: string | null
  busyId?: string | null
  busyAction?: 'approve' | 'reject' | null
}>()

defineEmits<{
  open: [Proposal]
  approve: [Proposal]
  reject: [Proposal]
}>()

/*
 * What needs a person first, then what is mid-integration, then what is
 * done. Within a stage the server's order stands — that is the agent's
 * score, or the order a curator put them in, and neither is ours to undo.
 */
const ordered = computed(() =>
  [...props.proposals].sort((a, b) => STAGE_ORDER[stageOf(a)] - STAGE_ORDER[stageOf(b)]))
</script>
