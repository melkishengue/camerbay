package com.camerbay.camerbay.chat;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

  Page<ChatMessage> findByConversationIdOrderByCreatedAtDesc(UUID conversationId, Pageable pageable);

  @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.conversationId = :convId AND m.senderId != :userId AND m.isRead = false")
  long countUnread(@Param("convId") UUID convId, @Param("userId") UUID userId);

  @Query(value = "SELECT COUNT(m.*) FROM chat_messages m " +
                 "JOIN conversation_members cm ON m.conversation_id = cm.conversation_id " +
                 "WHERE cm.user_id = :userId AND m.sender_id != :userId AND m.is_read = false",
         nativeQuery = true)
  Long countTotalUnreadForUser(@Param("userId") UUID userId);

  @Modifying
  @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.conversationId = :convId AND m.senderId != :userId AND m.isRead = false")
  void markAllAsRead(@Param("convId") UUID convId, @Param("userId") UUID userId);
}
