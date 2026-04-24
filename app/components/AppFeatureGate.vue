<template>
  <div v-if="state === 'ready'" class="contents">
    <slot />
  </div>
  <div
    v-else
    class="flex-1 flex items-center justify-center px-4 py-16"
  >
    <div class="w-full max-w-md text-center">
      <div class="mx-auto w-14 h-14 rounded-2xl bg-brandp-50 dark:bg-brandp-900/20 flex items-center justify-center mb-6">
        <UIcon :name="icon" class="w-7 h-7 text-brandp-500 dark:text-brandp-400" />
      </div>
      <h2 class="text-xl sm:text-2xl font-light text-zinc-900 dark:text-white mb-2">
        {{ title }}
      </h2>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 font-light mb-6">
        {{ description }}
      </p>
      <UButton
        :to="ctaTo"
        color="primary"
        size="lg"
        :label="ctaLabel"
        icon="i-lucide-arrow-right"
        trailing
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useHouseholdStore } from '~/stores/household'

const props = defineProps<{
  feature: string
}>()

const { t } = useI18n()
const householdStore = useHouseholdStore()
const { hasHousehold, householdMembers, currentMember } = storeToRefs(householdStore)

onMounted(async () => {
  if (!householdStore.initialized) {
    await householdStore.initialize()
  }
})

type GateState = 'loading' | 'needs-household' | 'needs-member' | 'needs-selection' | 'ready'

const state = computed<GateState>(() => {
  if (hasHousehold.value === null) return 'loading'
  if (hasHousehold.value === false) return 'needs-household'
  if (householdMembers.value.length === 0) return 'needs-member'
  if (!currentMember.value) return 'needs-selection'
  return 'ready'
})

const featureLabel = computed(() => t(`featureGate.features.${props.feature}`))

const icon = computed(() => {
  switch (state.value) {
    case 'needs-household': return 'i-lucide-home'
    case 'needs-member': return 'i-lucide-user-plus'
    case 'needs-selection': return 'i-lucide-users'
    default: return 'i-lucide-loader-2'
  }
})

const title = computed(() => {
  if (state.value === 'loading') return t('featureGate.loading')
  return t(`featureGate.${state.value}.title`, { feature: featureLabel.value })
})

const description = computed(() => {
  if (state.value === 'loading') return ''
  return t(`featureGate.${state.value}.description`, { feature: featureLabel.value })
})

const ctaLabel = computed(() => {
  if (state.value === 'loading') return ''
  return t(`featureGate.${state.value}.cta`)
})

const ctaTo = '/profiles'
</script>
