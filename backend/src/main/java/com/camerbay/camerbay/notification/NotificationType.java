package com.camerbay.camerbay.notification;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum NotificationType {
  CHAT_MESSAGE,
  NEW_OFFER,
  NEW_OFFER_NEARBY,
  OFFER_STATUS_CHANGE,
  OFFER_REVIEW,
  SYSTEM_ANNOUNCEMENT;

  @JsonValue
  public String toValue() {
    return name().toLowerCase();
  }

  @JsonCreator
  public static NotificationType fromValue(String value) {
    if (value == null) return null;
    return valueOf(value.toUpperCase());
  }
}
