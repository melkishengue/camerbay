package com.camerbay.camerbay.offer;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateOfferRequest(
    @NotBlank(message = "offer.title.required") @Size(max = 200, message = "offer.title.max_length") String title,

    @NotBlank(message = "offer.description.required") String description,

    @NotNull(message = "offer.category.required") UUID categoryId,

    @NotNull(message = "offer.location.required") LocationRequest location,

    @Valid @Size(max = 20, message = "offer.pricing_items.max_size") List<PricingItemRequest> pricingItems,

    @Size(max = 10, message = "offer.photos.max_size") List<String> photos) {
}
