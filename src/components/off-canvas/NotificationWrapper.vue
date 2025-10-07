<template>
  <LoadingSpinner v-if="loading" />
  <div class="d-flex flex-column h-100" v-else>
    <v-list
      class="flex-grow-1 overflow-y-auto"
      v-if="notifications.length !== 0"
      density="compact"
    >
      <NotificationItem
        v-for="(notification, index) in notifications"
        :key="currentPage * itemsPerPage + index"
        :notification="notification"
        @mark-read="
          markNotificationAsRead((currentPage - 1) * itemsPerPage + index)
        "
      />
    </v-list>

    <v-container
      v-else
      class="flex-grow-1 d-flex justify-center align-center overflow-y-auto"
    >
      <NoDataMessage />
    </v-container>

    <div>
      <!-- Pagination -->
      <v-pagination
        v-if="totalPages > 1"
        v-model="currentPage"
        :length="totalPages"
        :total-visible="5"
        class="mt-4"
      />

      <!-- Pagination Info -->
      <div class="text-center text-caption text-grey mt-2">
        {{
          t("notifications.showingResults", {
            start: startItem,
            end: endItem,
            total: totalNotifications,
          })
        }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
import LoadingSpinner from "../LoadingSpinner.vue";
import NotificationItem from "../NotificationItem.vue";
import NoDataMessage from "../NoDataMessage.vue";
import { useNotificationService } from "@/services/notification.service";
import { type NotificationRecipientDTO } from "@/types/notification.types";

const { t } = useI18nWithStorage();

const loading = ref(true);
const currentPage = ref(1);
const itemsPerPage = ref(10); // You can make this configurable
const { getMyNotifications, markAsRead } = useNotificationService();

// Sample data with more notifications to demonstrate paging
const notifications = ref<NotificationRecipientDTO[]>([]);

// Computed properties for pagination
const totalNotifications = ref(0);
const totalPages = ref(0);

const startItem = computed(() => {
  if (totalNotifications.value === 0) return 0;
  return (currentPage.value - 1) * itemsPerPage.value + 1;
});

const endItem = computed(() => {
  const end = currentPage.value * itemsPerPage.value;
  return Math.min(end, totalNotifications.value);
});

onMounted(() => {
  getMyNotifications().then((data) => {
    console.log(data);
    notifications.value = data.content;
    totalNotifications.value = data.totalElements;
    totalPages.value = data.totalPages;
    loading.value = false;
  });
});

function markNotificationAsRead(index: number) {
  console.log("Marking notification as read:", index);
  markAsRead(notifications.value[index].notification.id).then(
    () => (notifications.value[index].isRead = true)
  );
}
</script>

<style scoped>
.notification-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.notification-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.notification-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 8px;
}

.pagination-container {
  position: sticky;
  bottom: 0;
  background-color: white;
  border-top: 1px solid #e0e0e0;
  padding: 16px;
  z-index: 10;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.v-pagination {
  justify-content: center;
}

/* Custom scrollbar styling */
.notification-content::-webkit-scrollbar {
  width: 6px;
}

.notification-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.notification-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.notification-content::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>
