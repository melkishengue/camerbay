package com.camerbay.camerbay.user;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ProviderPublicResponse(
    UUID id,
    String profilePhotoUrl,
    String name,
    String username,
    String businessName,
    String description,
    Integer totalReviewsCount,
    BigDecimal averageRating,
    String city,
    LocalDateTime createdAt) {

  public static ProviderPublicResponse from(User user) {
    return new ProviderPublicResponse(
        user.getId(),
        user.getPhotoImageUrl(),
        user.getName(),
        user.getUsername(),
        user.getBusinessName(),
        user.getDescription(),
        user.getTotalReviewsCount(),
        user.getAverageRating(),
        user.getLocation() != null ? user.getLocation().getCity() : null,
        user.getCreatedAt());
  }
}
