export enum NotificationType {
  ACCOUNT_CREATED,
  ROLE_CHANGED,
  ROLE_CHANGE_REQUEST,
}

export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isActive: boolean;
}

export interface NotificationRecipientDTO {
  id: string;
  userId: string;
  isRead: boolean;
  notification: NotificationDTO;
  createdAt: string; // in ISO format from Instant
  updatedAt: string;
}
