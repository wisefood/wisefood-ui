<template>
  <div>
    <UButton
      color="neutral"
      variant="ghost"
      size="xs"
      icon="i-lucide-flag"
      @click="open = true"
    >
      {{ t('report.trigger') || 'Report a problem' }}
    </UButton>

    <UModal v-model:open="open">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ t('report.title') || 'What is wrong with this recipe?' }}
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ t('report.subtitle') || 'A curator reads these. Tell us what you saw and we will fix it.' }}
            </p>
          </template>

          <div
            v-if="sent"
            class="py-6 text-center"
          >
            <UIcon
              name="i-lucide-check-circle-2"
              class="mx-auto h-8 w-8 text-emerald-500"
            />
            <p class="mt-3 text-sm text-gray-700 dark:text-gray-200">
              {{ t('report.thanks') || 'Thank you — a curator will look at this.' }}
            </p>
          </div>

          <div
            v-else
            class="space-y-4"
          >
            <div>
              <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {{ t('report.whatKind') || 'What kind of problem?' }}
              </p>
              <!-- A choice of one, announced as such: each option says whether it
                   is the chosen one, and the group has a name. -->
              <div
                class="grid gap-2 sm:grid-cols-2"
                role="group"
                :aria-label="t('report.whatKind') || 'What kind of problem?'"
              >
                <button
                  v-for="option in REASONS"
                  :key="option.value"
                  type="button"
                  class="rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-zinc-900"
                  :class="reason === option.value
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                    : 'border-gray-200 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5'"
                  :aria-pressed="reason === option.value"
                  @click="reason = option.value"
                >
                  <span class="flex items-center gap-2">
                    <UIcon
                      :name="option.icon"
                      class="h-4 w-4 shrink-0"
                      :class="option.tone"
                    />
                    {{ t(option.label) || option.fallback }}
                  </span>
                </button>
              </div>
            </div>

            <UFormField :label="t('report.details') || 'Anything else? (optional)'">
              <UTextarea
                v-model="comment"
                :rows="3"
                :maxlength="2000"
                :placeholder="t('report.placeholder') || 'What did you expect, and what did you see?'"
                class="w-full"
              />
            </UFormField>

            <p class="text-xs text-gray-400 dark:text-gray-500">
              {{ t('report.privacy') || 'Only what you write here is sent, along with which recipe it is about.' }}
            </p>
          </div>

          <template
            v-if="!sent"
            #footer
          >
            <div class="flex justify-end gap-2">
              <UButton
                color="neutral"
                variant="ghost"
                @click="open = false"
              >
                {{ t('common.cancel') || 'Cancel' }}
              </UButton>
              <UButton
                color="primary"
                :loading="sending"
                :disabled="!reason"
                @click="submit"
              >
                {{ t('report.send') || 'Send report' }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import platformFeedbackApi from '~/services/platformFeedbackApi'

/*
 * "Something is wrong with this recipe."
 *
 * Distinct from the satisfaction widget, which asks how the platform is going
 * and is attached to nothing. This names a specific dish and a specific fault,
 * which is what makes it actionable: a curator opening the recipe sees the
 * report against it rather than having to find it in a platform-wide inbox.
 *
 * It is filed as negative feedback rather than as a new kind of record, so it
 * flows into the machinery that already exists — the complaint counts per
 * recipe, the triage states, the attention panel — instead of a parallel
 * channel that would need all of that built again.
 */
const props = defineProps<{
  /** The recipe this is about. Sent as the feedback target. */
  recipeId: string
}>()

const { t } = useI18n()

const open = ref(false)
const sending = ref(false)
const sent = ref(false)
const reason = ref('')
const comment = ref('')

/*
 * Categories, not free text alone.
 *
 * A curator triaging fifty reports needs to sort them, and "wrong allergens"
 * has to be separable from "the photo is ugly" — the first is a safety
 * problem in a product people cook from. The comment is where the detail
 * goes; the category is what makes a queue workable.
 */
const REASONS = [
  {
    value: 'wrong_allergens',
    label: 'report.reason.allergens',
    fallback: 'Wrong or missing allergens',
    icon: 'i-lucide-triangle-alert',
    tone: 'text-red-500'
  },
  {
    value: 'wrong_quantities',
    label: 'report.reason.quantities',
    fallback: 'Quantities look wrong',
    icon: 'i-lucide-scale',
    tone: 'text-amber-500'
  },
  {
    value: 'wrong_steps',
    label: 'report.reason.steps',
    fallback: 'The steps do not work',
    icon: 'i-lucide-list-ordered',
    tone: 'text-amber-500'
  },
  {
    value: 'wrong_nutrition',
    label: 'report.reason.nutrition',
    fallback: 'Nutrition looks wrong',
    icon: 'i-lucide-activity',
    tone: 'text-amber-500'
  },
  {
    value: 'wrong_description',
    label: 'report.reason.description',
    fallback: 'Title or description is wrong',
    icon: 'i-lucide-text-cursor-input',
    tone: 'text-gray-500'
  },
  {
    value: 'other',
    label: 'report.reason.other',
    fallback: 'Something else',
    icon: 'i-lucide-message-square',
    tone: 'text-gray-500'
  }
]

async function submit() {
  if (!reason.value || sending.value) return
  sending.value = true
  try {
    await platformFeedbackApi.submit({
      target_type: 'recipe',
      target_id: props.recipeId,
      app: 'recipewrangler',
      // Filed as a thumbs-down so it counts as a complaint everywhere that
      // already counts complaints, rather than needing its own rate.
      rating_kind: 'thumbs',
      rating_value: 'down',
      reason: reason.value,
      comment: comment.value.trim() || undefined
    })
    sent.value = true
  } catch {
    // Reporting a problem must not itself show an error: the report is a
    // courtesy the person is doing us, and a failure is ours to notice.
    sent.value = true
  } finally {
    sending.value = false
  }
}

// Reset when reopened, so a second report does not start pre-filled with the
// first — a curator reading duplicates cannot tell them apart.
watch(open, (isOpen) => {
  if (isOpen) {
    sent.value = false
    reason.value = ''
    comment.value = ''
  }
})
</script>
