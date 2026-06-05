package com.camerbay.camerbay.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

  private final AuthService authService;

  /**
   * Exchanges a third-party idToken (Google) for a backend-issued JWT and refresh
   * token.
   *
   * <pre>
   * POST / api / v1 / auth / login
   * </pre>
   */
  @PostMapping("/login")
  public ResponseEntity<AppTokenResponse> login(@RequestBody LoginRequest request) {
    try {
      AppTokenResponse response = authService.login(request);
      return ResponseEntity.ok(response);
    } catch (IllegalArgumentException e) {
      log.error("Login bad request: {}", e.getMessage());
      return ResponseEntity.badRequest().build();
    } catch (Exception e) {
      log.error("Login failed", e);
      return ResponseEntity.status(401).build();
    }
  }

  /**
   * Issues a new access token and rotates the refresh token.
   *
   * <pre>
   * POST / api / v1 / auth / refresh
   * </pre>
   */
  @PostMapping("/refresh")
  public ResponseEntity<AppTokenResponse> refresh(@RequestBody RefreshRequest request) {
    try {
      AppTokenResponse response = authService.refresh(request);
      return ResponseEntity.ok(response);
    } catch (IllegalArgumentException e) {
      log.error("Refresh bad request: {}", e.getMessage());
      return ResponseEntity.badRequest().build();
    } catch (Exception e) {
      log.error("Token refresh failed", e);
      return ResponseEntity.status(401).build();
    }
  }

  /**
   * Revokes the provided refresh token.
   *
   * <pre>
   * POST / api / v1 / auth / logout
   * </pre>
   */
  @PostMapping("/logout")
  public ResponseEntity<Void> logout(@RequestBody LogoutRequest request) {
    try {
      authService.logout(request);
      return ResponseEntity.noContent().build();
    } catch (IllegalArgumentException e) {
      log.error("Logout bad request: {}", e.getMessage());
      return ResponseEntity.badRequest().build();
    } catch (Exception e) {
      log.error("Logout failed", e);
      return ResponseEntity.status(401).build();
    }
  }
}
