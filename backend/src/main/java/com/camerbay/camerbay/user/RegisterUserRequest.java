package com.camerbay.camerbay.user;

import java.util.List;

import jakarta.validation.constraints.NotBlank;

public record RegisterUserRequest(
    @NotBlank String userId,
    @NotBlank String preferredUsername,
    @NotBlank String email,
    String name,
    @NotBlank List<String> roles // aka groups
) {
}
