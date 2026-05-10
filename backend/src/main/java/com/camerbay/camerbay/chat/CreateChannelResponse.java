package com.camerbay.camerbay.chat;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
class CreateChannelResponse {
  private String channelId;
  private String channelCid;
}
