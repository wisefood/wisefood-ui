// composables/useNotificationApi.ts
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { useGlobalRouter } from "@/composables/useGlobalRouter";
import { useNotifications } from "@/composables/useNotifications";
import { useI18nWithStorage } from "@/composables/useI18nWithStorage";

// Create axios instance for notification service
const notificationApi = axios.create({
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
notificationApi.interceptors.request.use(
  (config) => {
    // Get composables inside the interceptor
    const authStore = useAuthStore();

    // Set baseURL for notification service
    config.baseURL = import.meta.env.VITE_API_NOTIFICATION_BASE_URL;

    // Add auth token
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }

    // Handle FormData - remove Content-Type to let Axios set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
notificationApi.interceptors.response.use(
  (response) => response, // Don't return response.data here - let the calling code handle it
  (error) => {
    console.log("Notification API Error:", error);

    // Get composables inside the interceptor
    const authStore = useAuthStore();
    const { navigateTo } = useGlobalRouter();
    const { error: showError } = useNotifications();
    const { t } = useI18nWithStorage();

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      authStore.clearAuth();
      showError(t("auth.sessionExpired"));
      navigateTo("/login");
      return Promise.reject(error);
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.warn("Access forbidden - insufficient permissions");
      showError(t("auth.insufficientPermissions"));
      return Promise.reject(error);
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.warn("Notification resource not found");
      showError(t("common.noResults"));
      return Promise.reject(error);
    }

    // Handle 500 Internal Server Error
    if (error.response?.status >= 500) {
      showError(t("common.error"));
      return Promise.reject(error);
    }

    // Handle other errors - try to get message from response or use generic error
    const errorMessage = error.response?.data?.message || t("common.error");
    showError(errorMessage);
    return Promise.reject(error);
  }
);

export const useNotificationApi = () => {
  return {
    api: notificationApi,
    // Convenience methods that properly return response.data
    get: async (url: string, config?: any) => {
      const response = await notificationApi.get(url, config);
      return response.data;
    },
    post: async (url: string, data?: any, config?: any) => {
      const response = await notificationApi.post(url, data, config);
      return response.data;
    },
    put: async (url: string, data?: any, config?: any) => {
      const response = await notificationApi.put(url, data, config);
      return response.data;
    },
    delete: async (url: string, config?: any) => {
      const response = await notificationApi.delete(url, config);
      return response.data;
    },
    patch: async (url: string, data?: any, config?: any) => {
      const response = await notificationApi.patch(url, data, config);
      return response.data;
    },
  };
};
