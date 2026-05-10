package com.camerbay.camerbay.user;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record UserProfileResponse(
    UUID id,
    String email,
    String profilePhotoUrl,
    String name,
    String username,
    String phone,
    Boolean active,
    Boolean onBoardingCompleted,
    Boolean isProvider,
    String businessName,
    String description,
    Integer totalReviewsCount,
    BigDecimal averageRating,
    LocalDateTime createdAt) {
  public static UserProfileResponse from(UserResponse user) {
    return new UserProfileResponse(
        user.id(),
        user.email(),
        user.profilePhotoUrl(),
        user.name(),
        user.username(),
        user.phone(),
        user.active(),
        user.onBoardingCompleted(),
        user.isProvider(),
        user.businessName(),
        user.description(),
        user.totalReviewsCount(),
        user.averageRating(),
        user.createdAt());
  }
}