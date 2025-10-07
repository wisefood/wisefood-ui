<template>
  <div>
    <!-- Nutritional Goals - Multiple Selection -->
    <v-card-item>
      <v-card-subtitle class="text-subtitle-1 mb-2 d-flex align-center">
        <v-icon icon="mdi-heart-pulse" size="small" class="me-2" />
        {{ t("profile.advanced.nutritionalGoals") }}
      </v-card-subtitle>
      <v-chip
        v-for="goal in availableOptions?.nutritionalGoals || []"
        :key="goal"
        class="me-2 my-1"
        :color="isNutritionalGoalSelected(goal) ? 'success' : 'grey-lighten-1'"
        :variant="isNutritionalGoalSelected(goal) ? 'flat' : 'outlined'"
        clickable
        @click="toggleNutritionalGoal(goal)"
      >
        <v-icon icon="mdi-target" start size="x-small" />
        {{ formatText(goal) }}
      </v-chip>

      <v-card-text
        v-if="!availableOptions?.nutritionalGoals?.length"
        class="text-center text-medium-emphasis pa-4"
      >
        {{ t("common.noDataAvailable") }}
      </v-card-text>
    </v-card-item>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
import type { AdvancedOptionsForm } from "@/types/food-profile.types";

const { t } = useI18nWithStorage();

// Props interface - Updated to match your AdvancedOptions interface
interface Props {
  modelValue: AdvancedOptionsForm;
  options?: {
    nutritionalGoals: string[];
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: AdvancedOptionsForm];
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

// Selection check methods
const isNutritionalGoalSelected = (goal: string): boolean => {
  return props.modelValue.nutritionalGoals.includes(goal);
};

// Methods for nutritional goals (multiple selection)
const toggleNutritionalGoal = (goal: string) => {
  const isCurrentlySelected = isNutritionalGoalSelected(goal);
  let currentSelections = [...props.modelValue.nutritionalGoals];

  if (isCurrentlySelected) {
    currentSelections = currentSelections.filter((item) => item !== goal);
  } else {
    currentSelections.push(goal);
  }

  emit("update:modelValue", {
    ...props.modelValue,
    nutritionalGoals: currentSelections,
  });

  emit("selectionChange", "nutritionalGoals", goal, !isCurrentlySelected);
};

// Computed properties
const hasSelections = computed(() => {
  return props.modelValue.nutritionalGoals.length > 0;
});

const clearAllSelections = () => {
  emit("update:modelValue", {
    nutritionalGoals: [],
  });
};

const clearCategory = () => {
  emit("update:modelValue", {
    ...props.modelValue,
    nutritionalGoals: [],
  });
};

const addNutritionalGoal = (goal: string) => {
  if (!props.modelValue.nutritionalGoals.includes(goal)) {
    const currentSelections = [...props.modelValue.nutritionalGoals, goal];
    emit("update:modelValue", {
      ...props.modelValue,
      nutritionalGoals: currentSelections,
    });
    emit("selectionChange", "nutritionalGoals", goal, true);
  }
};

const removeNutritionalGoal = (goal: string) => {
  const currentSelections = props.modelValue.nutritionalGoals.filter(
    (i) => i !== goal
  );
  emit("update:modelValue", {
    ...props.modelValue,
    nutritionalGoals: currentSelections,
  });
  emit("selectionChange", "nutritionalGoals", goal, false);
};

// Expose methods for parent component
defineExpose({
  clearAllSelections,
  clearCategory,
  addNutritionalGoal,
  removeNutritionalGoal,
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
