import { useNotificationApi } from "@/composables/useNotificationApi";
import { useNotifications } from "@/composables/useNotifications";
import { type NotificationRecipientDTO } from "@/types/notification.types";
import { type PagedApiResponse } from "@/types/api.types";

export const useNotificationService = () => {
  const { get, post, put } = useNotificationApi();
  const { success } = useNotifications();

  const markAsRead = async (id: string): Promise<NotificationRecipientDTO> => {
    const url = `/notification/${id}/read`;

    const response = await put(url);
    if (response.success) {
      // Optional: Add success message for marking as read
      // success(t('notifications.markedAsRead'));
    }
    return response.data as NotificationRecipientDTO;
  };

  const getMyNotifications = async (
    page: number = 0,
    size: number = 10,
    sort: string = "createdAt,DESC"
  ): Promise<PagedApiResponse<NotificationRecipientDTO>> => {
    const url = `/notification/all`;

    // Build query parameters
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (sort) {
      params.append("sort", sort);
    }

    try {
      const response = await get(`${url}?${params.toString()}`);
      return response as PagedApiResponse<NotificationRecipientDTO>;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const getUnreadCount = async (): Promise<number> => {
    const url = `/notification/unread-count`;
    try {
      const response = await get(url);
      return response.data as number;
    } catch (error) {
      console.error(error);
      return 0; // Return 0 as fallback
    }
  };

  return {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
  };
};
