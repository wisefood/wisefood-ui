<template>
  <div v-if="cookingProfile">
    <!-- Skill Level -->
    <v-card-item>
      <v-card-subtitle class="text-subtitle-1 mb-2 d-flex align-center">
        <v-icon icon="mdi-chef-hat" size="small" class="me-2" />
        {{ t("profile.cooking.skillLevel") }}
      </v-card-subtitle>

      <div class="d-flex flex-wrap ga-2">
        <v-chip
          v-if="cookingProfile.cookingSkillLevel"
          color="info"
          size="small"
        >
          {{ formatText(cookingProfile.cookingSkillLevel.toString()) }}
        </v-chip>

        <v-chip
          v-if="!cookingProfile.cookingSkillLevel"
          variant="outlined"
          color="grey"
          size="small"
        >
          {{ t("common.none") }}
        </v-chip>
      </div>
    </v-card-item>

    <!-- Available Equipment -->
    <v-card-item>
      <v-card-subtitle class="text-subtitle-1 mb-2 d-flex align-center">
        <v-icon icon="mdi-stove" size="small" class="me-2" />
        {{ t("profile.cooking.availableEquipment") }}
      </v-card-subtitle>

      <div class="d-flex flex-wrap ga-2">
        <v-chip
          v-for="equipment in cookingProfile.cookingEquipment"
          :key="equipment.toString()"
          color="secondary"
          size="small"
        >
          <v-icon icon="mdi-tools" start size="x-small" />
          {{ formatText(equipment.toString()) }}
        </v-chip>

        <v-chip
          v-if="cookingProfile.cookingEquipment?.length === 0"
          variant="outlined"
          color="grey"
          size="small"
        >
          {{ t("common.none") }}
        </v-chip>
      </div>
    </v-card-item>

    <!-- Time Preferences -->
    <v-card-item>
      <v-card-subtitle class="text-subtitle-1 mb-2 d-flex align-center">
        <v-icon icon="mdi-clock-outline" size="small" class="me-2" />
        {{ t("profile.cooking.timePreferences") }}
      </v-card-subtitle>

      <div class="d-flex flex-wrap ga-2">
        <v-chip
          v-for="time in cookingProfile.cookingTimePreference"
          :key="time.toString()"
          color="accent"
          size="small"
        >
          <v-icon icon="mdi-timer" start size="x-small" />
          {{ formatText(time.toString()) }}
        </v-chip>

        <v-chip
          v-if="cookingProfile.cookingTimePreference?.length === 0"
          variant="outlined"
          color="grey"
          size="small"
        >
          {{ t("common.none") }}
        </v-chip>
      </div>
    </v-card-item>

    <!-- Budget Considerations -->
    <v-card-item>
      <v-card-subtitle class="text-subtitle-1 mb-2 d-flex align-center">
        <v-icon icon="mdi-currency-usd" size="small" class="me-2" />
        {{ t("profile.cooking.budgetConsiderations") }}
      </v-card-subtitle>

      <div class="d-flex flex-wrap ga-2">
        <v-chip
          v-if="cookingProfile.budgetConsideration"
          color="success"
          size="small"
        >
          <v-icon icon="mdi-wallet" start size="x-small" />
          {{ formatText(cookingProfile.budgetConsideration.toString()) }}
        </v-chip>

        <v-chip
          v-if="!cookingProfile.budgetConsideration"
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
import type { CookingProfile } from "@/types/food-profile.types";
import NoDataMessage from "@/components/NoDataMessage.vue";

const { t } = useI18nWithStorage();

defineProps<{
  cookingProfile: CookingProfile;
}>();

const formatText = (text: string): string => {
  return text
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l: string) => l.toUpperCase());
};
</script>
