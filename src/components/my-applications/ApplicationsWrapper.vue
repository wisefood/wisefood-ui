<template>
  <v-card class="pa-4" flat>
    <v-card-title class="d-flex align-center pe-2">
      <v-icon icon="mdi-note" class="me-2"></v-icon>
      {{ t("header.myApplications") }}
      <v-spacer></v-spacer>
    </v-card-title>

    <v-btn color="primary" @click="showCreateApplicationPanel" class="ma-2">
      {{ t("application.createNewApplication") }}
    </v-btn>
    <v-divider></v-divider>

    <v-data-table
      :items="items"
      :headers="headers"
      :items-per-page="itemsPerPage"
      :items-per-page-options="[5, 10, 20]"
      :items-length="totalElements"
      :loading="loading"
      hover
      class="cursor-pointer"
      @click:row="showViewApplicationPanel"
      @update:items-per-page="onItemsPerPageChange"
      @update:page="onPageChange"
    >
      <!-- Application Type column with icon and translated text -->
      <template v-slot:item.applicationType="{ item }">
        <div class="d-flex align-center">
          <v-icon
            :icon="getTypeIcon(item.applicationType)"
            class="me-2"
            size="small"
            :color="getTypeColor(item.applicationType)"
          ></v-icon>
          <span>{{ getTranslatedApplicationType(item.applicationType) }}</span>
        </div>
      </template>

      <!-- Date column with better formatting -->
      <template v-slot:item.createdAt="{ item }">
        <div class="d-flex flex-column">
          <span class="text-body-2">{{ formatDate(item.createdAt) }}</span>
          <span class="text-caption text-medium-emphasis">{{
            formatTime(item.createdAt)
          }}</span>
        </div>
      </template>

      <!-- Status column with proper color coding, icons, and translated text -->
      <template v-slot:item.applicationStatus="{ item }">
        <v-chip
          :color="getStatusColor(item.applicationStatus)"
          :prepend-icon="getStatusIcon(item.applicationStatus)"
          :text="getTranslatedStatus(item.applicationStatus)"
          size="small"
          variant="tonal"
        ></v-chip>
      </template>

      <!-- Custom no data message -->
      <template v-slot:no-data>
        <div class="d-flex flex-column justify-center align-center pa-8">
          <v-icon
            icon="mdi-inbox"
            size="64"
            class="mb-4 text-medium-emphasis"
          ></v-icon>
          <h3 class="text-h6 mb-2">
            {{ t("application.table.noApplicationsFound") }}
          </h3>
          <p class="text-body-2 text-medium-emphasis mb-4">
            {{ t("application.table.noApplicationsDescription") }}
          </p>
          <v-btn color="primary" @click="showCreateApplicationPanel">
            {{ t("application.table.createFirstApplication") }}
          </v-btn>
        </div>
      </template>

      <!-- Custom loading message -->
      <template v-slot:loading>
        <div class="text-center pa-8">
          <v-progress-circular
            color="primary"
            size="64"
            indeterminate
            class="mb-4"
          ></v-progress-circular>
          <p class="text-body-2 text-medium-emphasis">
            {{ t("application.table.loadingApplications") }}
          </p>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
import { useOffCanvas } from "@/composables/useOffCanvas";
import CreateApplicationPanel from "@/components/off-canvas/CreateApplicationPanel.vue";
import ViewApplicationPanel from "@/components/off-canvas/ViewApplicationPanel.vue";
import { applicationManagementService } from "@/services/application-managment.service";

const { open } = useOffCanvas();
const { t } = useI18nWithStorage();

// Define headers for the table
const headers = computed(() => [
  {
    title: t("application.table.applicationType"),
    key: "applicationType",
    sortable: false,
    width: "250px",
  },
  {
    title: t("application.table.submittedDate"),
    key: "createdAt",
    sortable: false,
    width: "200px",
  },
  {
    title: t("application.table.status"),
    key: "applicationStatus",
    sortable: false,
    width: "150px",
  },
]);

// Reactive state
const items = ref([]);
const itemsPerPage = ref(10);
const currentPage = ref(1);
const totalItems = ref(0);
const loading = ref(false);

const { getMyApplications } = applicationManagementService();

