package com.camerbay.camerbay.chat;

import java.time.LocalDateTime;
import java.util.UUID;

public record ConversationSummaryResponse(
    UUID id,
    ParticipantInfo otherParticipant,
    String lastMessageText,
    LocalDateTime lastMessageAt,
    long unreadCount
) {
  public record ParticipantInfo(UUID id, String name, String imageUrl) {}
}
