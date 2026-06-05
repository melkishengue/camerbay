package com.camerbay.camerbay.chat;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.camerbay.camerbay.BusinessException;
import com.camerbay.camerbay.ErrorCode;
import com.camerbay.camerbay.NotFoundException;
import com.camerbay.camerbay.auth.AuthUser;
import com.camerbay.camerbay.notification.NotificationService;
import com.camerbay.camerbay.notification.NotificationType;
import com.camerbay.camerbay.user.UserResponse;
import com.camerbay.camerbay.user.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

  private final UserService userService;
  private final ConversationRepository conversationRepository;
  private final ChatMessageRepository messageRepository;
  private final NotificationService notificationService;

  public List<ConversationSummaryResponse> getConversations(AuthUser currentUser) {
    UserResponse me = userService.findByEmail(currentUser.getEmail());
    List<Conversation> conversations = conversationRepository.findAllByMemberId(me.id());

    return conversations.stream()
        .map(conv -> buildSummary(conv, me))
        .toList();
  }

  @Transactional
  public ConversationSummaryResponse createOrGetConversation(AuthUser currentUser, String otherUserId) {
    UserResponse me = userService.findByEmail(currentUser.getEmail());
    UUID otherId = UUID.fromString(otherUserId);

    Conversation conversation = conversationRepository
        .findBetweenUsers(me.id(), otherId)
        .orElseGet(() -> {
          Conversation newConv = Conversation.create(me.id(), otherId);
          return conversationRepository.save(newConv);
        });

    return buildSummary(conversation, me);
  }

  public Page<MessageResponse> getMessages(AuthUser currentUser, UUID conversationId, int page, int size) {
    UserResponse me = userService.findByEmail(currentUser.getEmail());
    Conversation conv = conversationRepository.findById(conversationId)
        .orElseThrow(() -> new NotFoundException(ErrorCode.CONVERSATION_NOT_FOUND, "Conversation not found"));

    if (!conv.getMemberIds().contains(me.id())) {
      throw new BusinessException(ErrorCode.CONVERSATION_ACCESS_DENIED, "Not a member of this conversation");
    }

    return messageRepository
        .findByConversationIdOrderByCreatedAtDesc(conversationId, PageRequest.of(page, size))
        .map(msg -> toMessageResponse(msg, me.id()));
  }

  @Transactional
  public MessageResponse sendMessage(AuthUser currentUser, UUID conversationId, String text) {
    UserResponse me = userService.findByEmail(currentUser.getEmail());
    Conversation conv = conversationRepository.findById(conversationId)
        .orElseThrow(() -> new NotFoundException(ErrorCode.CONVERSATION_NOT_FOUND, "Conversation not found"));

    if (!conv.getMemberIds().contains(me.id())) {
      throw new BusinessException(ErrorCode.CONVERSATION_ACCESS_DENIED, "Not a member of this conversation");
    }

    ChatMessage message = ChatMessage.create(conversationId, me.id(), text);
    message = messageRepository.save(message);

    conv.updateLastMessage(text, message.getCreatedAt());
    conversationRepository.save(conv);

    UUID recipientId = conv.getMemberIds().stream()
        .filter(id -> !id.equals(me.id()))
        .findFirst()
        .orElse(null);

    if (recipientId != null) {
      String senderDisplayName = me.name() != null ? me.name()
          : me.businessName() != null ? me.businessName() : me.username();
      notificationService.sendNotification(
          recipientId,
          NotificationType.CHAT_MESSAGE,
          "Nouveau message de " + senderDisplayName,
          text,
          Map.of("type", "chat_message", "channelId", conversationId.toString())
      );
    }

    return toMessageResponse(message, me.id());
  }

  @Transactional
  public void markAsRead(AuthUser currentUser, UUID conversationId) {
    UserResponse me = userService.findByEmail(currentUser.getEmail());
    messageRepository.markAllAsRead(conversationId, me.id());
  }

  public long getTotalUnread(AuthUser currentUser) {
    UserResponse me = userService.findByEmail(currentUser.getEmail());
    Long count = messageRepository.countTotalUnreadForUser(me.id());
    return count != null ? count : 0L;
  }

  private ConversationSummaryResponse buildSummary(Conversation conv, UserResponse me) {
    UUID otherId = conv.getMemberIds().stream()
        .filter(id -> !id.equals(me.id()))
        .findFirst()
        .orElse(null);

    ConversationSummaryResponse.ParticipantInfo otherInfo = null;
    if (otherId != null) {
      try {
        UserResponse other = userService.findById(otherId);
        String name = other.name() != null ? other.name() :
                      other.businessName() != null ? other.businessName() : other.username();
        otherInfo = new ConversationSummaryResponse.ParticipantInfo(other.id(), name, other.profilePhotoUrl());
      } catch (Exception e) {
        log.warn("Could not find other participant {}", otherId);
        otherInfo = new ConversationSummaryResponse.ParticipantInfo(otherId, "Utilisateur", null);
      }
    }

    long unread = otherId != null ? messageRepository.countUnread(conv.getId(), me.id()) : 0;

    return new ConversationSummaryResponse(
        conv.getId(),
        otherInfo,
        conv.getLastMessageText(),
        conv.getLastMessageAt(),
        unread
    );
  }

  private MessageResponse toMessageResponse(ChatMessage msg, UUID currentUserId) {
    String senderName = null;
    String senderImageUrl = null;
    try {
      UserResponse sender = userService.findById(msg.getSenderId());
      senderName = sender.name() != null ? sender.name() :
                   sender.businessName() != null ? sender.businessName() : sender.username();
      senderImageUrl = sender.profilePhotoUrl();
    } catch (Exception e) {
      log.warn("Could not find sender {}", msg.getSenderId());
    }

    return new MessageResponse(
        msg.getId(),
        msg.getSenderId(),
        senderName,
        senderImageUrl,
        msg.getText(),
        msg.getCreatedAt(),
        msg.isRead()
    );
  }
}
