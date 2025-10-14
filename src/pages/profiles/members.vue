<template>
  <div class="page page-center">
    <div class="container py-4">
      <div class="text-center mb-4">
        <a href=".">
          <img src="/images/logo.png" width="160" alt="" />
        </a>
      </div>

      <div class="card card-md">
        <div class="card-body p-sm-5">
          <h2 class="mb-2">Household Outline</h2>
          <p class="text-secondary mb-4">
            Tell us about the primary member of <strong>{{ wizardStore.householdName || "your household" }}</strong>.
          </p>

          <div v-if="!wizardStore.householdId" class="alert alert-warning" role="alert">
            We couldn't find a household in progress. Please start from the first step.
          </div>

          <template v-else>
            <div v-if="submissionError" class="alert alert-danger" role="alert">
              {{ submissionError }}
            </div>

            <div
              v-for="(member, index) in wizardStore.memberDrafts"
              :key="index"
              class="mb-3"
            >
              <div class="row">
                <div class="col-lg-6">
                <div class="mb-3">
                  <label class="form-label">Name</label>
                  <input
                    type="text"
                    class="form-control"
                    :value="member.name"
                    @input="updateMemberDraft(index, 'name', ($event.target as HTMLInputElement).value)"
                  />
                </div>

                <div class="mb-3">
                  <label class="form-label">Gender</label>
                  <select
                    class="form-select"
                    :value="member.gender"
                    @change="updateMemberDraft(index, 'gender', ($event.target as HTMLSelectElement).value as GenderOption)"
                  >
                    <option v-for="option in genderOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </div>

                <div class="mb-3">
                  <label class="form-label">Age group</label>
                  <select
                    class="form-select"
                    :value="member.ageGroup"
                    @change="updateMemberDraft(index, 'ageGroup', ($event.target as HTMLSelectElement).value as AgeGroup)"
                  >
                    <option v-for="option in ageGroupOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">General Goals & Preferences</label>
                    <textarea
                      class="form-control"
                      rows="3"
                      placeholder="Allergies, dislikes, health goals..."
                      :value="member.nutritionalNotes"
                      @input="updateMemberDraft(index, 'nutritionalNotes', ($event.target as HTMLTextAreaElement).value)"
                    ></textarea>
                    <div class="form-hint small">
                      Express any goals or preferences in your own words.
                    </div>
                  </div>
                </div>
                <div class="col-lg-6">
                  <div class="mb-3">
                    <label class="form-label d-block">Dietary groups</label>
                    <div class="d-flex flex-wrap gap-2">
                      <button
                        v-for="option in dietaryGroupOptions"
                        :key="`diet-${index}-${option.value}`"
                        type="button"
                        :class="groupButtonClass(member, option.value)"
                        :aria-pressed="member.dietaryGroups.includes(option.value)"
                        @click="toggleDietaryGroup(index, option.value)"
                      >
                        {{ option.label }}
                      </button>
                    </div>
                    <div v-if="conflictWarnings[index]" class="text-warning small mt-2">
                      {{ conflictWarnings[index] }}
                    </div>
                    <template v-for="option in dietaryGroupOptions" :key="`diet-panel-${index}-${option.value}`">
                      <div
                        v-if="member.dietaryGroups.includes(option.value)"
                        class="mt-3 p-3 border rounded dietary-group-panel"
                      >
                        <div class="d-flex justify-content-between align-items-center mb-2">
                          <span class="fw-semibold">{{ option.label }} focus foods</span>
                          <small class="text-secondary">Tap to set preference</small>
                        </div>
                        <div class="d-flex flex-wrap gap-2">
                          <div
                            v-for="food in availableFoods(member, option.value)"
                            :key="`food-${index}-${option.value}-${food}`"
                            class="food-toggle"
                          >
                            <button
                              type="button"
                              :class="foodButtonClass(member, option.value, food)"
                              :aria-label="foodPreferenceAriaLabel(foodPreference(member, option.value, food), food)"
                              @click="cycleFoodPreference(index, option.value, food)"
                            >
                              {{ food }}
                            </button>
                            <button
                              v-if="isCustomFood(member, option.value, food)"
                              type="button"
                              class="btn btn-link btn-sm text-danger px-1 ms-1"
                              @click="removeCustomFood(index, option.value, food)"
                              aria-label="Remove custom ingredient"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        <div class="mt-3">
                          <label class="form-label small mb-1">Add ingredient</label>
                          <div class="input-group input-group-sm">
                            <input
                              type="text"
                              class="form-control"
                              :placeholder="`Add ${option.label.toLowerCase()} ingredient`"
                              :value="getCustomFoodDraft(customFoodKey(index, option.value))"
                              @input="setCustomFoodDraft(customFoodKey(index, option.value), ($event.target as HTMLInputElement).value)"
                              @keyup.enter="addCustomFood(index, option.value)"
                            />
                            <button
                              type="button"
                              class="btn btn-outline-primary"
                              @click="addCustomFood(index, option.value)"
                            >
                              Add
                            </button>
                          </div>
                          <div
                            v-if="customFoodErrors[customFoodKey(index, option.value)]"
                            class="text-danger small mt-1"
                          >
                            {{ customFoodErrors[customFoodKey(index, option.value)] }}
                          </div>
                          <div class="form-hint small">
                            Include other foods to personalize this dietary group.
                          </div>
                        </div>
                      </div>
                    </template>
                    <div class="form-hint small mt-2">
                      Select dietary patterns, then set ingredient preferences.
                    </div>
                </div>
                </div>
              </div>
            </div>
            

          </template>
        </div>

        <div class="card-footer d-flex justify-content-between align-items-center">
          <button type="button" class="btn btn-link" @click="goBack">
            ← Back
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!wizardStore.householdId || !canSubmitMembers || wizardStore.creatingMembers"
            @click="goNext"
          >
            <span
              v-if="wizardStore.creatingMembers"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Continue
          </button>
        </div>
      </div>
       <div class="row align-items-center mt-3">
        <div class="col-12 col-md-5 col-lg-2">
              <div class="progress progress-1">
                <div
                  class="progress-bar"
                  :style="{ width: `${progressPercent}%` }"
                  role="progressbar"
                  :aria-valuenow="progressPercent"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  :aria-label="`Progress ${progressPercent}%`"
                >
                  <span class="visually-hidden">Progress {{ progressPercent }}%</span>
                </div>
              </div>
            </div>
            <div class="text-secondary small mt-1">
              Step {{ wizardStore.currentStep }} of {{ wizardStore.totalSteps }}
            </div>
        </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import type {
  AgeGroup,
  GenderOption,
  HouseholdMemberDraft,
  DietaryPreferenceLevel,
} from "@/stores/householdWizardStore";
import { useHouseholdWizardStore } from "@/stores/householdWizardStore";

