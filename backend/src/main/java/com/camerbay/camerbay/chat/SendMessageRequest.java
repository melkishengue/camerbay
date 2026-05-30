package com.camerbay.camerbay.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SendMessageRequest(
    @NotNull @NotBlank @Size(max = 5000) String text
) {}
