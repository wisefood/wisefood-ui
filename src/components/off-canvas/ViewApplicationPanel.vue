<template>
  <v-overlay v-model="overlay" persistent></v-overlay>

  <div class="h-100 d-flex flex-column">
    <!-- Loading State -->
    <LoadingSpinner v-if="loadingSpinner || !application" />

    <!-- Main Content -->
    <div v-else class="flex-grow-1 pa-4">
      <!-- Header -->
      <div class="mb-6">
        <div class="d-flex align-center mb-3">
          <v-icon
            :icon="getTypeIcon(application.applicationType)"
            :color="getTypeColor(application.applicationType)"
            size="20"
            class="me-2"
          ></v-icon>
          <h1 class="text-h6 font-weight-bold">
            {{ getTranslatedApplicationType(application.applicationType) }}
          </h1>
        </div>

        <div class="mb-3">
          <v-chip
            :color="getStatusColor(application.applicationStatus)"
            size="small"
            variant="tonal"
          >
            {{ getTranslatedStatus(application.applicationStatus) }}
          </v-chip>
        </div>

        <div class="text-caption text-medium-emphasis">
          {{ t("application.details.id") }}: {{ application.id }}
        </div>
      </div>

      <!-- Dates -->
      <div class="mb-6">
        <div class="d-flex justify-space-between text-body-2 mb-2">
          <span class="text-medium-emphasis"
            >{{ t("application.details.submitted") }}:</span
          >
          <span>{{ formatDate(application.createdAt) }}</span>
        </div>
      </div>

      <!-- Cover Letter -->
      <div class="mb-6">
        <h2 class="text-subtitle-1 font-weight-medium mb-3">
          {{ t("application.coverLetter") }}
        </h2>
        <v-card variant="outlined" class="pa-4">
          <v-card-text class="pa-0">
            {{
              application.coverLetter || t("application.details.noCoverLetter")
            }}
          </v-card-text>
        </v-card>
      </div>

      <!-- Documents -->
      <div class="mb-6">
        <div class="d-flex align-center justify-space-between mb-3">
          <h2 class="text-subtitle-1 font-weight-medium">
            {{ t("application.supportingDocuments") }}
          </h2>
          <v-chip
            size="x-small"
            variant="outlined"
            v-if="application.documents?.length"
          >
            {{ application.documents.length }}
          </v-chip>
        </div>

        <!-- Files List -->
        <v-card flat v-if="application.documents?.length" class="pa-2">
          <FileListItem
            v-for="(document, index) in application.documents"
            :key="index"
            :fileName="getFileName(document)"
            :fileType="getFileType(document)"
            :clickable="true"
            :deletable="false"
            class="mb-2 rounded-lg"
            @click="viewFile(document)"
          />
        </v-card>

        <!-- No Documents -->
        <v-card v-else variant="outlined" class="text-center pa-6">
          <v-icon
            icon="mdi-file-document-outline"
            size="32"
            color="medium-emphasis"
            class="mb-2"
          ></v-icon>
          <div class="text-body-2 text-medium-emphasis">
            {{ t("application.details.noDocuments") }}
          </div>
        </v-card>
      </div>
    </div>

    <div
      v-if="
        authStore.user.roles.includes('SYSTEM_ADMIN') &&
        application.applicationStatus === 'SUBMITTED' &&
        !loadingSpinner
      "
      class="d-flex justify-space-between pa-4"
    >
      <v-btn @click="declineApplication" color="error">
        {{ t("application.actions.reject") }}
      </v-btn>
      <v-btn @click="accectApplication" color="success">
        {{ t("application.actions.approve") }}
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
import { useOffCanvas } from "@/composables/useOffCanvas";
import { useNotifications } from "@/composables/useNotifications";
import LoadingSpinner from "../LoadingSpinner.vue";
import FileListItem from "../FileListItem.vue";
import { applicationManagementService } from "@/services/application-managment.service";
import { useAuthStore } from "@/stores/authStore";
import { useGlobalRouter } from "@/composables/useGlobalRouter";

const { refreshPage } = useGlobalRouter();
const { t } = useI18nWithStorage();
const { close } = useOffCanvas();

// Props
const props = defineProps({
  application: {
    type: Object,
    default: () => null,
  },
  item: {
    type: Object,
    default: () => null,
  },
});

const overlay = ref(false);

watch(overlay, (val) => {
  if (val) {
    setTimeout(() => {
      overlay.value = false;
    }, 2000);
  }
});

const authStore = useAuthStore();
// Use whichever prop is available
const application = computed(() => props.application || props.item);

const { getApplicationFileUrl, rejectApplication, approveApplication } =
  applicationManagementService();

const loadingSpinner = ref(true);

// Translation functions
const getTranslatedApplicationType = (type) => {
  const typeTranslations = {
    REGISTER_DIETITIAN: t("application.types.registerDietitian"),
    REGISTER_NUTRITIONIST: t("application.types.registerNutritionist"),
  };
  return typeTranslations[type] || type;
};

const getTranslatedStatus = (status) => {
  const statusTranslations = {
    SUBMITTED: t("application.status.submitted"),
    APPROVED: t("application.status.approved"),
    REJECTED: t("application.status.rejected"),
  };
  return statusTranslations[status] || status;
};

// Keep original formatting functions as fallback
const formatApplicationType = (type) => {
  return String(type)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatStatus = (status) => {
  return String(status)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Icon and color functions
const getTypeIcon = (type) => {
  const iconMap = {
    REGISTER_DIETITIAN: "mdi-food-apple",
    REGISTER_NUTRITIONIST: "mdi-food",
  };
  return iconMap[type] || "mdi-file-document";
};

const getTypeColor = (type) => {
  const colorMap = {
    REGISTER_DIETITIAN: "success",
    REGISTER_NUTRITIONIST: "info",
  };
  return colorMap[type] || "grey";
};

const getStatusColor = (status) => {
  const statusColors = {
    SUBMITTED: "info",
    APPROVED: "success",
    REJECTED: "error",
  };
  return statusColors[status] || "grey";
};

// File helper functions
const getFileName = (documentPath) => {
  const fullFileName = documentPath.split("/").pop() || documentPath;

  // Handle UUID_fileName format
  const uuidRegex =
    /^[a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12}_(.+)$/i;
  const match = fullFileName.match(uuidRegex);

  if (match) {
    // Return just the filename part after UUID_
    return match[1];
  }

  // If no UUID prefix found, return the full filename
  return fullFileName;
};

const getFileType = (documentPath) => {
  const extension = documentPath.split(".").pop()?.toLowerCase();
  return extension || "unknown";
};

// Action functions
const viewFile = async (documentPath) => {
  const filePath = await getApplicationFileUrl(
    application.value.id,
    documentPath
  );
  window.open(filePath, "_blank");
};

const declineApplication = async () => {
  try {
    await rejectApplication(application.value.id);
    overlay.value = true;
    setTimeout(() => {
      refreshPage();
    }, 2000);
    close("viewApplicationPanel");
  } catch (e) {
    console.error(e);
    overlay.value = false;
  }
};

const accectApplication = async () => {
  try {
    await approveApplication(application.value.id);
    overlay.value = true;
    setTimeout(() => {
      refreshPage();
    }, 2000);
    close("viewApplicationPanel");
  } catch (e) {
    console.error(e);
    overlay.value = false;
  }
};

// Lifecycle
onMounted(() => {
  loadingSpinner.value = true;
  setTimeout(() => {
    loadingSpinner.value = false;
  }, 300);
});
</script>

<style scoped>
/* No custom CSS - using only Vuetify components and classes */
</style>
