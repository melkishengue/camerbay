package com.camerbay.camerbay.auth;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.camerbay.camerbay.user.User;
import com.camerbay.camerbay.user.UserRepository;
import com.nimbusds.jwt.JWTClaimsSet;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

  private final GoogleTokenVerifier googleTokenVerifier;
  private final AppJwtService appJwtService;
  private final UserRepository userRepository;
  private final RefreshTokenRepository refreshTokenRepository;

  @Value("${app.auth.refresh-token.expiry-days:30}")
  private int refreshTokenExpiryDays;

  /**
   * Authenticates a user via a third-party idToken, syncs the user record, and
   * issues a backend access token plus a refresh token.
   *
   * @param request login payload — only {@code google} provider is supported
   * @return a pair of access and refresh tokens
   */
  @Transactional
  public AppTokenResponse login(LoginRequest request) {
    if (!"google".equalsIgnoreCase(request.provider())) {
      throw new IllegalArgumentException("Unsupported provider: " + request.provider());
    }

    JWTClaimsSet claims = googleTokenVerifier.verify(request.idToken());

    String sub = claims.getSubject();
    String email = getStringClaim(claims, "email");
    String name = getStringClaim(claims, "name");
    String photoImageUrl = getStringClaim(claims, "picture");

    // Derive a username from the email prefix when name is absent
    String username = (name != null && !name.isBlank()) ? name : deriveUsername(email);

    userRepository.findByAuthProviderId(sub).ifPresentOrElse(
        existing -> log.info("Existing user authenticated: {}", existing.getEmail()),
        () -> {
          log.info("Creating new user for authProviderId={}", sub);
          userRepository.save(User.createUserForAuth(sub, email, username, name, photoImageUrl));
        });

    String accessToken = appJwtService.generateToken(email, name);
    RefreshToken refreshToken = refreshTokenRepository.save(
        RefreshToken.create(email, refreshTokenExpiryDays));

    return new AppTokenResponse(accessToken, refreshToken.getId().toString(),
        appJwtService.getExpirySeconds());
  }

  /**
   * Issues a new access token and rotates the refresh token.
   *
   * @param request contains the current (non-revoked) refresh token UUID
   * @return fresh token pair
   */
  @Transactional
  public AppTokenResponse refresh(RefreshRequest request) {
    UUID tokenId = parseUuid(request.refreshToken());

    RefreshToken existing = refreshTokenRepository.findByIdAndRevokedFalse(tokenId)
        .orElseThrow(() -> new RuntimeException("Refresh token not found or already revoked"));

    if (existing.getExpiresAt().isBefore(LocalDateTime.now())) {
      throw new RuntimeException("Refresh token has expired");
    }

    String email = existing.getUserEmail();
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("User not found for email: " + email));

    // Revoke old token and issue a new one (rotation)
    existing.revoke();
    refreshTokenRepository.save(existing);

    String accessToken = appJwtService.generateToken(email, user.getName());
    RefreshToken newRefreshToken = refreshTokenRepository.save(
        RefreshToken.create(email, refreshTokenExpiryDays));

    return new AppTokenResponse(accessToken, newRefreshToken.getId().toString(),
        appJwtService.getExpirySeconds());
  }

  /**
   * Revokes the provided refresh token, effectively logging the user out of this session.
   *
   * @param request contains the refresh token UUID to invalidate
   */
  @Transactional
  public void logout(LogoutRequest request) {
    UUID tokenId = parseUuid(request.refreshToken());

    refreshTokenRepository.findById(tokenId).ifPresent(token -> {
      token.revoke();
      refreshTokenRepository.save(token);
      log.info("Refresh token revoked for user {}", token.getUserEmail());
    });
  }

  // ── helpers ──────────────────────────────────────────────────────────────────

  private String deriveUsername(String email) {
    if (email == null || !email.contains("@")) {
      return email;
    }
    return email.substring(0, email.indexOf('@'));
  }

  private UUID parseUuid(String value) {
    try {
      return UUID.fromString(value);
    } catch (IllegalArgumentException e) {
      throw new RuntimeException("Invalid refresh token format", e);
    }
  }

  private String getStringClaim(JWTClaimsSet claims, String name) {
    try {
      return claims.getStringClaim(name);
    } catch (Exception e) {
      log.warn("Could not read claim '{}' from token", name);
      return null;
    }
  }
}
