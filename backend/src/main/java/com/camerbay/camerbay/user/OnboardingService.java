package com.camerbay.camerbay.user;

import com.camerbay.camerbay.auth.AuthUser;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OnboardingService {

  private final UserRepository userRepository;

  @Transactional
  public UserProfileResponse completeOnboarding(AuthUser currentUser, OnboardingRequest request) {
    Optional<User> eventualUser = userRepository.findByEmail(currentUser.getEmail());
    if (!eventualUser.isPresent()) {
      throw new IllegalArgumentException("User does not exists");
    }

    User user = eventualUser.get();
    user.onboard(request);

    UserResponse userResponse = UserResponse.from(user);

    return UserProfileResponse.from(userResponse);
  }
}
