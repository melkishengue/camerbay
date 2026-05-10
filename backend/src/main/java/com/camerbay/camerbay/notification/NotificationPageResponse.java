package com.camerbay.camerbay.notification;

import java.util.List;

import org.springframework.data.domain.Page;

public record NotificationPageResponse(
    List<NotificationResponse> content,
    long totalElements,
    int totalPages,
    int currentPage,
    int pageSize) {

  public static NotificationPageResponse fromPage(Page<Notification> page, int currentPage, int pageSize) {
    List<NotificationResponse> content = page.getContent().stream()
        .map(NotificationResponse::from)
        .toList();

    return new NotificationPageResponse(
        content,
        page.getTotalElements(),
        page.getTotalPages(),
        currentPage,
        pageSize);
  }
}
