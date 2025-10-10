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
          

          <h1 class="h3 mb-2">Household Outline</h1>
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
              <div class="d-flex justify-content-between align-items-center mb-2">
      
                <span v-if="member.isPrimary" class="badge bg-primary">Primary contact</span>
              </div>
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
                </div>
                <div class="col-lg-6">
                  <div class="mb-3">
                    <label class="form-label">Nutritional Goals & Preferences</label>
                    <textarea
                      class="form-control"
                      rows="3"
                      placeholder="Allergies, dislikes, health goals..."
                      :value="member.nutritionalNotes"
                      @input="updateMemberDraft(index, 'nutritionalNotes', ($event.target as HTMLTextAreaElement).value)"
                    ></textarea>
                    <div class="form-hint small">
                      Express any dietary likes or dislikes or health goals.
                    </div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label d-block">Dietary groups</label>
                    <div class="d-flex flex-wrap gap-3">
                      <div
                        v-for="option in dietaryGroupOptions"
                        :key="`diet-${index}-${option.value}`"
                        class="form-check form-check-inline"
                      >
                        <input
                          class="form-check-input"
                          type="checkbox"
                          :id="`diet-${index}-${option.value}`"
                          :checked="member.dietaryGroups.includes(option.value)"
                          @change="toggleDietaryGroup(index, option.value, ($event.target as HTMLInputElement).checked)"
                        />
                        <label class="form-check-label" :for="`diet-${index}-${option.value}`">
                          {{ option.label }}
                        </label>
                      </div>
                    </div>
                    <div class="form-hint small">Select all dietary patterns that apply.</div>
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
import type { AgeGroup, GenderOption, HouseholdMemberDraft } from "@/stores/householdWizardStore";
import { useHouseholdWizardStore } from "@/stores/householdWizardStore";

const wizardStore = useHouseholdWizardStore();
const router = useRouter();

const submissionError = ref<string | null>(null);

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

const dietaryGroupOptions: Array<{ value: string; label: string }> = [
  { value: "omnivore", label: "Omnivore" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "flexitarian", label: "Flexitarian" },
  { value: "keto", label: "Keto" },
  { value: "gluten_free", label: "Gluten free" },
  { value: "dairy_free", label: "Dairy free" },
];

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

function toggleDietaryGroup(index: number, group: string, checked: boolean) {
  const current = wizardStore.memberDrafts[index]?.dietaryGroups ?? [];
  const next = checked ? Array.from(new Set([...current, group])) : current.filter((g) => g !== group);
  wizardStore.updateMemberDraft(index, { dietaryGroups: next });
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
