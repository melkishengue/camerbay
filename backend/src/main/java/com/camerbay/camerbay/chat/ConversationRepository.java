package com.camerbay.camerbay.chat;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

  @Query(value = "SELECT c.id, c.created_at, c.last_message_at, c.last_message_text " +
                 "FROM conversations c " +
                 "JOIN conversation_members cm ON c.id = cm.conversation_id " +
                 "WHERE cm.user_id = :userId " +
                 "ORDER BY c.last_message_at DESC NULLS LAST",
         nativeQuery = true)
  List<Conversation> findAllByMemberId(@Param("userId") UUID userId);

  @Query(value = "SELECT c.id, c.created_at, c.last_message_at, c.last_message_text " +
                 "FROM conversations c " +
                 "JOIN conversation_members cm1 ON c.id = cm1.conversation_id AND cm1.user_id = :userId1 " +
                 "JOIN conversation_members cm2 ON c.id = cm2.conversation_id AND cm2.user_id = :userId2 " +
                 "LIMIT 1",
         nativeQuery = true)
  Optional<Conversation> findBetweenUsers(@Param("userId1") UUID userId1, @Param("userId2") UUID userId2);
}
