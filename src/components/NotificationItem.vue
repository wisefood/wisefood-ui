<template>
  <v-card
    flat
    class="pa-4 mb-2"
    :class="{ 'unread-notification': !notification.isRead }"
    hover
    @click="handleClick"
  >
    <div class="d-flex align-start">
      <v-list-item-avatar class="me-3 mt-1">
        <v-icon :color="getIconColor(String(notification.notification.type))">
          {{ getIcon(String(notification.notification.type)) }}
        </v-icon>
      </v-list-item-avatar>

      <div class="flex-grow-1 min-width-0">
        <v-list-item-title
          class="font-weight-medium text-wrap"
          :class="{ 'text-truncate': !isExpanded }"
        >
          {{ notification.notification.title }}
        </v-list-item-title>

        <v-list-item-subtitle
          class="mt-1"
          :class="{
            'message-truncated': !isExpanded,
            'message-expanded': isExpanded,
          }"
        >
          {{ notification.notification.message }}
        </v-list-item-subtitle>

        <!-- Show expand/collapse button for long messages -->
        <v-btn
          v-if="isMessageLong"
          variant="text"
          size="small"
          color="primary"
          class="pa-0 mt-1"
          style="height: auto; min-height: auto"
          @click.stop="toggleExpanded"
        >
          {{
            isExpanded
              ? t("notifications.showLess")
              : t("notifications.showMore")
          }}
        </v-btn>
      </div>

      <div class="flex-shrink-0 ml-3 d-flex flex-column align-end">
        <v-list-item-action-text class="text-caption text-grey">
          {{ formatDate(notification.createdAt) }}
        </v-list-item-action-text>

        <!-- Unread indicator -->
        <v-chip
          v-if="!notification.isRead"
          size="x-small"
          color="primary"
          class="mt-1"
        >
          {{ t("notifications.new") }}
        </v-chip>
      </div>
    </div>
  </v-card>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";
import type {
  NotificationRecipientDTO,
  NotificationType,
} from "@/types/notification.types";

interface Props {
  notification: NotificationRecipientDTO;
}

interface Emits {
  (e: "mark-read"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18nWithStorage();
const isExpanded = ref(false);

// Check if message is long (more than 150 characters)
const isMessageLong = computed(() => {
  return props.notification.notification.message.length > 150;
});

function handleClick() {
  if (!props.notification.isRead) {
    emit("mark-read");
  }
}

function toggleExpanded() {
  isExpanded.value = !isExpanded.value;
}

function getIcon(type: string): string {
  switch (type) {
    case "ROLE_CHANGED":
      return "mdi-account-star";
    case "APPLICATION_SUBMITTED":
      return "mdi-file-document-outline";
    case "APPLICATION_APPROVED":
      return "mdi-check-circle";
    case "APPLICATION_REJECTED":
      return "mdi-alert-circle";
    case "APPLICATION_STATUS_CHANGED":
      return "mdi-update";
    case "WELCOME":
      return "mdi-hand-wave";
    case "FEATURE_ANNOUNCEMENT":
      return "mdi-new-box";
    case "SECURITY_ALERT":
      return "mdi-shield-alert";
    case "PROFILE_REMINDER":
      return "mdi-account-edit";
    case "info":
      return "mdi-information-outline";
    case "warning":
      return "mdi-alert-circle-outline";
    case "error":
      return "mdi-close-circle-outline";
    default:
      return "mdi-bell-outline";
  }
}

function getIconColor(type: string): string {
  switch (type) {
    case "ROLE_CHANGED":
      return "success";
    case "APPLICATION_SUBMITTED":
      return "info";
    case "APPLICATION_APPROVED":
      return "success";
    case "APPLICATION_REJECTED":
      return "warning";
    case "APPLICATION_STATUS_CHANGED":
      return "info";
    case "WELCOME":
      return "primary";
    case "FEATURE_ANNOUNCEMENT":
      return "purple";
    case "SECURITY_ALERT":
      return "error";
    case "PROFILE_REMINDER":
      return "orange";
    case "ACCOUNT_CREATED":
      return "blue";
    default:
      return "grey";
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  // If less than 24 hours ago, show relative time
  if (diffInHours < 24) {
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 0
        ? t("notifications.justNow")
        : t("notifications.minutesAgo", { minutes: diffInMinutes });
    }
    return t("notifications.hoursAgo", { hours: Math.floor(diffInHours) });
  }

  // If less than 7 days ago, show day and time
  if (diffInHours < 168) {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleString(undefined, options);
  }

  // Otherwise show date and time
  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  };
  return date.toLocaleString(undefined, options);
}
</script>

<style scoped>
.unread-notification {
  background-color: #f8f9fa !important;
  border-left: 4px solid #2196f3;
}

.v-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.v-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

.min-width-0 {
  min-width: 0;
}

.text-wrap {
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.message-truncated {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  word-wrap: break-word;
  line-height: 1.4;
  max-height: calc(1.4em * 3);
}

.message-expanded {
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .message-truncated {
    -webkit-line-clamp: 2;
    line-clamp: 2;
    max-height: calc(1.4em * 2);
  }
}
</style>
