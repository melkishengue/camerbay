package com.camerbay.camerbay.chat;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.camerbay.camerbay.auth.AuthUser;
import com.camerbay.camerbay.user.UserResponse;
import com.camerbay.camerbay.user.UserService;

import io.getstream.chat.java.exceptions.StreamException;
import io.getstream.chat.java.models.Channel;
import io.getstream.chat.java.models.Channel.ChannelMemberRequestObject;
import io.getstream.chat.java.models.Channel.ChannelRequestObject;
import io.getstream.chat.java.models.User;
import io.getstream.chat.java.models.User.UserRequestObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class ChatService {

  private final UserService userService;

  @Value("${stream.key}")
  private String streamApiKey;

  @Value("${stream.secret}")
  private String streamApiSecret;

  public ChatTokenResponse generateToken(AuthUser user) {
    configureStreamCredentials();
    UserResponse userFromDB = userService.findByEmail(user.getEmail());
    String token = User.createToken(userFromDB.id().toString(), null, null);

    return new ChatTokenResponse(token, streamApiKey, userFromDB.id().toString());
  }

  public CreateChannelResponse createOrGetChannel(AuthUser currentUser, String providerId) {
    configureStreamCredentials();

    UserResponse userFromDB = userService.findByEmail(currentUser.getEmail());

    String channelId = generateChannelId(userFromDB.id().toString(), providerId);

    log.info("Channel: {}", channelId);

    try {
      createStreamChannel(currentUser, providerId, channelId);

      log.info("Channel created/retrieved: {} for users {} and {}",
          channelId, userFromDB.id().toString(), providerId);

      String channelCid = "messaging:" + channelId;
      return new CreateChannelResponse(channelId, channelCid);

    } catch (StreamException e) {
      log.error("Stream API error creating channel: {}", e.getMessage(), e);
      throw new ChatServiceException("Failed to create chat channel: " + e.getMessage(), e);
    } catch (Exception e) {
      log.error("Unexpected error creating channel", e);
      throw new ChatServiceException("Failed to create chat channel", e);
    }
  }

  private void createStreamChannel(AuthUser currentUser, String providerId, String channelId)
      throws StreamException {

    UserResponse userFromDB = userService.findByEmail(currentUser.getEmail());

    var channelCreator = UserRequestObject.builder()
        .id(userFromDB.id().toString())
        .name(currentUser.getName())
        .build();

    var hostUser = ChannelMemberRequestObject.builder()
        .userId(userFromDB.id().toString())
        .build();

    var guestUser = ChannelMemberRequestObject.builder()
        .userId(providerId)
        .build();

    Channel.getOrCreate("messaging", channelId)
        .data(
            ChannelRequestObject.builder()
                .createdBy(channelCreator)
                .members(List.of(hostUser, guestUser))
                .build())
        .request();
  }

  private String generateChannelId(String userId1, String userId2) {
    String sortedIds = List.of(userId1, userId2)
        .stream()
        .sorted()
        .reduce((a, b) -> a + "-" + b)
        .orElseThrow(() -> new IllegalArgumentException("Cannot generate channel ID"));

    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(sortedIds.getBytes(StandardCharsets.UTF_8));

      StringBuilder hexString = new StringBuilder();
      for (byte b : hash) {
        String hex = Integer.toHexString(0xff & b);
        if (hex.length() == 1)
          hexString.append('0');
        hexString.append(hex);
      }

      return hexString.toString();
    } catch (NoSuchAlgorithmException e) {
      throw new RuntimeException("SHA-256 algorithm not available", e);
    }
  }

  private void configureStreamCredentials() {
    System.setProperty("STREAM_KEY", streamApiKey);
    System.setProperty("STREAM_SECRET", streamApiSecret);
  }
}