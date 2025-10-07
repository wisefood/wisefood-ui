<template>
  <div v-if="advancedFeatures">
    <!-- Nutritional Goals -->
    <v-card-item>
      <v-card-subtitle class="text-subtitle-1 mb-2 d-flex align-center">
        <v-icon icon="mdi-heart-pulse" size="small" class="me-2" />
        {{ t("profile.advanced.nutritionalGoals") }}
      </v-card-subtitle>

      <div class="d-flex flex-wrap ga-2">
        <v-chip
          v-for="goal in advancedFeatures.nutritionalGoals"
          :key="goal"
          color="success"
          size="small"
        >
          <v-icon icon="mdi-target" start size="x-small" />
          {{ formatText(goal) }}
        </v-chip>

        <v-chip
          v-if="advancedFeatures.nutritionalGoals?.length === 0"
          variant="outlined"
          color="grey"
          size="small"
        >
          {{ t("common.none") }}
        </v-chip>
      </div>
    </v-card-item>
  </div>

  <NoDataMessage v-else />
</template>

<script setup lang="ts">
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
import type { AdvancedOptions } from "@/types/food-profile.types";
import NoDataMessage from "@/components/NoDataMessage.vue";

const { t } = useI18nWithStorage();

defineProps<{
  advancedFeatures: AdvancedOptions;
}>();

const formatText = (text: string): string => {
  return text
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l: string) => l.toUpperCase());
};
</script>
