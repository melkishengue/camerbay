package com.camerbay.camerbay.user;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.camerbay.camerbay.offer.Location;

import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder(access = AccessLevel.PRIVATE)
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false, length = 100)
  private String authProviderId;

  @Column(nullable = false, unique = true, length = 255)
  private String email;

  @Column(nullable = false, length = 100)
  private String username;

  @Column(nullable = true, length = 100)
  private String name;

  @Embedded
  @Getter(AccessLevel.NONE)
  private PhoneNumber phoneNumber;

  @Column(length = 500)
  private String photoImageUrl;

  @Column(nullable = false)
  private Boolean active;

  @Column(nullable = false)
  private Boolean onBoardingCompleted;

  @Column(nullable = false)
  private Boolean isProvider;

  @Column(nullable = true, length = 200)
  private String businessName;

  @Column(nullable = true, columnDefinition = "TEXT")
  private String description;

  @Column(nullable = false)
  private Integer totalReviewsCount;

  @Column(precision = 3, scale = 2)
  private BigDecimal averageRating;

  @Embedded
  private Location location;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private LocalDateTime updatedAt;

  public String getPhoneNumberValue() {
    return phoneNumber != null ? phoneNumber.getValue() : null;
  }

  public static User createUserForAuth(String authProviderId, String email, String username,
      String name, String photoImageUrl) {
    return User.builder()
        .authProviderId(authProviderId)
        .email(email)
        .username(username)
        .name(name)
        .photoImageUrl(photoImageUrl)
        .totalReviewsCount(0)
        .averageRating(BigDecimal.ZERO)
        .active(true)
        .onBoardingCompleted(false)
        .isProvider(true)
        .build();
  }

  /**
   * Updates name and photo from the auth provider only when the fields are not yet set.
   * Preserves any manually entered data.
   */
  public void updateFromProvider(String name, String photoImageUrl) {
    if (this.name == null && name != null) {
      this.name = name;
    }
    if (this.photoImageUrl == null && photoImageUrl != null) {
      this.photoImageUrl = photoImageUrl;
    }
  }

  public void updateUser(UpdateUserRequest updateRequest) {
    updateRequest.getBusinessName().ifPresent(value -> businessName = value);
    updateRequest.getName().ifPresent(value -> name = value);
    updateRequest.getDescription().ifPresent(value -> description = value);
    updateRequest.getPhone().ifPresent(value -> phoneNumber = PhoneNumber.of(value));
    updateRequest.getPhotoImageUrl().ifPresent(value -> photoImageUrl = value);
    updateRequest.getLocation().ifPresent(value -> {
      if (this.location == null) {
        this.location = Location.of(value.city(), value.address(), value.latitude(), value.longitude());
      } else {
        this.location.update(value);
      }
    });
  }

  public void onboard(OnboardingRequest request) {
    if (request.name() != null && !request.name().isBlank()) {
      this.name = request.name();
    }

    if (request.photoImageUrl() != null) {
      this.photoImageUrl = request.photoImageUrl();
    }

    if (request.phone() != null) {
      this.phoneNumber = PhoneNumber.of(request.phone());
    }

    if (request.description() != null) {
      this.description = request.description();
    }

    if (request.businessName() != null) {
      this.businessName = request.businessName();
    }

    this.onBoardingCompleted = true;
  }

  public void deactivate() {
    this.active = false;
  }

  public void activate() {
    this.active = true;
  }
}