type DietaryGroupOption = {
  value: string;
  label: string;
  foods: string[];
  incompatibleWith?: string[];
};

const wizardStore = useHouseholdWizardStore();
const router = useRouter();

const submissionError = ref<string | null>(null);
const conflictWarnings = ref<Record<number, string | null>>({});
const customFoodDrafts = ref<Record<string, string>>({});
const customFoodErrors = ref<Record<string, string | null>>({});

onMounted(() => {
  if (!wizardStore.householdId) {
    //router.replace({ name: "profile" });
  } else {
    wizardStore.setTotalSteps(2);
    wizardStore.setCurrentStep(2);
  }
});

const progressPercent = computed(() => wizardStore.progressPercent);

const canSubmitMembers = computed(() => {
  const trimmedNames = wizardStore.memberDrafts.map((member) => member.name.trim());
  return trimmedNames.length > 0 && trimmedNames.every((name) => name.length > 0);
});

const genderOptions: Array<{ value: GenderOption; label: string }> = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const ageGroupOptions: Array<{ value: AgeGroup; label: string }> = [
  { value: "baby", label: "0-3 · Baby" },
  { value: "child", label: "4-12 · Child" },
  { value: "teen", label: "13-17 · Teen" },
  { value: "young_adult", label: "18-24 · Young adult" },
  { value: "adult", label: "25-34 · Adult" },
  { value: "middle_aged", label: "35-64 · Middle aged" },
  { value: "senio", label: "65+ · Senior" },
];

