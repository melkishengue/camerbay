package com.camerbay.camerbay.offer;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;

public record PriceRequest(@NotNull(message = "price.amount.required") BigDecimal amount,
    BigDecimal promotionalAmount) {
}
