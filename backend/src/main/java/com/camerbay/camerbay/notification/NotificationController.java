package com.camerbay.camerbay.notification;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.camerbay.camerbay.auth.AuthenticationFacade;
import com.camerbay.camerbay.user.User;
import com.camerbay.camerbay.user.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

  private final NotificationService notificationService;
  private final AuthenticationFacade authFacade;
  private final UserRepository userRepository;

  @GetMapping
  public ResponseEntity<NotificationPageResponse> getNotifications(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {

    UUID userId = getCurrentUserId();
    NotificationPageResponse response = notificationService.getNotifications(userId, page, size);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/unread-count")
  public ResponseEntity<UnreadCountResponse> getUnreadCount() {
    UUID userId = getCurrentUserId();
    long count = notificationService.getUnreadCount(userId);
    return ResponseEntity.ok(new UnreadCountResponse(count));
  }

  @PutMapping("/{id}/read")
  public ResponseEntity<NotificationResponse> markAsRead(@PathVariable UUID id) {
    UUID userId = getCurrentUserId();
    NotificationResponse response = notificationService.markAsRead(id, userId);
    return ResponseEntity.ok(response);
  }

  @PutMapping("/read-all")
  public ResponseEntity<MarkAllReadResponse> markAllAsRead() {
    UUID userId = getCurrentUserId();
    int updatedCount = notificationService.markAllAsRead(userId);
    return ResponseEntity.ok(new MarkAllReadResponse(updatedCount));
  }

  private UUID getCurrentUserId() {
    String email = authFacade.getCurrentUserEmail();
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
    return user.getId();
  }
}
