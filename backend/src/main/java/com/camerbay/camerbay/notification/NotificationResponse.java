package com.camerbay.camerbay.notification;

import java.util.Map;
import java.util.UUID;

public record NotificationResponse(
    UUID id,
    NotificationType type,
    String title,
    String body,
    Map<String, Object> data,
    boolean read,
    String createdAt) {

  public static NotificationResponse from(Notification notification) {
    return new NotificationResponse(
        notification.getId(),
        notification.getType(),
        notification.getTitle(),
        notification.getBody(),
        notification.getData(),
        notification.isRead(),
        notification.getCreatedAt() != null ? notification.getCreatedAt().toString() : null);
  }
}
