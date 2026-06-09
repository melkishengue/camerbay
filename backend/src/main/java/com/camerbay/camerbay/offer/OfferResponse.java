package com.camerbay.camerbay.offer;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.camerbay.camerbay.category.Category;

public record OfferResponse(
    UUID id,
    UUID providerId,
    String providerName,
    String providerPhotoImageUrl,
    String providerBusinessName,
    BigDecimal providerRating,
    Integer providerReviewCount,
    String title,
    String description,
    Category category,
    List<String> photos,
    List<PricingItem> pricingItems,
    Boolean active,
    LocationRequest location,
    String city,
    LocalDateTime createdAt) {
  public static OfferResponse from(Offer offer) {
    return new OfferResponse(
        offer.getId(),
        offer.getProvider().getId(),
        offer.getProvider().resolveProviderName(),
        offer.getProvider().getPhotoImageUrl(),
        offer.getProvider().getBusinessName(),
        offer.getProvider().getAverageRating(),
        offer.getProvider().getTotalReviewsCount(),
        offer.getTitle(),
        offer.getDescription(),
        offer.getCategory(),
        offer.getPhotos(),
        offer.getPricingList(),
        offer.getActive(),
        LocationRequest.fromLocation(offer.getLocation()),
        offer.getLocation().getCity(),
        offer.getCreatedAt());
  }
}