package com.camerbay.camerbay.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

record CreateChannelRequest(@NotNull @NotBlank String providerId) {
}
