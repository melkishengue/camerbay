package com.camerbay.camerbay.chat;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "chat_messages")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatMessage {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false)
  private UUID conversationId;

  @Column(nullable = false)
  private UUID senderId;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String text;

  @Column(nullable = false)
  private boolean isRead = false;

  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  public static ChatMessage create(UUID conversationId, UUID senderId, String text) {
    ChatMessage m = new ChatMessage();
    m.conversationId = conversationId;
    m.senderId = senderId;
    m.text = text;
    m.createdAt = LocalDateTime.now();
    return m;
  }

  public void markRead() {
    this.isRead = true;
  }
}
