package com.camerbay.camerbay.offer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PricingItemRequest(
                @NotBlank(message = "pricing_item.title.required") @Size(max = 200, message = "pricing_item.title.max_length") String title,

                @NotNull(message = "pricing_item.price.required") PriceRequest price) {
}