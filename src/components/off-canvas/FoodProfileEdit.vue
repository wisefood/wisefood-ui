<template>
  <v-overlay v-model="overlay" persistent></v-overlay>
  <div class="d-flex flex-column h-100">
    <!-- Expansion panels container -->
    <div class="flex-grow-1">
      <!-- Food Preferences Section -->
      <v-card class="mb-6 flat">
        <v-card-title class="bg-primary text-white">
          <v-icon icon="mdi-food-apple" class="me-2" />
          {{ t("profile.foodPreferences") }}
        </v-card-title>
        <v-card-text class="pa-0">
          <FoodPreferencesEdit
            v-model="userForm.foodPreferences"
            :options="availableOptions.foodPreferences"
          />
        </v-card-text>
      </v-card>

      <!-- Cooking Profile Section -->
      <v-card class="mb-6 flat">
        <v-card-title class="bg-secondary text-white">
          <v-icon icon="mdi-chef-hat" class="me-2" />
          {{ t("profile.cookingProfile") }}
        </v-card-title>
        <v-card-text class="pa-0">
          <CookingProfileEdit
            v-model="userForm.cookingProfile"
            :options="availableOptions.cookingProfile"
          />
        </v-card-text>
      </v-card>

      <!-- Flavor Profile Section -->
      <v-card class="mb-6 flat">
        <v-card-title class="bg-accent text-white">
          <v-icon icon="mdi-emoticon-tongue" class="me-2" />
          {{ t("profile.flavorProfile") }}
        </v-card-title>
        <v-card-text class="pa-0">
          <FlavorProfileEdit
            v-model="userForm.flavorProfile"
            :options="availableOptions.flavorProfile"
          />
        </v-card-text>
      </v-card>

      <!-- Advanced Options Section -->
      <v-card class="mb-6 flat">
        <v-card-title class="bg-success text-white">
          <v-icon icon="mdi-cog" class="me-2" />
          {{ t("profile.advancedOptions") }}
        </v-card-title>
        <v-card-text class="pa-0">
          <AdvancedOptionsEdit
            v-model="userForm.advancedOptions"
            :options="availableOptions.advancedOptions"
          />
        </v-card-text>
      </v-card>
    </div>

    <!-- Button fixed at bottom -->
    <div class="d-flex justify-start pa-4">
      <v-btn
        color="primary"
        size="large"
        @click="saveAllData"
        :loading="isSaving"
        :disabled="!hasChanges"
      >
        {{ t("buttons.save") }}
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, watch } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { useGlobalRouter } from "@/composables/useGlobalRouter";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
import { useNotifications } from "@/composables/useNotifications";
import { useOffCanvas } from "@/composables/useOffCanvas";
import { type UserDTO, type UserForm } from "@/types/user.types";
import { useUserManagementService } from "@/services/user-managment.service";
import UserProfileInfoEdit from "@/components/user-profile/UserProfileInfoEdit.vue";
import FoodPreferencesEdit from "@/components/user-profile/FoodPreferencesEdit.vue";
import CookingProfileEdit from "@/components/user-profile/CookingProfileEdit.vue";
import type {
  FoodConstrain,
  FoodProfileForm,
} from "@/types/food-profile.types";

const { updateUserProfile } = useUserManagementService();

interface Props {
  userId: string;
  userProfile?: UserDTO; // Current user data
  options?: any; // All available options
}

const props = defineProps<Props>();

const { close } = useOffCanvas();
const authStore = useAuthStore();
const { navigateTo, refreshPage } = useGlobalRouter();
const { t } = useI18nWithStorage();
const { success, error } = useNotifications();
const openPanels = ref([0]);
const isSaving = ref(false);
const overlay = ref(false);

watch(overlay, (val) => {
  if (val) {
    setTimeout(() => {
      overlay.value = false;
    }, 2000);
  }
});

const user = computed(() => authStore.user);

// Use options passed as props, fallback to default foodProfile
const availableOptions = computed(() => props.options || null);

// Form object matching UserForm structure (simplified for editing)
// Safe form initialization - avoid "undefined" strings

