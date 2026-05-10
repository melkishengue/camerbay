package com.camerbay.camerbay.chat;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
class ChatTokenResponse {
  private String token;
  private String apiKey;
  private String userId;
}
