<template>
  <v-overlay v-model="overlay" persistent></v-overlay>

  <v-sheet class="mx-auto d-flex flex-column h-100" flat>
    <div class="flex-grow-1 pa-4">
      <v-text-field
        clearable
        :label="t('profile.form.firstName')"
        :rules="firstNameRules"
        prepend-icon="mdi-account"
        v-model="localForm.firstName"
        variant="outlined"
        density="comfortable"
        class="my-3"
      ></v-text-field>

      <v-text-field
        clearable
        :label="t('profile.form.lastName')"
        :rules="lastNameRules"
        prepend-icon="mdi-account"
        v-model="localForm.lastName"
        variant="outlined"
        density="comfortable"
        class="mb-3"
      ></v-text-field>

      <v-text-field
        :label="t('profile.form.email')"
        prepend-icon="mdi-email"
        v-model="localForm.email"
        variant="outlined"
        density="comfortable"
        readonly
        class="mb-3"
        :hint="t('profile.form.readOnlyField')"
        persistent-hint
      ></v-text-field>

      <v-text-field
        :label="t('profile.form.birthDate')"
        :rules="birthDateRules"
        prepend-icon="mdi-calendar"
        v-model="localForm.birthDate"
        type="date"
        variant="outlined"
        density="comfortable"
        class="mb-3"
      ></v-text-field>

      <v-text-field
        :label="t('profile.form.userId')"
        prepend-icon="mdi-identifier"
        v-model="localForm.userId"
        variant="outlined"
        density="comfortable"
        readonly
        class="mb-3"
        :hint="t('profile.form.readOnlyField')"
        persistent-hint
      ></v-text-field>
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

    <!-- Snackbar for feedback -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      :timeout="3000"
      location="bottom"
    >
      {{ snackbarMessage }}
      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="showSnackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-sheet>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
import type { UserForm } from "@/types/user.types";
import { useUserManagementService } from "@/services/user-managment.service";
import { useNotifications } from "@/composables/useNotifications";
import { useGlobalRouter } from "@/composables/useGlobalRouter";

const { refreshPage } = useGlobalRouter();

const { success, error } = useNotifications();
const overlay = ref(false);

watch(overlay, (val) => {
  if (val) {
    setTimeout(() => {
      overlay.value = false;
    }, 2000);
  }
});
const { t } = useI18nWithStorage();
const { getUserProfile, updateUserInfo } = useUserManagementService();

// Create local reactive form
const userFormData = ref<UserForm>({
  firstName: "",
  lastName: "",
  email: "",
  birthDate: "",
  userId: "",
  id: "",
});

// Original form data for comparison
const originalFormData = ref<UserForm>({
  firstName: "",
  lastName: "",
  email: "",
  birthDate: "",
  userId: "",
  id: "",
});

// Loading and feedback states
const isSaving = ref(false);
const showSnackbar = ref(false);
const snackbarMessage = ref("");
const snackbarColor = ref("success");

const localForm = computed({
  get: () => userFormData.value,
  set: (value: UserForm) => {
    userFormData.value = { ...value };
  },
});

// Check if form has changes
const hasChanges = computed(() => {
  return (
    JSON.stringify(userFormData.value) !==
    JSON.stringify(originalFormData.value)
  );
});

// Validation rules
const firstNameRules = computed(() => [
  (v: string) => !!v?.trim() || t("profile.validation.fieldRequired"),
  (v: string) =>
    (v && v.length >= 2) || t("profile.validation.minLength", { length: 2 }),
  (v: string) =>
    (v && v.length <= 50) || t("profile.validation.maxLength", { length: 50 }),
]);

const lastNameRules = computed(() => [
  (v: string) => !!v?.trim() || t("profile.validation.fieldRequired"),
  (v: string) =>
    (v && v.length >= 2) || t("profile.validation.minLength", { length: 2 }),
  (v: string) =>
    (v && v.length <= 50) || t("profile.validation.maxLength", { length: 50 }),
]);

const birthDateRules = computed(() => [
  (v: string) => {
    if (!v) return t("profile.validation.birthDateRequired");

    const date = new Date(v);
    const today = new Date();
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 120); // 120 years ago

    if (date > today) {
      return t("profile.validation.futureDateError");
    }

    if (date < minDate) {
      return t("profile.validation.invalidDate");
    }

    return true;
  },
]);

// Helper method to validate the entire form
const validateForm = (): boolean => {
  const firstNameValid = firstNameRules.value.every(
    (rule) => rule(localForm.value.firstName) === true
  );
  const lastNameValid = lastNameRules.value.every(
    (rule) => rule(localForm.value.lastName) === true
  );
  const birthDateValid = birthDateRules.value.every(
    (rule) => rule(localForm.value.birthDate) === true
  );

  return firstNameValid && lastNameValid && birthDateValid;
};

// Save function
const saveAllData = async () => {
  isSaving.value = true;

  updateUserInfo(localForm.value)
    .then(() => {
      // Success only
      originalFormData.value = { ...localForm.value };
      console.log("GTXS");
      setTimeout(() => {
        refreshPage();
      }, 2000);

      isSaving.value = false; // Move this here too
    })
    .catch((err) => {
      console.error("Failed to save user profile:", err);
      isSaving.value = false;

      // Don't call refreshPage() here!
    });
};

// Load user profile on mount
onMounted(async () => {
  try {
    const profile = await getUserProfile();
    localForm.value = profile;
    originalFormData.value = { ...profile }; // Store original for comparison
  } catch (error) {
    console.error("Failed to load user profile:", error);
  }
});

// Watch for unsaved changes (optional - warn user before leaving)
const hasUnsavedChanges = computed(() => hasChanges.value);

// Expose methods for parent component
defineExpose({
  validateForm,
  saveAllData,
  hasChanges,
  hasUnsavedChanges,
});
</script>

<style scoped>
.v-text-field {
  margin-bottom: 8px;
}

.v-text-field--readonly {
  opacity: 0.7;
}

.v-text-field--readonly .v-field__input {
  color: var(--v-theme-on-surface-variant);
}
</style>
