package com.camerbay.camerbay.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateConversationRequest(
    @NotNull @NotBlank String otherUserId
) {}
