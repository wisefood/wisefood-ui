<template>
  <div v-if="flavorProfile">
    <!-- Cuisine Preferences -->
    <v-card-item>
      <v-card-subtitle class="text-subtitle-1 mb-2 d-flex align-center">
        <v-icon icon="mdi-earth" size="small" class="me-2" />
        {{ t("profile.flavor.cuisinePreferences") }}
      </v-card-subtitle>

      <div class="d-flex flex-wrap ga-2">
        <v-chip
          v-for="cuisine in flavorProfile.cuisinePreferences"
          :key="cuisine.toString()"
          color="primary"
          size="small"
        >
          <v-icon icon="mdi-silverware-fork-knife" start size="x-small" />
          {{ formatText(cuisine.toString()) }}
        </v-chip>

        <v-chip
          v-if="flavorProfile.cuisinePreferences?.length === 0"
          variant="outlined"
          color="grey"
          size="small"
        >
          {{ t("common.none") }}
        </v-chip>
      </div>
    </v-card-item>

    <!-- Spiciness Level -->
    <v-card-item>
      <v-card-subtitle class="text-subtitle-1 mb-2 d-flex align-center">
        <v-icon icon="mdi-chili-hot" size="small" class="me-2" />
        {{ t("profile.flavor.spicinessLevel") }}
      </v-card-subtitle>

      <div class="d-flex flex-wrap ga-2">
        <v-chip v-if="flavorProfile.spicinessLevel" color="error" size="small">
          <v-icon icon="mdi-fire" start size="x-small" />
          {{ formatText(flavorProfile.spicinessLevel.toString()) }}
        </v-chip>

        <v-chip
          v-if="!flavorProfile.spicinessLevel"
          variant="outlined"
          color="grey"
          size="small"
        >
          {{ t("common.none") }}
        </v-chip>
      </div>
    </v-card-item>

    <!-- Taste Preferences -->
    <v-card-item>
      <v-card-subtitle class="text-subtitle-1 mb-2 d-flex align-center">
        <v-icon icon="mdi-emoticon-tongue" size="small" class="me-2" />
        {{ t("profile.flavor.tastePreferences") }}
      </v-card-subtitle>

      <div class="d-flex flex-wrap ga-2">
        <v-chip
          v-for="taste in flavorProfile.tastePreferences"
          :key="taste.toString()"
          color="secondary"
          size="small"
        >
          <v-icon :icon="getTasteIcon(taste)" start size="x-small" />
          {{ formatText(taste.toString()) }}
        </v-chip>

        <v-chip
          v-if="flavorProfile.tastePreferences?.length === 0"
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
import type { FlavorProfile } from "@/types/food-profile.types";
import NoDataMessage from "@/components/NoDataMessage.vue";
import type { TastePalette } from "@/types/food-profile.enums";

const { t } = useI18nWithStorage();

defineProps<{
  flavorProfile: FlavorProfile;
}>();

const formatText = (text: string): string => {
  return text
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l: string) => l.toUpperCase());
};

const getTasteIcon = (taste: TastePalette): string => {
  const tasteString = taste.toString().toLowerCase();

  switch (tasteString) {
    case "sweet":
      return "mdi-candy";
    case "salty":
      return "mdi-shaker";
    case "sour":
      return "mdi-lemon";
    case "bitter":
      return "mdi-coffee";
    case "umami":
      return "mdi-mushroom";
    case "spicy":
      return "mdi-chili-hot";
    default:
      return "mdi-circle";
  }
};
</script>
