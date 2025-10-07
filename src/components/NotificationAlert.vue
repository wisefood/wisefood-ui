<!-- NotificationAlert.vue -->
<template>
  <Teleport to="body">
    <div class="notification-container">
      <TransitionGroup name="notification" tag="div">
        <v-alert
          v-for="alert in alerts"
          :key="alert.id"
          :closable="alert.closable"
          :icon="getIcon(alert)"
          :title="alert.title"
          :text="alert.text"
          :type="alert.type"
          :color="alert.color"
          :variant="alert.variant"
          class="notification-alert mb-2"
          @click:close="removeAlert(alert.id)"
        >
          <div v-if="alert.content" v-html="alert.content"></div>
        </v-alert>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useNotifications, type Alert } from "@/composables/useNotifications";

// Get global alerts and methods
const { alerts, removeAlert } = useNotifications();

// Get icon for alert type
const getIcon = (alert: Alert): string | boolean => {
  if (alert.icon !== null) return alert.icon;

  const icons: Record<Alert["type"], string> = {
    success: "mdi-check-circle",
    error: "mdi-alert-circle",
    warning: "mdi-alert",
    info: "mdi-information",
  };

  return icons[alert.type] || "mdi-information";
};
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2100;
  max-width: 400px;
  width: 400px;
  pointer-events: none;
}

.notification-alert {
  pointer-events: all;
  margin-bottom: 8px;
}

/* Transition animations */
.notification-enter-active {
  transition: all 0.3s ease-out;
}

.notification-leave-active {
  transition: all 0.3s ease-in;
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.notification-move {
  transition: transform 0.3s ease;
}

@media (max-width: 768px) {
  .notification-container {
    left: 20px;
    right: 20px;
    width: auto;
    max-width: none;
  }
}
</style>
