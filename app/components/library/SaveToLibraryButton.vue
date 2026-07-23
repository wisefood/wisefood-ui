<!--
  Save/unsave any library asset (recipe or literature) for the current member.
  Hand it the item's urn (literature) or an opaque id + explicit type (recipe);
  it derives the type, shows saved state, and toggles optimistically.

  Hidden entirely when the asset is not a saveable type. When no member is
  selected the button shows but is disabled with an explanatory tooltip, so the
  affordance is still discoverable.
-->
<template>
  <UTooltip
    v-if="savedItemType"
    :text="householdStore.currentMember ? '' : t('library.signInToSave')"
    :disabled="!!householdStore.currentMember"
  >
    <UButton
      :variant="variant"
      :size="size"
      :icon="isSaved ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark'"
      :loading="loading"
      :disabled="!householdStore.currentMember"
      :class="[isSaved ? 'text-brandg-600 dark:text-brandg-400' : '', 'cursor-pointer']"
      @click="toggle"
    >
      <slot :is-saved="isSaved">
        {{ isSaved ? t('library.saved') : t('library.save') }}
      </slot>
    </UButton>
  </UTooltip>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHouseholdStore } from '~/stores/household'
import { useSavedItem } from '~/composables/useSavedItem'
import type { SavedItemType } from '~/services/memberSavedItemsApi'

const props = withDefaults(defineProps<{
  /** urn:<type>:<slug> for literature, or an opaque recipe id. */
  itemRef: string | undefined | null
  /** Required for recipes (opaque id has no urn prefix); optional for literature. */
  itemType?: SavedItemType
  variant?: 'solid' | 'outline' | 'soft' | 'ghost' | 'subtle' | 'link'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  itemType: undefined,
  variant: 'outline',
  size: 'sm'
})

const { t } = useI18n()
const householdStore = useHouseholdStore()

const { isSaved, loading, savedItemType, toggle } = useSavedItem(
  toRef(props, 'itemRef'),
  toRef(props, 'itemType')
)
</script>
