package com.camerbay.camerbay.notification;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.camerbay.camerbay.user.User;
import com.camerbay.camerbay.user.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class NotificationService {

  private final NotificationRepository notificationRepository;
  private final PushTokenRepository pushTokenRepository;
  private final UserRepository userRepository;
  private final ExpoPushService expoPushService;

  public NotificationPageResponse getNotifications(UUID userId, int page, int size) {
    Page<Notification> notifications = notificationRepository
        .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
    return NotificationPageResponse.fromPage(notifications, page, size);
  }

  public long getUnreadCount(UUID userId) {
    return notificationRepository.countByUserIdAndReadFalse(userId);
  }

  @Transactional
  public NotificationResponse markAsRead(UUID notificationId, UUID userId) {
    Notification notification = notificationRepository.findById(notificationId)
        .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

    if (!notification.getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("Notification not found");
    }

    notification.markAsRead();
    return NotificationResponse.from(notification);
  }

  @Transactional
  public int markAllAsRead(UUID userId) {
    return notificationRepository.markAllAsRead(userId);
  }

  @Transactional
  public void sendNotification(UUID userId, NotificationType type, String title, String body, Map<String, Object> data) {
    Optional<User> userOpt = userRepository.findById(userId);
    if (userOpt.isEmpty()) {
      log.warn("Cannot send notification to non-existent user: {}", userId);
      return;
    }

    Notification notification = Notification.create(userOpt.get(), type, title, body, data);
    notificationRepository.save(notification);

    List<PushToken> pushTokens = pushTokenRepository.findByUserId(userId);
    if (!pushTokens.isEmpty()) {
      List<String> tokens = pushTokens.stream()
          .map(PushToken::getExpoPushToken)
          .toList();
      expoPushService.sendPushNotification(tokens, title, body, data);
    }
  }

  @Transactional
  public void registerPushToken(UUID userId, RegisterPushTokenRequest request) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    Optional<PushToken> existingToken = pushTokenRepository.findByExpoPushToken(request.expoPushToken());

    if (existingToken.isPresent()) {
      PushToken token = existingToken.get();
      if (!token.getUser().getId().equals(userId)) {
        token.updateUser(user);
      }
      return;
    }

    if (request.deviceId() != null) {
      Optional<PushToken> existingDeviceToken = pushTokenRepository.findByUserIdAndDeviceId(userId, request.deviceId());
      existingDeviceToken.ifPresent(token -> pushTokenRepository.delete(token));
    }

    PushToken pushToken = PushToken.create(user, request.expoPushToken(), request.platform(), request.deviceId());
    pushTokenRepository.save(pushToken);
  }
}
