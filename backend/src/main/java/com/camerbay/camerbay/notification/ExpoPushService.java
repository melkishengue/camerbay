package com.camerbay.camerbay.notification;

import java.util.List;
import java.util.Map;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ExpoPushService {

  private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

  private final RestClient restClient;
  private final PushTokenRepository pushTokenRepository;

  public ExpoPushService(PushTokenRepository pushTokenRepository) {
    this.restClient = RestClient.builder()
        .baseUrl(EXPO_PUSH_URL)
        .defaultHeader("Content-Type", "application/json")
        .build();
    this.pushTokenRepository = pushTokenRepository;
  }

  @Async("pushNotificationExecutor")
  @Transactional
  public void sendPushNotification(List<String> expoPushTokens, String title, String body, Map<String, Object> data) {
    if (expoPushTokens == null || expoPushTokens.isEmpty()) {
      return;
    }

    List<Map<String, Object>> messages = expoPushTokens.stream()
        .map(token -> {
          Map<String, Object> message = new java.util.HashMap<>();
          message.put("to", token);
          message.put("title", title);
          message.put("body", body);
          message.put("sound", "default");
          if (data != null) {
            message.put("data", data);
          }
          return message;
        })
        .toList();

    try {
      String response = restClient.post()
          .body(messages)
          .retrieve()
          .body(String.class);

      log.info("Expo push response: {}", response);
      handleResponse(response, expoPushTokens);
    } catch (Exception e) {
      log.error("Failed to send push notification via Expo: {}", e.getMessage(), e);
    }
  }

  private void handleResponse(String response, List<String> tokens) {
    if (response != null && response.contains("DeviceNotRegistered")) {
      for (String token : tokens) {
        if (response.contains(token) || tokens.size() == 1) {
          log.info("Removing stale push token: {}", token);
          pushTokenRepository.deleteByExpoPushToken(token);
        }
      }
    }
  }
}
