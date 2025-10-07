<template>
  <div>
    <!-- Cooking Skill Level - Single Selection -->
    <v-card-item>
      <v-card-subtitle class="text-subtitle-1 mb-2">
        {{ t("profile.cooking.skillLevel") }}
      </v-card-subtitle>
      <v-chip
        v-for="skill in availableOptions?.cookingSkillLevel || []"
        :key="skill"
        class="me-2 my-1"
        :color="isSkillSelected(skill) ? 'info' : 'grey-lighten-1'"
        :variant="isSkillSelected(skill) ? 'flat' : 'outlined'"
        clickable
        @click="setSkillLevel(skill)"
      >
        {{ formatText(skill) }}
      </v-chip>
    </v-card-item>

    <!-- Available Equipment - Multiple Selection -->
    <v-card-item>
      <v-card-subtitle class="text-subtitle-1 mb-2">
        {{ t("profile.cooking.availableEquipment") }}
      </v-card-subtitle>
      <v-chip
        v-for="equipment in availableOptions?.cookingEquipment || []"
        :key="equipment"
        class="me-2 my-1"
        :color="isEquipmentSelected(equipment) ? 'secondary' : 'grey-lighten-1'"
        :variant="isEquipmentSelected(equipment) ? 'flat' : 'outlined'"
        clickable
        @click="toggleEquipment(equipment)"
      >
        {{ formatText(equipment) }}
      </v-chip>
    </v-card-item>

    <!-- Time Preferences - Multiple Selection -->
    <v-card-item>
      <v-card-subtitle class="text-subtitle-1 mb-2">
        {{ t("profile.cooking.timePreferences") }}
      </v-card-subtitle>
      <v-chip
        v-for="timePreference in availableOptions?.cookingTimePreference || []"
        :key="timePreference"
        class="me-2 my-1"
        :color="isTimeSelected(timePreference) ? 'accent' : 'grey-lighten-1'"
        :variant="isTimeSelected(timePreference) ? 'flat' : 'outlined'"
        clickable
        @click="toggleTimePreference(timePreference)"
      >
        {{ formatText(timePreference) }}
      </v-chip>
    </v-card-item>

    <!-- Budget Considerations - Single Selection -->
    <v-card-item>
      <v-card-subtitle class="text-subtitle-1 mb-2">
        {{ t("profile.cooking.budgetConsiderations") }}
      </v-card-subtitle>
      <v-chip
        v-for="budget in availableOptions?.budgetConsiderations || []"
        :key="budget"
        class="me-2 my-1"
        :color="isBudgetSelected(budget) ? 'success' : 'grey-lighten-1'"
        :variant="isBudgetSelected(budget) ? 'flat' : 'outlined'"
        clickable
        @click="setBudgetLevel(budget)"
      >
        {{ formatText(budget) }}
      </v-chip>
    </v-card-item>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
import type { CookingProfileForm } from "@/types/food-profile.types";

const { t } = useI18nWithStorage();

// Props interface - Updated to handle null values properly
interface Props {
  modelValue: CookingProfileForm;
  options?: {
    cookingSkillLevel: string[];
    cookingEquipment: string[];
    cookingTimePreference: string[];
    budgetConsiderations: string[];
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: CookingProfileForm];
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

// Safe value checkers - handle null, undefined, and empty strings
const isSkillSelected = (skill: string): boolean => {
  const currentValue = props.modelValue.cookingSkillLevel;
  return currentValue != null && currentValue !== "" && currentValue === skill;
};

const isEquipmentSelected = (equipment: string): boolean => {
  return props.modelValue.cookingEquipment.includes(equipment);
};

const isTimeSelected = (time: string): boolean => {
  return props.modelValue.cookingTimePreference.includes(time);
};

const isBudgetSelected = (budget: string): boolean => {
  const currentValue = props.modelValue.budgetConsideration;
  return currentValue != null && currentValue !== "" && currentValue === budget;
};

// Methods for skill level (single selection) - emit empty string instead of undefined
const setSkillLevel = (skill: string) => {
  const newValue = isSkillSelected(skill) ? "" : skill;

  emit("update:modelValue", {
    ...props.modelValue,
    cookingSkillLevel: newValue,
  });

  emit("selectionChange", "cookingSkillLevel", skill, newValue !== "");
};

// Methods for equipment (multiple selection)
const toggleEquipment = (equipment: string) => {
  const isCurrentlySelected = isEquipmentSelected(equipment);
  let currentSelections = [...props.modelValue.cookingEquipment];

  if (isCurrentlySelected) {
    currentSelections = currentSelections.filter((item) => item !== equipment);
  } else {
    currentSelections.push(equipment);
  }

  emit("update:modelValue", {
    ...props.modelValue,
    cookingEquipment: currentSelections,
  });

  emit("selectionChange", "cookingEquipment", equipment, !isCurrentlySelected);
};

// Methods for time preferences (multiple selection)
const toggleTimePreference = (time: string) => {
  const isCurrentlySelected = isTimeSelected(time);
  let currentSelections = [...props.modelValue.cookingTimePreference];

  if (isCurrentlySelected) {
    currentSelections = currentSelections.filter((item) => item !== time);
  } else {
    currentSelections.push(time);
  }

  emit("update:modelValue", {
    ...props.modelValue,
    cookingTimePreference: currentSelections,
  });

  emit("selectionChange", "cookingTimePreference", time, !isCurrentlySelected);
};

// Methods for budget (single selection) - emit empty string instead of undefined
const setBudgetLevel = (budget: string) => {
  const newValue = isBudgetSelected(budget) ? "" : budget;

  emit("update:modelValue", {
    ...props.modelValue,
    budgetConsideration: newValue,
  });

  emit("selectionChange", "budgetConsideration", budget, newValue !== "");
};

// Computed properties - check for meaningful values
const hasSelections = computed(() => {
  return (
    (props.modelValue.cookingSkillLevel != null &&
      props.modelValue.cookingSkillLevel !== "") ||
    props.modelValue.cookingEquipment.length > 0 ||
    props.modelValue.cookingTimePreference.length > 0 ||
    (props.modelValue.budgetConsideration != null &&
      props.modelValue.budgetConsideration !== "")
  );
});

const clearAllSelections = () => {
  emit("update:modelValue", {
    cookingSkillLevel: "",
    cookingEquipment: [],
    cookingTimePreference: [],
    budgetConsideration: "",
  });
};

const clearCategory = (category: keyof CookingProfileForm) => {
  if (category === "cookingSkillLevel" || category === "budgetConsideration") {
    emit("update:modelValue", {
      ...props.modelValue,
      [category]: "",
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
  setSkillLevel,
  setBudgetLevel,
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
