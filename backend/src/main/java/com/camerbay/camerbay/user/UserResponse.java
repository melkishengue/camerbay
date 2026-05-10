package com.camerbay.camerbay.user;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String email,
    String name,
    String username,
    String phone,
    String profilePhotoUrl,
    Boolean active,
    Boolean onBoardingCompleted,
    Boolean isProvider,
    String description,
    String businessName,
    Integer totalReviewsCount,
    BigDecimal averageRating,
    LocalDateTime createdAt) {
  public static UserResponse from(User user) {
    return new UserResponse(
        user.getId(),
        user.getEmail(),
        user.getName(),
        user.getUsername(),
        user.getPhoneNumberValue(),
        user.getPhotoImageUrl(),
        user.getActive(),
        user.getOnBoardingCompleted(),
        user.getIsProvider(),
        user.getDescription(),
        user.getBusinessName(),
        user.getTotalReviewsCount(),
        user.getAverageRating(),
        user.getCreatedAt());
  }
}
