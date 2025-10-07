<template>
  <div v-if="foodPreferences">
    <v-card-item>
      <v-card-subtitle class="text-subtitle-1 mb-2 d-flex align-center">
        <v-icon icon="mdi-alert-circle" size="small" class="me-2" />
        {{ t("profile.food.allergiesAndIntolerances") }}
      </v-card-subtitle>

      <div class="d-flex flex-wrap ga-2">
        <v-chip
          v-for="item in foodPreferences.foodAllergies"
          :key="item.toString()"
          color="error"
          variant="flat"
          size="small"
        >
          <v-icon icon="mdi-cancel" start size="x-small" />
          {{ formatText(item.toString()) }}
        </v-chip>

        <v-chip
          v-if="foodPreferences.foodAllergies.length === 0"
          variant="outlined"
          color="grey"
          size="small"
        >
          {{ t("profile.food.noDietaryRestrictions") }}
        </v-chip>
      </div>
    </v-card-item>
    <FoodPreferenceSection
      :title="t('profile.food.favouriteIngredients')"
      :items="foodPreferences.ingredientsToPrefer"
      :empty-message="t('profile.food.noFavouriteIngredients')"
      :color-fn="getPreferenceColor"
      icon="mdi-heart"
    />

    <FoodPreferenceSection
      :title="t('profile.food.foodToAvoid')"
      :items="foodPreferences.ingredientsToAvoid"
      :empty-message="t('profile.food.noIngredientsToAvoid')"
      color="warning"
      icon="mdi-cancel"
    />
  </div>
  <NoDataMessage v-else />
</template>

<script setup lang="ts">
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
import type {
  FoodPreferences,
  FoodConstrain,
} from "@/types/food-profile.types";
import NoDataMessage from "@/components/NoDataMessage.vue";
import FoodPreferenceSection from "./FoodPreferenceSection.vue";
import type { FoodAllergy } from "@/types/food-profile.enums";

const { t } = useI18nWithStorage();
const formatText = (text: string): string => {
  return text
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l: string) => l.toUpperCase());
};
defineProps<{
  foodPreferences: FoodPreferences;
}>();

const getPreferenceColor = (item: FoodConstrain<FoodAllergy>): string => {
  return item.isRequired ? "success" : "primary";
};
</script>
