<template>
  <div>
    <!-- Food Allergies - Keep selection -->
    <v-card-item>
      <v-card-subtitle class="text-subtitle-1 mb-2">
        {{ t("profile.food.allergiesAndIntolerances") }}
      </v-card-subtitle>
      <v-chip
        v-for="allergy in availableOptions?.foodAllergies || []"
        :key="allergy"
        class="me-2 my-1"
        :color="
          isSelected('foodAllergies', allergy) ? 'primary' : 'grey-lighten-1'
        "
        :variant="isSelected('foodAllergies', allergy) ? 'flat' : 'outlined'"
        clickable
        @click="toggleSelection('foodAllergies', allergy)"
      >
        {{ formatText(allergy) }}
      </v-chip>
    </v-card-item>

    <!-- Favourite Ingredients - Type to add -->
    <v-card-item>
      <v-card-subtitle class="text-subtitle-1 mb-2">
        {{ t("profile.food.favouriteIngredients") }}
      </v-card-subtitle>

      <v-text-field
        v-model="ingredientInputs.ingredientsToPrefer"
        :label="t('profile.food.favouriteIngredients')"
        append-inner-icon="mdi-plus"
        @click:append-inner="addIngredient('ingredientsToPrefer')"
        @keyup.enter="addIngredient('ingredientsToPrefer')"
        variant="outlined"
        density="compact"
        class="mb-3"
      />

      <div class="d-flex flex-wrap ga-2">
        <v-chip
          v-for="ingredient in props.modelValue.ingredientsToPrefer"
          :key="ingredient.food"
          color="success"
          closable
          @click:close="removeIngredient('ingredientsToPrefer', ingredient)"
          @click="toggleRequired('ingredientsToPrefer', ingredient)"
          :variant="ingredient.isRequired ? 'flat' : 'outlined'"
          class="cursor-pointer"
        >
          <v-icon v-if="ingredient.isRequired" start size="x-small"
            >mdi-star</v-icon
          >
          {{ formatText(ingredient.food) }}
        </v-chip>
      </div>
      <v-card-text class="text-caption text-medium-emphasis pa-0 mt-1">
        Click on ingredient to toggle as required (⭐)
      </v-card-text>
    </v-card-item>

    <!-- Ingredients to Avoid - Type to add -->
    <v-card-item>
      <v-card-subtitle class="text-subtitle-1 mb-2">
        {{ t("profile.food.foodToAvoid") }}
      </v-card-subtitle>

      <v-text-field
        v-model="ingredientInputs.ingredientsToAvoid"
        :label="t('profile.food.foodToAvoid')"
        append-inner-icon="mdi-plus"
        @click:append-inner="addIngredient('ingredientsToAvoid')"
        @keyup.enter="addIngredient('ingredientsToAvoid')"
        variant="outlined"
        density="compact"
        class="mb-3"
      />

      <div class="d-flex flex-wrap ga-2">
        <v-chip
          v-for="ingredient in props.modelValue.ingredientsToAvoid"
          :key="ingredient.food"
          color="error"
          closable
          @click:close="removeIngredient('ingredientsToAvoid', ingredient)"
          @click="toggleRequired('ingredientsToAvoid', ingredient)"
          :variant="ingredient.isRequired ? 'flat' : 'outlined'"
          class="cursor-pointer"
        >
          <v-icon v-if="ingredient.isRequired" start size="x-small"
            >mdi-alert</v-icon
          >
          {{ formatText(ingredient.food) }}
        </v-chip>
      </div>
      <v-card-text class="text-caption text-medium-emphasis pa-0 mt-1">
        Click on ingredient to toggle as required (⚠️)
      </v-card-text>
    </v-card-item>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from "vue";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
import type {
  FoodConstrain,
  FoodPreferencesForm,
} from "@/types/food-profile.types";

const { t } = useI18nWithStorage();

