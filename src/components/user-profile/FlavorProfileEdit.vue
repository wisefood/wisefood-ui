<template>
  <div>
    <!-- Cuisine Preferences - Multiple Selection -->
    <v-card-item>
      <v-card-subtitle class="text-subtitle-1 mb-2 d-flex align-center">
        <v-icon icon="mdi-earth" size="small" class="me-2" />
        {{ t("profile.flavor.cuisinePreferences") }}
      </v-card-subtitle>
      <v-chip
        v-for="cuisine in availableOptions?.cuisinePreferences || []"
        :key="cuisine"
        class="me-2 my-1"
        :color="isCuisineSelected(cuisine) ? 'primary' : 'grey-lighten-1'"
        :variant="isCuisineSelected(cuisine) ? 'flat' : 'outlined'"
        clickable
        @click="toggleCuisine(cuisine)"
      >
        <v-icon icon="mdi-silverware-fork-knife" start size="x-small" />
        {{ formatText(cuisine) }}
      </v-chip>
    </v-card-item>

    <!-- Spiciness Level - Single Selection -->
    <v-card-item>
      <v-card-subtitle class="text-subtitle-1 mb-2 d-flex align-center">
        <v-icon icon="mdi-chili-hot" size="small" class="me-2" />
        {{ t("profile.flavor.spicinessLevel") }}
      </v-card-subtitle>
      <v-chip
        v-for="spiciness in availableOptions?.spicinessLevel || []"
        :key="spiciness"
        class="me-2 my-1"
        :color="isSpicinessSelected(spiciness) ? 'error' : 'grey-lighten-1'"
        :variant="isSpicinessSelected(spiciness) ? 'flat' : 'outlined'"
        clickable
        @click="setSpicinessLevel(spiciness)"
      >
        <v-icon icon="mdi-fire" start size="x-small" />
        {{ formatText(spiciness) }}
      </v-chip>
    </v-card-item>

    <!-- Taste Preferences - Multiple Selection -->
    <v-card-item>
      <v-card-subtitle class="text-subtitle-1 mb-2 d-flex align-center">
        <v-icon icon="mdi-emoticon-tongue" size="small" class="me-2" />
        {{ t("profile.flavor.tastePreferences") }}
      </v-card-subtitle>
      <v-chip
        v-for="taste in availableOptions?.tastePreferences || []"
        :key="taste"
        class="me-2 my-1"
        :color="isTasteSelected(taste) ? 'secondary' : 'grey-lighten-1'"
        :variant="isTasteSelected(taste) ? 'flat' : 'outlined'"
        clickable
        @click="toggleTaste(taste)"
      >
        <v-icon :icon="getTasteIcon(taste)" start size="x-small" />
        {{ formatText(taste) }}
      </v-chip>
    </v-card-item>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";

const { t } = useI18nWithStorage();

// Interface for the form data structure
interface FlavorProfileForm {
  cuisinePreferences: string[];
  spicinessLevel: string;
  tastePreferences: string[];
}

// Props interface
interface Props {
  modelValue: FlavorProfileForm;
  options?: {
    cuisinePreferences: string[];
    spicinessLevel: string[];
    tastePreferences: string[];
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: FlavorProfileForm];
  selectionChange: [category: string, item: string, selected: boolean];
}>();

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

// Selection check methods - handle null/empty values properly
const isCuisineSelected = (cuisine: string): boolean => {
  return props.modelValue.cuisinePreferences.includes(cuisine);
};

const isSpicinessSelected = (spiciness: string): boolean => {
  const currentValue = props.modelValue.spicinessLevel;
  return (
    currentValue != null && currentValue !== "" && currentValue === spiciness
  );
};

const isTasteSelected = (taste: string): boolean => {
  return props.modelValue.tastePreferences.includes(taste);
};

// Methods for cuisine preferences (multiple selection)
const toggleCuisine = (cuisine: string) => {
  const isCurrentlySelected = isCuisineSelected(cuisine);
  let currentSelections = [...props.modelValue.cuisinePreferences];

  if (isCurrentlySelected) {
    currentSelections = currentSelections.filter((item) => item !== cuisine);
  } else {
    currentSelections.push(cuisine);
  }

  emit("update:modelValue", {
    ...props.modelValue,
    cuisinePreferences: currentSelections,
  });

  emit("selectionChange", "cuisinePreferences", cuisine, !isCurrentlySelected);
};

// Methods for spiciness level (single selection) - emit empty string instead of undefined
const setSpicinessLevel = (spiciness: string) => {
  const newValue = isSpicinessSelected(spiciness) ? "" : spiciness;

  emit("update:modelValue", {
    ...props.modelValue,
    spicinessLevel: newValue,
  });

  emit("selectionChange", "spicinessLevel", spiciness, newValue !== "");
};

// Methods for taste preferences (multiple selection)
const toggleTaste = (taste: string) => {
  const isCurrentlySelected = isTasteSelected(taste);
  let currentSelections = [...props.modelValue.tastePreferences];

  if (isCurrentlySelected) {
    currentSelections = currentSelections.filter((item) => item !== taste);
  } else {
    currentSelections.push(taste);
  }

  emit("update:modelValue", {
    ...props.modelValue,
    tastePreferences: currentSelections,
  });

  emit("selectionChange", "tastePreferences", taste, !isCurrentlySelected);
};

// Helper function for taste icons
const getTasteIcon = (taste: string): string => {
  const tasteString = taste.toLowerCase();

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

// Computed properties - check for meaningful values
const hasSelections = computed(() => {
  return (
    props.modelValue.cuisinePreferences.length > 0 ||
    (props.modelValue.spicinessLevel != null &&
      props.modelValue.spicinessLevel !== "") ||
    props.modelValue.tastePreferences.length > 0
  );
});

// Updated clearAllSelections to use empty strings
const clearAllSelections = () => {
  emit("update:modelValue", {
    cuisinePreferences: [],
    spicinessLevel: "", // Empty string instead of null
    tastePreferences: [],
  });
};

const clearCategory = (category: keyof FlavorProfileForm) => {
  if (category === "spicinessLevel") {
    emit("update:modelValue", {
      ...props.modelValue,
      [category]: "", // Empty string instead of null
    });
  } else {
    emit("update:modelValue", {
      ...props.modelValue,
      [category]: [],
    });
  }
};

// Expose methods for parent component
defineExpose({
  clearAllSelections,
  clearCategory,
  setSpicinessLevel,
  hasSelections,
});
</script>

<style scoped>
.v-chip {
  cursor: pointer;
  transition: all 0.2s ease;
}

.v-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
