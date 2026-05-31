package com.camerbay.camerbay.like;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.camerbay.camerbay.offer.Offer;
import com.camerbay.camerbay.offer.OfferListPaginatedResponse;
import com.camerbay.camerbay.user.User;
import com.camerbay.camerbay.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LikeService {

  private final OfferLikeRepository likeRepository;
  private final UserRepository userRepository;

  @Transactional
  public void likeOffer(UUID offerId, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    if (likeRepository.existsByUserIdAndOfferId(user.getId(), offerId)) {
      return;
    }

    likeRepository.save(OfferLike.of(user.getId(), offerId));
  }

  @Transactional
  public void unlikeOffer(UUID offerId, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    likeRepository.findByUserIdAndOfferId(user.getId(), offerId)
        .ifPresent(likeRepository::delete);
  }

  public OfferListPaginatedResponse getLikedOffers(String email, int page, int size) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    Page<Offer> offers = likeRepository.findLikedOffersByUserId(
        user.getId(), PageRequest.of(page, size));

    return OfferListPaginatedResponse.fromPage(offers);
  }
}
