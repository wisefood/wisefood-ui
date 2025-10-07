// composables/useNotifications.ts
import { ref } from "vue";

// Types
interface Alert {
  id: number;
  type: "success" | "error" | "warning" | "info";
  title: string;
  text?: string;
  content?: string;
  icon?: string | boolean | null;
  closable: boolean;
  color?: string | null;
  variant: "tonal" | "outlined" | "flat" | "elevated";
  timeout: number;
  persistent: boolean;
}

interface AlertOptions {
  type?: "success" | "error" | "warning" | "info";
  title?: string;
  text?: string;
  content?: string;
  icon?: string | boolean | null;
  closable?: boolean;
  color?: string | null;
  variant?: "tonal" | "outlined" | "flat" | "elevated";
  timeout?: number;
  persistent?: boolean;
}

// Global reactive state
const alerts = ref<Alert[]>([]);
let alertId = 0;

export function useNotifications() {
  // Add alert function
  const addAlert = (options: AlertOptions): number => {
    const alert: Alert = {
      id: ++alertId,
      type: options.type || "info",
      title: options.title || "",
      text: options.text || "",
      content: options.content || undefined,
      icon: options.icon || null,
      closable: options.closable !== false,
      color: options.color || null,
      variant: options.variant || "elevated",
      timeout: options.timeout || 3000,
      persistent: options.persistent || false,
    };

    alerts.value.push(alert);

    // Auto remove
    if (!alert.persistent && alert.timeout > 0) {
      setTimeout(() => {
        removeAlert(alert.id);
      }, alert.timeout);
    }

    return alert.id;
  };

  // Remove alert
  const removeAlert = (id: number): void => {
    const index = alerts.value.findIndex((a) => a.id === id);
    if (index > -1) {
      alerts.value.splice(index, 1);
    }
  };

  // Clear all alerts
  const clearAll = (): void => {
    alerts.value = [];
  };

  // Helper methods
  const success = (
    title: string,
    options: Omit<AlertOptions, "type" | "title"> = {}
  ): number => {
    return addAlert({ ...options, type: "success", title });
  };

  const error = (
    title: string,
    options: Omit<AlertOptions, "type" | "title"> = {}
  ): number => {
    return addAlert({ ...options, type: "error", title });
  };

  const warning = (
    title: string,
    options: Omit<AlertOptions, "type" | "title"> = {}
  ): number => {
    return addAlert({ ...options, type: "warning", title });
  };

  const info = (
    title: string,
    options: Omit<AlertOptions, "type" | "title"> = {}
  ): number => {
    return addAlert({ ...options, type: "info", title });
  };

  const showAlert = (
    options: Omit<AlertOptions, "type" | "title"> = {}
  ): number => {
    return addAlert({ ...options });
  };

  return {
    alerts, // Export alerts for the component
    addAlert,
    removeAlert,
    clearAll,
    success,
    error,
    warning,
    info,
    showAlert,
  };
}

export type { Alert, AlertOptions };
