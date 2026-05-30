package com.camerbay.camerbay.user;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.camerbay.camerbay.auth.AuthSyncService;
import com.camerbay.camerbay.auth.AuthUser;
import com.camerbay.camerbay.auth.AuthenticationFacade;
import com.camerbay.camerbay.notification.NotificationService;
import com.camerbay.camerbay.notification.RegisterPushTokenRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

  private final UserService userService;
  private final AuthSyncService authSyncService;
  private final OnboardingService onboardingService;
  private final AuthenticationFacade authFacade;
  private final NotificationService notificationService;

  @GetMapping("/search")
  public ResponseEntity<ProviderListPaginatedResponse> searchProviders(
      @Valid SearchProvidersRequest request) {
    return ResponseEntity.ok(userService.searchProviders(request));
  }

  @GetMapping("/me")
  public ResponseEntity<UserProfileResponse> getCurrentUser() {
    try {
      UserProfileResponse profile = userService.getCurrentUserProfile(authFacade.getCurrentUserEmail());
      return ResponseEntity.ok(profile);
    } catch (IllegalArgumentException e) {
      return ResponseEntity.notFound().build();
    }
  }

  @GetMapping("/{id}/portfolio")
  public ResponseEntity<UserPortfolioResponse> getPortfolioImages(@PathVariable String id) {
    try {
      UserPortfolioResponse profile = userService.getUserPortfolioImages(UUID.fromString(id));
      return ResponseEntity.ok(profile);
    } catch (IllegalArgumentException e) {
      return ResponseEntity.notFound().build();
    }
  }

  @GetMapping("/{id}")
  public ResponseEntity<UserProfileResponse> getUser(@PathVariable String id) {
    try {
      UserProfileResponse profile = userService.getUserById(UUID.fromString(id));
      return ResponseEntity.ok(profile);
    } catch (IllegalArgumentException e) {
      return ResponseEntity.notFound().build();
    }
  }

  @PostMapping("/sync")
  public ResponseEntity<UserResponse> syncUser(
      @Valid @RequestBody SyncUserRequest request) {

    try {
      UserResponse response = authSyncService.syncUser(request.idToken());
      return ResponseEntity.status(HttpStatus.CREATED).body(response);
    } catch (Exception e) {
      log.error(e.getMessage());
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
  }

  @PostMapping("/onboarding")
  public ResponseEntity<UserProfileResponse> completeOnboarding(
      @Valid @RequestBody OnboardingRequest request) {

    AuthUser currentUser = authFacade.getCurrentUser();

    UserProfileResponse profile = onboardingService.completeOnboarding(currentUser, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(profile);
  }

  @PutMapping("/me")
  public ResponseEntity<UserProfileResponse> updateCurrentUser(
      @Valid @RequestBody UpdateUserRequest request) {
    AuthUser currentUser = authFacade.getCurrentUser();

    UserProfileResponse profile = userService.updateUser(currentUser, request);
    return ResponseEntity.ok(profile);
  }

  @PostMapping("/me/push-token")
  public ResponseEntity<Void> registerPushToken(
      @Valid @RequestBody RegisterPushTokenRequest request) {
    User user = userService.findUserByEmail(authFacade.getCurrentUserEmail());
    notificationService.registerPushToken(user.getId(), request);
    return ResponseEntity.ok().build();
  }
}