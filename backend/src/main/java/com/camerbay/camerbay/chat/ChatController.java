package com.camerbay.camerbay.chat;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

  @GetMapping("/token")
  public ResponseEntity<ChatTokenResponse> getStreamToken() {
    AuthUser currentUser = authFacade.getCurrentUser();

    ChatTokenResponse response = chatService.generateToken(currentUser);

    return ResponseEntity.ok(response);
  }

  @PostMapping("/channels")
  public ResponseEntity<CreateChannelResponse> createChannel(
      @Valid @RequestBody CreateChannelRequest request) {

    log.info("request: {}", request);

    AuthUser currentUser = authFacade.getCurrentUser();

    CreateChannelResponse response = chatService.createOrGetChannel(
        currentUser,
        request.providerId());

    return ResponseEntity.ok(response);
  }
}