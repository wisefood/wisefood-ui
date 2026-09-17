<!--
  A candidate the assistant is offering rather than filing, with the button
  that files it.

  This replaces the assistant printing a proposal as JSON in the reply and
  then announcing it had filed one. Neither half of that was any use: a code
  block is not something a curator can act on, and the proposal it claimed to
  have made did not exist, so looking for it was wasted time. The decision it
  was describing is a single press, so it is a single press.
-->
<template>
  <div
    class="rounded-xl border border-dashed p-3"
    :class="filed
      ? 'border-green-300 bg-green-50/60 dark:border-green-500/40 dark:bg-green-500/5'
      : 'border-brand-300 bg-brand-50/50 dark:border-brand-500/40 dark:bg-brand-500/5'"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-1.5">
          <UBadge
            size="sm"
            variant="soft"
            color="neutral"
          >
            {{ KIND_SHORT[suggestion.kind] || suggestion.kind }}
          </UBadge>
          <UBadge
            size="sm"
            variant="soft"
            :color="LICENCE_STATE[state].badge"
          >
            {{ LICENCE_STATE[state].short }}
          </UBadge>
          <span
            v-if="suggestion.country"
            class="text-[11px] text-gray-500 dark:text-gray-400"
          >{{ suggestion.country }}<template v-if="suggestion.language"> · {{ suggestion.language }}</template></span>
        </div>
        <p class="mt-1.5 text-sm font-medium text-gray-900 dark:text-white">
          {{ suggestion.title }}
        </p>
        <a
          v-if="suggestion.source_url"
          :href="suggestion.source_url"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-0.5 block truncate font-mono text-[11px] text-brand-600 hover:underline dark:text-brand-300"
        >{{ suggestion.source_url }}</a>
        <p
          v-if="suggestion.rationale"
          class="mt-1.5 text-xs leading-relaxed text-gray-600 dark:text-gray-300"
        >
          {{ suggestion.rationale }}
        </p>
      </div>

      <!-- Once filed it says so and stays put. Offering the button again
           invites a second proposal for the same source. -->
      <div
        v-if="filed"
        class="flex shrink-0 items-center gap-1 text-xs text-green-700 dark:text-green-400"
      >
        <UIcon
          name="i-lucide-check"
          class="h-3.5 w-3.5"
        />
        In review
      </div>
      <UButton
        v-else
        color="primary"
        size="xs"
        icon="i-lucide-plus"
        class="shrink-0 cursor-pointer"
        :loading="filing"
        @click="file"
      >
        Add to proposals
      </UButton>
    </div>

    <!-- The steps it intends, when it named any. Worth seeing before
         agreeing to it, because this is what approving will set running. -->
    <details
      v-if="suggestion.plan?.length"
      class="mt-2"
    >
      <summary class="cursor-pointer text-[11px] text-gray-500 hover:text-gray-700 dark:text-gray-400">
        What integrating it would do
      </summary>
      <ol class="mt-1 list-decimal space-y-0.5 pl-4 text-[11px] text-gray-500 dark:text-gray-400">
        <li
          v-for="(step, i) in suggestion.plan"
          :key="i"
        >
          {{ step }}
        </li>
      </ol>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import integratorApi, { failureText, type SourceSuggestion } from '~/services/integratorApi'
import { KIND_SHORT, LICENCE_STATE, licenceState } from '~/utils/integratorSources'

const props = defineProps<{
  suggestion: SourceSuggestion
  sessionId?: string
}>()

const emit = defineEmits<{ filed: [] }>()

const toast = useToast()
const filing = ref(false)
const filed = ref(false)

const state = computed(() => licenceState(props.suggestion.licence))

async function file() {
  filing.value = true
  try {
    await integratorApi.createProposal(props.suggestion, props.sessionId)
    filed.value = true
    toast.add({
      title: 'Added to proposals',
      description: props.suggestion.title,
      icon: 'i-lucide-check',
      color: 'success'
    })
    emit('filed')
  } catch (error) {
    toast.add({ title: failureText(error, 'Could not file that'), color: 'error' })
  } finally {
    filing.value = false
  }
}
</script>
