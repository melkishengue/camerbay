package com.camerbay.camerbay.user;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.camerbay.camerbay.auth.AuthUser;
import com.camerbay.camerbay.offer.OfferService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserService {

  private final UserRepository userRepository;
  private final OfferService offerService;

  public UserResponse findById(UUID id) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
    return UserResponse.from(user);
  }

  public UserResponse findByEmail(String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
    return UserResponse.from(user);
  }

  public User findUserByEmail(String email) {
    return userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
  }

  public Optional<UserResponse> findByEmailOptional(String email) {
    return userRepository.findByEmail(email)
        .map(UserResponse::from);
  }

  public UserProfileResponse getCurrentUserProfile(String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    UserResponse userResponse = UserResponse.from(user);
    return UserProfileResponse.from(userResponse);
  }

  public UserPortfolioResponse getUserPortfolioImages(UUID id) {
    userRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    List<String> photos = offerService.getOfferPhotosByProvider(id);

    return UserPortfolioResponse.fromList(photos);
  }

  public UserProfileResponse getUserById(UUID id) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("User not found for id" + id.toString()));

    UserResponse userResponse = UserResponse.from(user);
    return UserProfileResponse.from(userResponse);
  }

  @Transactional
  public UserProfileResponse updateUser(AuthUser currentUser, UpdateUserRequest request) {
    User user = userRepository.findByEmail(currentUser.getEmail())
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    user.updateUser(request);

    UserResponse userResponse = UserResponse.from(user);
    return UserProfileResponse.from(userResponse);
  }
}