const dietaryGroupOptions: DietaryGroupOption[] = [
  {
    value: "omnivore",
    label: "Omnivore",
    foods: ["Chicken", "Beef", "Eggs", "Cheese", "Whole grains"],
    incompatibleWith: ["vegan"],
  },
  {
    value: "vegetarian",
    label: "Vegetarian",
    foods: ["Paneer", "Eggs", "Lentils", "Leafy greens", "Tofu"],
    incompatibleWith: ["omnivore", "pescatarian"],
  },
  {
    value: "vegan",
    label: "Vegan",
    foods: ["Tofu", "Chickpeas", "Quinoa", "Tempeh", "Leafy greens"],
    incompatibleWith: ["omnivore", "pescatarian", "flexitarian"],
  },
  {
    value: "pescatarian",
    label: "Pescatarian",
    foods: ["Salmon", "Cod", "Shrimp", "Seaweed", "Eggs"],
    incompatibleWith: ["vegan", "vegetarian"],
  },
  {
    value: "flexitarian",
    label: "Flexitarian",
    foods: ["Beans", "Whole grains", "Seasonal veg", "Fish", "Chicken"],
    incompatibleWith: ["vegan"],
  },
  {
    value: "keto",
    label: "Keto",
    foods: ["Avocado", "Salmon", "Eggs", "Cheese", "Leafy greens"],
  },
  {
    value: "gluten_free",
    label: "Gluten free",
    foods: ["Rice", "Quinoa", "Sweet potato", "Corn", "Almond flour"],
  },
  {
    value: "dairy_free",
    label: "Dairy free",
    foods: ["Almond milk", "Coconut yogurt", "Tofu", "Beans", "Leafy greens"],
  },
];

const defaultFoodsByGroup = dietaryGroupOptions.reduce<Record<string, string[]>>((acc, option) => {
  acc[option.value] = option.foods;
  return acc;
}, {});

const dietaryGroupConflicts = dietaryGroupOptions.reduce<Record<string, Set<string>>>((acc, option) => {
  if (!acc[option.value]) {
    acc[option.value] = new Set<string>();
  }
  option.incompatibleWith?.forEach((conflict) => {
    acc[option.value].add(conflict);
    if (!acc[conflict]) {
      acc[conflict] = new Set<string>();
    }
    acc[conflict].add(option.value);
  });
  return acc;
}, {});

const preferenceOrder: DietaryPreferenceLevel[] = ["off", "like", "neutral", "avoid"];
const preferenceLabels: Record<DietaryPreferenceLevel, string> = {
  off: "No preference",
  like: "Like",
  neutral: "Neutral",
  avoid: "Avoid",
};

function setConflictWarning(index: number, message: string | null) {
  conflictWarnings.value = { ...conflictWarnings.value, [index]: message };
}

function customFoodKey(index: number, group: string) {
  return `${index}:${group}`;
}

function getCustomFoodDraft(key: string) {
  return customFoodDrafts.value[key] ?? "";
}

function setCustomFoodDraft(key: string, value: string) {
  customFoodDrafts.value = { ...customFoodDrafts.value, [key]: value };
  if (customFoodErrors.value[key]) {
    customFoodErrors.value = { ...customFoodErrors.value, [key]: null };
  }
}

function setCustomFoodError(key: string, message: string | null) {
  customFoodErrors.value = { ...customFoodErrors.value, [key]: message };
}

function getGroupLabel(group: string) {
  return dietaryGroupOptions.find((option) => option.value === group)?.label ?? group;
}

function findConflictingGroups(group: string, selected: string[]) {
  const conflicts = dietaryGroupConflicts[group];
  if (!conflicts) return [];
  return selected.filter((value) => conflicts.has(value));
}

function ensureGroupPreferences(
  existing: Record<string, DietaryPreferenceLevel> | undefined,
  defaults: string[]
): Record<string, DietaryPreferenceLevel> {
  const base: Record<string, DietaryPreferenceLevel> = existing ? { ...existing } : {};
  defaults.forEach((food) => {
    if (!base[food]) {
      base[food] = "off";
    }
  });
  return base;
}

