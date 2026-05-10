package com.camerbay.camerbay.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCategoryRequest(
    @NotBlank String title,
    @NotNull CategoryEnum name) {
}
