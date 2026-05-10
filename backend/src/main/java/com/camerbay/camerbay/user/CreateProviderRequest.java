package com.camerbay.camerbay.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateProviderRequest(
    @NotBlank(message = "Email is required") @Email(message = "Email must be valid") String email,

    @NotBlank(message = "Name is required") String name,

    @NotBlank(message = "Phone number is required") String phone) {
}