// API call function
const fetchApplications = async (page = 1, perPage = 10) => {
  loading.value = true;
  try {
    const data = await getMyApplications(page - 1, perPage);
    const startIndex = (page - 1) * perPage;
    const fullArray = Array(data.totalElements).fill(null);
    data.content.forEach((item, index) => {
      fullArray[startIndex + index] = item;
    });

    items.value = fullArray;
    totalItems.value = data.totalElements;
  } catch (error) {
    console.error("Error fetching applications:", error);
  } finally {
    loading.value = false;
  }
};

// Translation functions
const getTranslatedApplicationType = (type) => {
  const typeTranslations = {
    REGISTER_DIETITIAN: t("application.types.registerDietitian"),
    REGISTER_NUTRITIONIST: t("application.types.registerNutritionist"),
  };
  return typeTranslations[type] || formatApplicationType(type);
};

const getTranslatedStatus = (status) => {
  const statusTranslations = {
    DRAFT: t("application.status.draft"),
    SUBMITTED: t("application.status.submitted"),
    UNDER_REVIEW: t("application.status.underReview"),
    APPROVED: t("application.status.approved"),
    REJECTED: t("application.status.rejected"),
    WITHDRAWN: t("application.status.withdrawn"),
  };
  return statusTranslations[status] || formatStatus(status);
};

// Keep original formatting functions as fallback
const formatApplicationType = (type) => {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatStatus = (status) => {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Icon and color functions
const getTypeIcon = (type) => {
  const iconMap = {
    REGISTER_DIETITIAN: "mdi-food-apple",
    REGISTER_NUTRITIONIST: "mdi-food",
    JOB_APPLICATION: "mdi-briefcase",
    INTERNSHIP: "mdi-school",
    VOLUNTEER: "mdi-heart",
    SCHOLARSHIP: "mdi-medal",
  };
  return iconMap[type] || "mdi-file-document";
};

const getTypeColor = (type) => {
  const colorMap = {
    REGISTER_DIETITIAN: "green",
    REGISTER_NUTRITIONIST: "info",
    JOB_APPLICATION: "blue",
    INTERNSHIP: "purple",
    VOLUNTEER: "pink",
    SCHOLARSHIP: "orange",
  };
  return colorMap[type] || "grey";
};

const getStatusColor = (status) => {
  const statusColors = {
    DRAFT: "grey",
    SUBMITTED: "blue",
    UNDER_REVIEW: "orange",
    APPROVED: "green",
    REJECTED: "red",
    WITHDRAWN: "grey",
  };
  return statusColors[status] || "grey";
};

const getStatusIcon = (status) => {
  const statusIcons = {
    DRAFT: "mdi-pencil",
    SUBMITTED: "mdi-send",
    UNDER_REVIEW: "mdi-clock",
    APPROVED: "mdi-check-circle",
    REJECTED: "mdi-close-circle",
    WITHDRAWN: "mdi-arrow-left",
  };
  return statusIcons[status] || "mdi-help-circle";
};

// Panel functions
const createApplicationPanelTitle = computed(() => {
  return t("application.createNewApplication");
});

const showCreateApplicationPanel = () => {
  open("createApplicationPanel", {
    title: createApplicationPanelTitle.value,
    component: CreateApplicationPanel,
    location: "right",
    width: 600,
  });
};

const viewApplicationPanelTitle = computed(() => {
  return t("application.viewApplication");
});

const showViewApplicationPanel = (event, { item }) => {
  open("viewApplicationPanel", {
    title: viewApplicationPanelTitle.value,
    component: ViewApplicationPanel,
    location: "right",
    width: 600,
    componentProps: { application: item },
  });
};

// Event handlers
const onItemsPerPageChange = (newItemsPerPage) => {
  itemsPerPage.value = newItemsPerPage;
  currentPage.value = 1;
  fetchApplications(1, newItemsPerPage);
};

const onPageChange = (newPage) => {
  currentPage.value = newPage;
  fetchApplications(newPage, itemsPerPage.value);
};

// Load initial data
onMounted(() => {
  fetchApplications(currentPage.value, itemsPerPage.value);
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.v-data-table >>> tbody tr:hover {
  background-color: rgba(var(--v-theme-primary), 0.04) !important;
}
</style>
