<template>
  <AppPageHeader
    :back-to="backTo"
    :back-label="backLabel"
    brand-title="RecipeWrangler"
    brand-class="text-brandg-500 dark:text-brandg-400"
    :subtitle="t('recipeWrangler.subtitle')"
  >
    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>
  </AppPageHeader>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  backTo: string
  backLabel: string
}>()
</script>
