export type NotificationType =
  | "chat_message"
  | "new_offer_nearby"
  | "offer_status_change"
  | "offer_review"
  | "system_announcement";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  content: AppNotification[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface PushTokenRegistration {
  expoPushToken: string;
  platform: "ios" | "android";
  deviceId?: string;
}
