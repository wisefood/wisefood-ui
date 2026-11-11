<template>
  <section
    class="p-6 rounded-2xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700"
    data-flows="foodscholar-how-sure"
  >
    <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <UIcon
        name="i-lucide-shield-question"
        class="w-5 h-5 text-brand-600 dark:text-brand-400"
      />
      {{ t('foodScholarLearn.howSure.title') }}
    </h2>

    <template v-if="strength.level !== 'unknown'">
      <div class="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-zinc-700/40">
        <FoodscholarEvidenceMeter :bars="strength.bars" />
        <div class="min-w-0">
          <p class="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
            <UIcon
              :name="strength.icon"
              class="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0"
            />
            {{ t(`foodScholarLearn.levels.${strength.level}.title`) }}
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-300 font-light mt-0.5">
            {{ t(`foodScholarLearn.levels.${strength.level}.body`) }}
          </p>
        </div>
      </div>

      <dl class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div class="p-3 rounded-xl border border-gray-100 dark:border-zinc-700">
          <dt class="text-xs text-gray-500 dark:text-gray-400">
            {{ t('foodScholarLearn.howSure.studiedIn') }}
          </dt>
          <dd class="font-medium text-gray-900 dark:text-white flex items-center gap-1.5 mt-0.5">
            <UIcon
              :name="studiedInIcon"
              class="w-4 h-4 text-gray-500 dark:text-gray-400"
            />
            {{ t(`foodScholarLearn.studiedIn.${strength.studiedIn}`) }}
          </dd>
        </div>
        <div
          v-if="whoTookPart"
          class="p-3 rounded-xl border border-gray-100 dark:border-zinc-700"
        >
          <dt class="text-xs text-gray-500 dark:text-gray-400">
            {{ t('foodScholarLearn.howSure.population') }}
          </dt>
          <dd class="font-medium text-gray-900 dark:text-white mt-0.5">
            {{ whoTookPart }}
          </dd>
        </div>
      </dl>

      <p
        v-if="strength.level === 'early'"
        class="mt-4 text-sm text-orange-700 dark:text-orange-300 flex items-start gap-2"
      >
        <UIcon
          name="i-lucide-info"
          class="w-4 h-4 shrink-0 mt-0.5"
        />
        {{ t('foodScholarLearn.howSure.earlyNote') }}
      </p>
      <p
        v-else-if="specificGroup"
        class="mt-4 text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2"
      >
        <UIcon
          name="i-lucide-users"
          class="w-4 h-4 shrink-0 mt-0.5"
        />
        {{ t('foodScholarLearn.howSure.appliesNote', { group: specificGroup }) }}
      </p>
    </template>

    <template v-else>
      <p class="text-sm text-gray-600 dark:text-gray-300 font-light">
        {{ t('foodScholarLearn.howSure.unknownBody') }}
      </p>
      <ul class="mt-3 space-y-2">
        <li
          v-for="key in ['askWho', 'askLink', 'askOthers']"
          :key="key"
          class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
        >
          <UIcon
            name="i-lucide-circle-check"
            class="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5"
          />
          {{ t(`foodScholarLearn.howSure.${key}`) }}
        </li>
      </ul>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { evidenceStrength } from '~/utils/evidenceStrength'

const props = defineProps<{
  studyType?: string | null
  biologicalModel?: string | null
  populationGroup?: string | null
  ageGroup?: string | null
  publicationType?: string | string[] | null
}>()

const { t } = useI18n()

const strength = computed(() => evidenceStrength({
  study_type: props.studyType,
  biological_model: props.biologicalModel,
  type: props.publicationType
}))

const studiedInIcon = computed(() => ({
  people: 'i-lucide-users',
  animals: 'i-lucide-rabbit',
  cells: 'i-lucide-microscope',
  unknown: 'i-lucide-circle-help'
}[strength.value.studiedIn]))

const MEANINGLESS = new Set(['', 'not stated', 'none', 'n/a', 'unknown', 'other', 'general population', 'general'])

function meaningful(value?: string | null): string {
  const v = (value ?? '').trim()
  return MEANINGLESS.has(v.toLowerCase()) ? '' : v
}

const whoTookPart = computed(() => {
  const parts = [meaningful(props.populationGroup), meaningful(props.ageGroup)].filter(Boolean)
  return parts.join(' · ')
})

/** A named group (patients, athletes, pregnant women...) is worth a caution. */
const specificGroup = computed(() => meaningful(props.populationGroup))
</script>
