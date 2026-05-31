package com.camerbay.camerbay.auth;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "refresh_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder(access = AccessLevel.PRIVATE)
public class RefreshToken {

  @Id
  private UUID id;

  @Column(nullable = false)
  private String userEmail;

  @Column(nullable = false)
  private LocalDateTime expiresAt;

  @Column(nullable = false)
  @Builder.Default
  private boolean revoked = false;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  public static RefreshToken create(String userEmail, int expiryDays) {
    return RefreshToken.builder()
        .id(UUID.randomUUID())
        .userEmail(userEmail)
        .expiresAt(LocalDateTime.now().plusDays(expiryDays))
        .revoked(false)
        .build();
  }

  public void revoke() {
    this.revoked = true;
  }
}