// Props interface
interface Props {
  modelValue: FoodPreferencesForm;
  options?: {
    foodAllergies: string[];
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: FoodPreferencesForm];
  selectionChange: [category: string, item: string, selected: boolean];
}>();

// Input fields for typing ingredients
const ingredientInputs = ref({
  ingredientsToPrefer: "",
  ingredientsToAvoid: "",
});

// Available options from props
const availableOptions = computed(() => props.options);

// Watch for changes and emit to parent
watch(
  () => props.modelValue,
  (newValue) => {
    emit("update:modelValue", newValue);
  },
  { deep: true }
);

// Format text helper - converts ENUM_CASE to Title Case
const formatText = (text: string) => {
  return text
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

// Methods for allergies (selection)
// Update isSelected method
const isSelected = (category: "foodAllergies", item: string): boolean => {
  return props.modelValue[category].includes(item);
};

// Update toggleSelection method
const toggleSelection = (category: "foodAllergies", item: string) => {
  const isCurrentlySelected = isSelected(category, item);
  const currentSelections = [...props.modelValue[category]];

  if (isCurrentlySelected) {
    // Remove selection
    const index = currentSelections.indexOf(item);
    if (index > -1) {
      currentSelections.splice(index, 1);
    }
  } else {
    // Add selection - just push the string
    currentSelections.push(item);
  }

  // Emit the updated form data
  emit("update:modelValue", {
    ...props.modelValue,
    [category]: currentSelections,
  });

  // Emit selection change event
  emit("selectionChange", category, item, !isCurrentlySelected);
};

// Methods for ingredients (typing)
const addIngredient = (
  category: "ingredientsToPrefer" | "ingredientsToAvoid"
) => {
  const input = ingredientInputs.value[category].trim();

  if (!input) return;

  // Check if ingredient already exists
  const exists = props.modelValue[category].some(
    (ingredient) => ingredient.food.toLowerCase() === input.toLowerCase()
  );

  if (exists) {
    ingredientInputs.value[category] = "";
    return;
  }

  const newIngredient: FoodConstrain<string> = {
    food: input,
    isRequired: false,
  };

  const currentIngredients = [...props.modelValue[category], newIngredient];

  emit("update:modelValue", {
    ...props.modelValue,
    [category]: currentIngredients,
  });

  // Clear input
  ingredientInputs.value[category] = "";

  emit("selectionChange", category, input, true);
};

const removeIngredient = (
  category: "ingredientsToPrefer" | "ingredientsToAvoid",
  ingredient: FoodConstrain<string>
) => {
  const currentIngredients = props.modelValue[category].filter(
    (i) => i.food !== ingredient.food
  );

  emit("update:modelValue", {
    ...props.modelValue,
    [category]: currentIngredients,
  });

  emit("selectionChange", category, ingredient.food, false);
};

const toggleRequired = (
  category: "ingredientsToPrefer" | "ingredientsToAvoid",
  ingredient: FoodConstrain<string>
) => {
  const currentIngredients = props.modelValue[category].map((i) =>
    i.food === ingredient.food ? { ...i, isRequired: !i.isRequired } : i
  );

  emit("update:modelValue", {
    ...props.modelValue,
    [category]: currentIngredients,
  });
};

// Computed properties
const hasSelections = computed(() => {
  return Object.values(props.modelValue).some((arr) => arr.length > 0);
});

const clearAllSelections = () => {
  emit("update:modelValue", {
    foodAllergies: [],
    ingredientsToPrefer: [],
    ingredientsToAvoid: [],
  });
};

const clearCategory = (category: keyof FoodPreferencesForm) => {
  emit("update:modelValue", {
    ...props.modelValue,
    [category]: [],
  });
};

// Expose methods for parent component
defineExpose({
  clearAllSelections,
  clearCategory,
  hasSelections,
});
</script>

<style scoped>
.v-chip {
  transition: all 0.2s ease;
}

.v-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.cursor-pointer {
  cursor: pointer;
}
</style>
