<template>
  <v-overlay v-model="overlay" persistent></v-overlay>

  <div class="d-flex flex-column h-100">
    <!-- Main Form Content -->
    <div class="flex-grow-1 pa-4">
      <!-- Application Type Selection -->
      <div class="mb-6">
        <v-label class="text-subtitle-1 font-weight-medium mb-3 d-block">
          <v-icon icon="mdi-format-list-bulleted" class="me-2"></v-icon>
          {{ t("application.applicationType") }}
        </v-label>
        <v-select
          v-model="applicationType"
          :items="applicationTypes"
          item-title="text"
          item-value="value"
          variant="outlined"
          density="comfortable"
          :placeholder="t('application.selectApplicationType')"
          :error-messages="applicationTypeError"
        >
          <template v-slot:prepend-inner>
            <v-icon :icon="getSelectedTypeIcon()" color="primary"></v-icon>
          </template>
        </v-select>
      </div>

      <!-- Cover Letter Section -->
      <div class="mb-6">
        <v-label class="text-subtitle-1 font-weight-medium mb-3 d-block">
          <v-icon icon="mdi-text-box" class="me-2"></v-icon>
          {{ t("application.coverLetter") }}
        </v-label>
        <v-textarea
          v-model="applicationDetails"
          variant="outlined"
          rows="8"
          auto-grow
          :placeholder="t('application.coverLetterPlaceholder')"
          :error-messages="applicationDetailsError"
          counter="2000"
          :rules="[rules.maxLength]"
        >
          <template v-slot:prepend-inner>
            <v-icon icon="mdi-pencil" color="primary" size="small"></v-icon>
          </template>
        </v-textarea>
      </div>

      <!-- File Upload Section -->
      <div class="mb-6">
        <v-label class="text-subtitle-1 font-weight-medium mb-3 d-block">
          <v-icon icon="mdi-paperclip" class="me-2"></v-icon>
          {{ t("application.supportingDocuments") }}
        </v-label>

        <!-- File Upload Drop Zone -->
        <v-card
          variant="outlined"
          class="pa-6 text-center upload-zone"
          :class="{ 'upload-zone--dragover': isDragOver }"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="handleFileDrop"
        >
          <v-icon
            icon="mdi-cloud-upload"
            size="48"
            color="primary"
            class="mb-3"
          ></v-icon>
          <h4 class="text-h6 mb-2">
            {{ t("application.uploadFiles") }}
          </h4>
          <p class="text-body-2 text-medium-emphasis mb-4">
            {{ t("application.dragDropText") }}
          </p>
          <v-file-input
            v-model="selectedFiles"
            multiple
            variant="outlined"
            density="comfortable"
            :accept="allowedFileTypes"
            @update:model-value="onFileUpload"
            class="d-none"
            ref="fileInput"
          ></v-file-input>
          <v-btn color="primary" variant="outlined" @click="triggerFileUpload">
            <v-icon start>mdi-plus</v-icon>
            {{ t("application.chooseFiles") }}
          </v-btn>
        </v-card>

        <!-- File Type Info -->
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          class="mt-3"
          :text="t('application.supportedFormats')"
        ></v-alert>
      </div>

      <!-- Uploaded Files Display -->
      <div v-if="storedFiles.length > 0" class="mb-6">
        <v-card variant="outlined">
          <v-card-title class="d-flex align-center">
            <v-icon
              icon="mdi-file-multiple"
              class="me-2"
              color="success"
            ></v-icon>
            {{ t("application.uploadedFiles", { count: storedFiles.length }) }}
            <v-spacer></v-spacer>
            <v-chip size="small" color="success" variant="tonal">
              {{ formatTotalSize() }}
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item
                v-for="(file, index) in storedFiles"
                :key="`file-${index}-${file.name}`"
                class="px-0"
              >
                <template v-slot:prepend>
                  <v-icon
                    :icon="getFileIcon(file.type)"
                    :color="getFileColor(file.type)"
                  ></v-icon>
                </template>
                <v-list-item-title class="text-body-2">
                  {{ file.name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatFileSize(file.size) }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-btn
                    icon="mdi-close"
                    size="small"
                    variant="text"
                    color="error"
                    @click="removeStoredFile(index)"
                  ></v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Action Buttons - Fixed at bottom -->
    <v-divider></v-divider>
    <div class="d-flex justify-space-between align-center pa-4 bg-surface">
      <v-btn
        color="primary"
        size="large"
        @click="submitApplication"
        :loading="isSaving"
        :disabled="!isFormValid"
      >
        <v-icon start>mdi-send</v-icon>
        {{ t("application.submitApplication") }}
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
import { useNotifications } from "@/composables/useNotifications";
import { useOffCanvas } from "@/composables/useOffCanvas";
import { applicationManagementService } from "@/services/application-managment.service";
import { useGlobalRouter } from "@/composables/useGlobalRouter";
import {
  ApplicationType,
  ApplicationStatus,
  type ApplicationDTO,
} from "@/types/application.types";

const { close } = useOffCanvas();
const { success, error } = useNotifications();
const { t } = useI18nWithStorage();
const { createApplication } = applicationManagementService();
const { refreshPage } = useGlobalRouter();

// Form state
const selectedFiles = ref<File[]>([]);
const storedFiles = ref<File[]>([]);
const isSaving = ref(false);
const isDragOver = ref(false);
const fileInput = ref();

const applicationType = ref<ApplicationType | null>(null);
const applicationDetails = ref<string>("");

// Validation state
const applicationTypeError = ref<string>("");
const applicationDetailsError = ref<string>("");

// Constants
const allowedFileTypes = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
const maxFileSize = 5 * 1024 * 1024; // 5MB
const maxFiles = 10;

// Application types with icons
const applicationTypes = computed(() => [
  {
    text: t("application.registerDietitian"),
    value: ApplicationType.REGISTER_DIETITIAN,
    icon: "mdi-food-apple",
  },
  {
    text: t("application.registerNutritionist"),
    value: ApplicationType.REGISTER_NUTRITIONIST,
    icon: "mdi-food",
  },
]);

// Validation rules
const rules = {
  maxLength: (value: string) => {
    if (!value) return true;
    return (
      value.length <= 2000 ||
      t("application.validation.maxCharacters", { count: 2000 })
    );
  },
};

const isFormValid = computed(() => {
  return (
    applicationType.value !== null &&
    applicationDetails.value.trim() !== "" &&
    storedFiles.value.length > 0 &&
    applicationDetails.value.length <= 2000
  );
});

// Icon helpers
const getSelectedTypeIcon = () => {
  if (applicationType.value === null) return "mdi-format-list-bulleted";
  const type = applicationTypes.value.find(
    (t) => t.value === applicationType.value
  );
  return type?.icon || "mdi-file-document";
};

const getFileIcon = (fileType: string) => {
  if (fileType.includes("pdf")) return "mdi-file-pdf-box";
  if (fileType.includes("word") || fileType.includes("document"))
    return "mdi-file-word-box";
  if (fileType.includes("image")) return "mdi-file-image-box";
  return "mdi-file-document";
};

const getFileColor = (fileType: string) => {
  if (fileType.includes("pdf")) return "red";
  if (fileType.includes("word") || fileType.includes("document")) return "blue";
  if (fileType.includes("image")) return "green";
  return "grey";
};

// File handling
const triggerFileUpload = () => {
  fileInput.value?.$el.querySelector("input").click();
};

const handleFileDrop = (event: DragEvent) => {
  isDragOver.value = false;
  const files = Array.from(event.dataTransfer?.files || []);
  processFiles(files);
};

const onFileUpload = (files: File | File[] | null) => {
  if (files) {
    const fileArray = Array.isArray(files) ? files : [files];
    processFiles(fileArray);
  }
  selectedFiles.value = [];
};

const processFiles = (files: File[]) => {
  const validFiles: File[] = [];
  const errors: string[] = [];

  for (const file of files) {
    // Check file size
    if (file.size > maxFileSize) {
      errors.push(
        t("application.validation.fileSizeError", { filename: file.name })
      );
      continue;
    }

    // Check if already exists
    const exists = storedFiles.value.some(
      (existingFile) =>
        existingFile.name === file.name && existingFile.size === file.size
    );

    if (exists) {
      errors.push(
        t("application.validation.fileExists", { filename: file.name })
      );
      continue;
    }

    // Check total file limit
    if (storedFiles.value.length + validFiles.length >= maxFiles) {
      errors.push(t("application.validation.maxFiles", { count: maxFiles }));
      break;
    }

    validFiles.push(file);
  }

  // Add valid files
  storedFiles.value.push(...validFiles);

  // Show errors if any
  if (errors.length > 0) {
    error(errors.join(", "));
  }

  // Show success for valid files
  if (validFiles.length > 0) {
    success(t("application.filesUploaded", { count: validFiles.length }));
  }
};

const removeStoredFile = (index: number) => {
  if (index >= 0 && index < storedFiles.value.length) {
    const fileName = storedFiles.value[index].name;
    storedFiles.value.splice(index, 1);
    success(t("application.fileRemoved", { filename: fileName }));
  }
};

const overlay = ref(false);

watch(overlay, (val) => {
  if (val) {
    setTimeout(() => {
      overlay.value = false;
    }, 2000);
  }
});

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatTotalSize = (): string => {
  const totalBytes = storedFiles.value.reduce(
    (sum, file) => sum + file.size,
    0
  );
  return formatFileSize(totalBytes);
};

// Form validation
const validateForm = (): boolean => {
  applicationTypeError.value = "";
  applicationDetailsError.value = "";

  if (applicationType.value == null) {
    applicationTypeError.value = t("application.validation.selectType");
  }

  if (!applicationDetails.value.trim()) {
    applicationDetailsError.value = t("application.validation.provideDetails");
  }

  if (applicationDetails.value.length > 2000) {
    applicationDetailsError.value = t("application.validation.maxCharacters", {
      count: 2000,
    });
  }

  return !applicationTypeError.value && !applicationDetailsError.value;
};

// Actions
const submitApplication = async () => {
  if (!validateForm() || storedFiles.value.length === 0) {
    if (storedFiles.value.length === 0) {
      error(t("application.validation.uploadDocument"));
    }
    return;
  }

  isSaving.value = true;
  try {
    const applicationData: ApplicationDTO = {
      id: "",
      applicationType: applicationType.value!,
      coverLetter: applicationDetails.value,
      documents: [],
      applicationStatus: ApplicationStatus.SUBMITTED,
      user: {} as any, // Will be set by backend
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await createApplication(applicationData, storedFiles.value);
    overlay.value = true;
    setTimeout(() => {
      refreshPage();
    }, 2000);
    close("createApplicationPanel");
  } catch (err) {
    console.error(err);
    overlay.value = false;
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.upload-zone {
  border: 2px dashed rgb(var(--v-theme-primary));
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.upload-zone:hover {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.upload-zone--dragover {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.08);
  transform: scale(1.02);
}

.gap-2 {
  gap: 8px;
}
</style>