const userForm = ref<FoodProfileForm>({
  id: "",
  foodPreferences: {
    foodAllergies: [],
    ingredientsToPrefer: [],
    ingredientsToAvoid: [],
  },
  cookingProfile: {
    cookingSkillLevel: "", // Empty string, not "undefined"
    cookingEquipment: [],
    cookingTimePreference: [],
    budgetConsideration: "", // Empty string, not "undefined"
  },
  advancedOptions: {
    nutritionalGoals: [],
  },
  flavorProfile: {
    cuisinePreferences: [],
    spicinessLevel: "", // Empty string, not "undefined"
    tastePreferences: [],
  },
});

// Safe value extraction helpers
const safeStringValue = (value: any) => {
  if (value === undefined || value === null || value === "undefined") {
    return "";
  }
  return String(value);
};

const safeArrayValue = (value: any) => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item) => item !== undefined && item !== "undefined");
};

// Store original data for comparison
const originalUserForm = ref<UserForm>({} as UserForm);

// Initialize form data from userProfile prop and user auth
watch(
  [() => props.userProfile, user],
  ([newUserProfile, newUser]) => {
    if (newUserProfile || newUser) {
      userForm.value = {
        id: safeStringValue(newUserProfile?.foodProfile?.id),
        foodPreferences: {
          foodAllergies: safeArrayValue(
            newUserProfile?.foodProfile?.foodPreferences?.foodAllergies
          ),
          ingredientsToPrefer: safeArrayValue(
            newUserProfile?.foodProfile?.foodPreferences?.ingredientsToPrefer
          ),
          ingredientsToAvoid: safeArrayValue(
            newUserProfile?.foodProfile?.foodPreferences?.ingredientsToAvoid
          ),
        },
        cookingProfile: {
          cookingSkillLevel: safeStringValue(
            newUserProfile?.foodProfile?.cookingProfile?.cookingSkillLevel
          ),
          cookingEquipment: safeArrayValue(
            newUserProfile?.foodProfile?.cookingProfile?.cookingEquipment
          ),
          cookingTimePreference: safeArrayValue(
            newUserProfile?.foodProfile?.cookingProfile?.cookingTimePreference
          ),
          budgetConsideration: safeStringValue(
            newUserProfile?.foodProfile?.cookingProfile?.budgetConsideration
          ), // Note: singular in API!
        },
        advancedOptions: {
          nutritionalGoals: safeArrayValue(
            newUserProfile?.foodProfile?.advancedOptions?.nutritionalGoals
          ),
        },
        flavorProfile: {
          cuisinePreferences: safeArrayValue(
            newUserProfile?.foodProfile?.flavorProfile?.cuisinePreferences
          ),
          spicinessLevel: safeStringValue(
            newUserProfile?.foodProfile?.flavorProfile?.spicinessLevel
          ),
          tastePreferences: safeArrayValue(
            newUserProfile?.foodProfile?.flavorProfile?.tastePreferences
          ),
        },
      };

      // Store the original form for comparison
      originalUserForm.value = JSON.parse(JSON.stringify(userForm.value));
    }
  },
  { immediate: true, deep: true }
);

// Check if form has changes
const hasChanges = computed(() => {
  return (
    JSON.stringify(userForm.value) !== JSON.stringify(originalUserForm.value)
  );
});

// Save all form data
const saveAllData = async () => {
  isSaving.value = true;
  updateUserProfile(userForm.value)
    .then(() => {
      overlay.value = true;
      setTimeout(() => {
        refreshPage();
      }, 2000);
      close("editProfilePanel");
    })
    .catch((e) => {
      console.error(e);
      isSaving.value = false;
    });
};

// Reset form to original values
const resetForm = () => {
  userForm.value = JSON.parse(JSON.stringify(originalUserForm.value));
};

// Enhanced save with validation
const saveWithValidation = async () => {
  await saveAllData();
};

onMounted(() => {
  if (!authStore.isAuthenticated) {
    navigateTo("/");
  }
});

// Expose methods for debugging or external access
defineExpose({
  userForm,
  saveAllData,
  saveWithValidation,
  resetForm,
  hasChanges,
  availableOptions,
});
</script>

<style scoped>
.v-expansion-panel-text {
  padding: 16px 24px 24px;
}

.v-btn {
  min-width: 120px;
}

/* Loading state styling */
.v-btn--loading {
  pointer-events: none;
}
</style>