function updateMemberDraft(
  index: number,
  field: keyof Omit<HouseholdMemberDraft, "id" | "isPrimary">,
  value: string | AgeGroup | GenderOption
) {
  const payload: Partial<Omit<HouseholdMemberDraft, "id" | "isPrimary">> = {
    [field]: value,
  } as Partial<Omit<HouseholdMemberDraft, "id" | "isPrimary">>;
  wizardStore.updateMemberDraft(index, payload);
}

function toggleDietaryGroup(index: number, group: string) {
  const member = wizardStore.memberDrafts[index];
  if (!member) return;

  const selected = member.dietaryGroups ?? [];
  if (selected.includes(group)) {
    const nextGroups = selected.filter((g) => g !== group);
    const { [group]: _omitPref, ...restPreferences } = member.dietaryPreferences;
    const { [group]: _omitFoods, ...restCustomFoods } = member.customDietaryFoods;
    wizardStore.updateMemberDraft(index, {
      dietaryGroups: nextGroups,
      dietaryPreferences: restPreferences,
      customDietaryFoods: restCustomFoods,
    });
    setConflictWarning(index, null);
    return;
  }

  const conflicts = findConflictingGroups(group, selected);
  if (conflicts.length) {
    setConflictWarning(
      index,
      `${getGroupLabel(group)} conflicts with ${conflicts.map(getGroupLabel).join(", ")}. Deselect the conflicting group first.`
    );
    return;
  }

  const defaults = defaultFoodsByGroup[group] ?? [];
  const nextPreferences = {
    ...member.dietaryPreferences,
    [group]: ensureGroupPreferences(member.dietaryPreferences[group], defaults),
  };
  const nextCustomFoods = {
    ...member.customDietaryFoods,
    [group]: member.customDietaryFoods[group] ? [...member.customDietaryFoods[group]] : [],
  };

  wizardStore.updateMemberDraft(index, {
    dietaryGroups: [...selected, group],
    dietaryPreferences: nextPreferences,
    customDietaryFoods: nextCustomFoods,
  });
  setConflictWarning(index, null);
}

function groupButtonClass(member: HouseholdMemberDraft, group: string) {
  const isActive = member.dietaryGroups.includes(group);
  return ["btn", "btn-sm", "dietary-group-toggle", isActive ? "btn-primary" : "btn-outline-primary"];
}

function availableFoods(member: HouseholdMemberDraft, group: string) {
  const defaults = defaultFoodsByGroup[group] ?? [];
  const custom = member.customDietaryFoods[group] ?? [];
  const seen = new Set<string>();
  const combined: string[] = [];

  [...defaults, ...custom].forEach((food) => {
    if (!seen.has(food)) {
      seen.add(food);
      combined.push(food);
    }
  });

  return combined;
}

function isCustomFood(member: HouseholdMemberDraft, group: string, food: string) {
  return (member.customDietaryFoods[group] ?? []).includes(food);
}

function foodPreference(member: HouseholdMemberDraft, group: string, food: string): DietaryPreferenceLevel {
  return member.dietaryPreferences[group]?.[food] ?? "off";
}

function nextPreference(current: DietaryPreferenceLevel): DietaryPreferenceLevel {
  const index = preferenceOrder.indexOf(current);
  const nextIndex = index >= 0 ? (index + 1) % preferenceOrder.length : 0;
  return preferenceOrder[nextIndex];
}

function foodPreferenceAriaLabel(level: DietaryPreferenceLevel, food: string) {
  return `${food}: ${preferenceLabels[level]}`;
}

function foodButtonClass(member: HouseholdMemberDraft, group: string, food: string) {
  const level = foodPreference(member, group, food);
  const base = ["btn", "btn-sm", "preference-toggle"];

  switch (level) {
    case "like":
      return [...base, "btn-success"];
    case "neutral":
      return [...base, "btn-warning"];
    case "avoid":
      return [...base, "btn-danger"];
    default:
      return [...base, "btn-outline-secondary"];
  }
}

