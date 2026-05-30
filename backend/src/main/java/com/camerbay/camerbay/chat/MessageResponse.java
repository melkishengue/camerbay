package com.camerbay.camerbay.chat;

import java.time.LocalDateTime;
import java.util.UUID;

public record MessageResponse(
    UUID id,
    UUID senderId,
    String senderName,
    String senderImageUrl,
    String text,
    LocalDateTime createdAt,
    boolean isRead
) {}
