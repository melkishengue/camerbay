package com.camerbay.camerbay.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateClientRequest(
        @NotBlank(message = "user.email.required") @Email(message = "user.email.invalid") String email,

        @NotBlank(message = "user.name.required") String name,

        @NotBlank(message = "user.phone.required") String phone) {
}