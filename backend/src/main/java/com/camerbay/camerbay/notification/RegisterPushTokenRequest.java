package com.camerbay.camerbay.notification;

import jakarta.validation.constraints.NotBlank;

public record RegisterPushTokenRequest(
    @NotBlank(message = "notification.push_token.required") String expoPushToken,
    @NotBlank(message = "notification.platform.required") String platform,
    String deviceId) {
}
