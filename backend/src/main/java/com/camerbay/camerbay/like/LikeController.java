package com.camerbay.camerbay.like;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.camerbay.camerbay.auth.AuthenticationFacade;
import com.camerbay.camerbay.offer.OfferListPaginatedResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class LikeController {

  private final LikeService likeService;
  private final AuthenticationFacade authFacade;

  @PostMapping("/offers/{id}/like")
  public ResponseEntity<Void> likeOffer(@PathVariable UUID id) {
    likeService.likeOffer(id, authFacade.getCurrentUserEmail());
    return ResponseEntity.ok().build();
  }

  @DeleteMapping("/offers/{id}/like")
  public ResponseEntity<Void> unlikeOffer(@PathVariable UUID id) {
    likeService.unlikeOffer(id, authFacade.getCurrentUserEmail());
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/users/me/liked-offers")
  public ResponseEntity<OfferListPaginatedResponse> getLikedOffers(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    OfferListPaginatedResponse response = likeService.getLikedOffers(
        authFacade.getCurrentUserEmail(), page, size);
    return ResponseEntity.ok(response);
  }
}