function cycleFoodPreference(index: number, group: string, food: string) {
  const member = wizardStore.memberDrafts[index];
  if (!member || !member.dietaryGroups.includes(group)) return;

  const defaults = defaultFoodsByGroup[group] ?? [];
  const updatedGroupPrefs = ensureGroupPreferences(member.dietaryPreferences[group], defaults);
  const current = updatedGroupPrefs[food] ?? "off";
  updatedGroupPrefs[food] = nextPreference(current);

  wizardStore.updateMemberDraft(index, {
    dietaryPreferences: {
      ...member.dietaryPreferences,
      [group]: updatedGroupPrefs,
    },
  });
}

function addCustomFood(index: number, group: string) {
  const member = wizardStore.memberDrafts[index];
  if (!member || !member.dietaryGroups.includes(group)) return;

  const key = customFoodKey(index, group);
  const rawValue = getCustomFoodDraft(key).trim();
  if (!rawValue) {
    setCustomFoodError(key, "Enter an ingredient name.");
    return;
  }

  const existingFoods = availableFoods(member, group).map((food) => food.toLowerCase());
  if (existingFoods.includes(rawValue.toLowerCase())) {
    setCustomFoodError(key, `"${rawValue}" is already listed.`);
    return;
  }

  const normalized = rawValue.charAt(0).toUpperCase() + rawValue.slice(1);
  const defaults = defaultFoodsByGroup[group] ?? [];
  const updatedGroupPrefs = ensureGroupPreferences(member.dietaryPreferences[group], defaults);
  updatedGroupPrefs[normalized] = member.dietaryPreferences[group]?.[normalized] ?? "off";

  const updatedCustomFoods = {
    ...member.customDietaryFoods,
    [group]: [...(member.customDietaryFoods[group] ?? []), normalized],
  };

  wizardStore.updateMemberDraft(index, {
    dietaryPreferences: {
      ...member.dietaryPreferences,
      [group]: updatedGroupPrefs,
    },
    customDietaryFoods: updatedCustomFoods,
  });

  setCustomFoodDraft(key, "");
  setCustomFoodError(key, null);
}

function removeCustomFood(index: number, group: string, food: string) {
  const member = wizardStore.memberDrafts[index];
  if (!member) return;

  const existingCustomFoods = member.customDietaryFoods[group] ?? [];
  const nextCustomFoods = existingCustomFoods.filter((item) => item !== food);

  const updatedCustomFoods = { ...member.customDietaryFoods };
  if (nextCustomFoods.length) {
    updatedCustomFoods[group] = nextCustomFoods;
  } else {
    delete updatedCustomFoods[group];
  }

  const updatedGroupPrefs = { ...(member.dietaryPreferences[group] ?? {}) };
  delete updatedGroupPrefs[food];

  const updatedPreferences = { ...member.dietaryPreferences };
  if (Object.keys(updatedGroupPrefs).length) {
    updatedPreferences[group] = updatedGroupPrefs;
  } else {
    delete updatedPreferences[group];
  }

  wizardStore.updateMemberDraft(index, {
    dietaryPreferences: updatedPreferences,
    customDietaryFoods: updatedCustomFoods,
  });
}

function goBack() {
  wizardStore.goBack();
  router.push({ name: "profile" });
}

async function goNext() {
  submissionError.value = null;
  try {
    await wizardStore.submitMembers();
    wizardStore.advanceStep();
    wizardStore.markCompleted();
    await router.push({ name: "dashboard" });
  } catch (error) {
    if (error instanceof Error) {
      submissionError.value = error.message;
    } else {
      submissionError.value = "Failed to save household members.";
    }
  }
}

definePage({
  name: "profile-members",
  meta: {
    layout: "intermediate",
    titleKey: "pages.profiles.members.title",
    descriptionKey: "pages.profiles.members.description",
  },
});
</script>

<style scoped>
.dietary-group-toggle {
  min-width: 7rem;
}

.dietary-group-panel {
  background-color: #f8f9fa;
}

.food-toggle {
  display: flex;
  align-items: center;
}

.food-toggle .preference-toggle {
  min-width: 6rem;
}

.food-toggle .btn-link {
  line-height: 1;
}
</style>
