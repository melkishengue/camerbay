package com.camerbay.camerbay.chat;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "conversations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Conversation {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ElementCollection
  @CollectionTable(name = "conversation_members", joinColumns = @JoinColumn(name = "conversation_id"))
  @Column(name = "user_id")
  private Set<UUID> memberIds = new HashSet<>();

  @Column(nullable = true)
  private LocalDateTime lastMessageAt;

  @Column(nullable = true, columnDefinition = "TEXT")
  private String lastMessageText;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  public static Conversation create(UUID userId1, UUID userId2) {
    Conversation c = new Conversation();
    c.memberIds = new HashSet<>();
    c.memberIds.add(userId1);
    c.memberIds.add(userId2);
    return c;
  }

  public void updateLastMessage(String text, LocalDateTime at) {
    this.lastMessageText = text;
    this.lastMessageAt = at;
  }
}
