package com.camerbay.camerbay.chat;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.camerbay.camerbay.auth.AuthUser;
import com.camerbay.camerbay.auth.AuthenticationFacade;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

  private final AuthenticationFacade authFacade;
  private final ChatService chatService;

  @GetMapping("/conversations")
  public ResponseEntity<List<ConversationSummaryResponse>> getConversations() {
    AuthUser currentUser = authFacade.getCurrentUser();
    return ResponseEntity.ok(chatService.getConversations(currentUser));
  }

  @PostMapping("/conversations")
  public ResponseEntity<ConversationSummaryResponse> createConversation(
      @Valid @RequestBody CreateConversationRequest request) {
    AuthUser currentUser = authFacade.getCurrentUser();
    ConversationSummaryResponse response = chatService.createOrGetConversation(currentUser, request.otherUserId());
    return ResponseEntity.ok(response);
  }

  @GetMapping("/conversations/{conversationId}/messages")
  public ResponseEntity<Page<MessageResponse>> getMessages(
      @PathVariable UUID conversationId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "30") int size) {
    AuthUser currentUser = authFacade.getCurrentUser();
    return ResponseEntity.ok(chatService.getMessages(currentUser, conversationId, page, size));
  }

  @PostMapping("/conversations/{conversationId}/messages")
  public ResponseEntity<MessageResponse> sendMessage(
      @PathVariable UUID conversationId,
      @Valid @RequestBody SendMessageRequest request) {
    AuthUser currentUser = authFacade.getCurrentUser();
    return ResponseEntity.ok(chatService.sendMessage(currentUser, conversationId, request.text()));
  }

  @PutMapping("/conversations/{conversationId}/read")
  public ResponseEntity<Void> markAsRead(@PathVariable UUID conversationId) {
    AuthUser currentUser = authFacade.getCurrentUser();
    chatService.markAsRead(currentUser, conversationId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/unread")
  public ResponseEntity<UnreadCountResponse> getUnreadCount() {
    AuthUser currentUser = authFacade.getCurrentUser();
    long count = chatService.getTotalUnread(currentUser);
    return ResponseEntity.ok(new UnreadCountResponse(count));
  }
}
