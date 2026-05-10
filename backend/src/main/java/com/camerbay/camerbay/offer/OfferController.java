package com.camerbay.camerbay.offer;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.camerbay.camerbay.auth.AuthenticationFacade;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/offers")
@RequiredArgsConstructor
@Slf4j
public class OfferController {

  private final OfferService offerService;
  private final AuthenticationFacade authFacade;

  @PostMapping
  public ResponseEntity<OfferResponse> createOffer(
      @Valid @RequestBody CreateOfferRequest request) {
    OfferResponse offer = offerService.createOffer(request, authFacade.getCurrentUserEmail());
    return ResponseEntity.status(HttpStatus.CREATED).body(offer);
  }

  @PatchMapping("/{id}")
  public ResponseEntity<OfferResponse> updateOffer(
      @PathVariable UUID id,
      @Valid @RequestBody UpdateOfferRequest request) {
    OfferResponse offer = offerService.updateOffer(id, request, authFacade.getCurrentUserEmail());
    return ResponseEntity.ok(offer);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteOffer(
      @PathVariable UUID id) {
    offerService.deleteOffer(id, authFacade.getCurrentUserEmail());
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/my-offers")
  public ResponseEntity<List<OfferResponse>> getMyOffers() {
    List<OfferResponse> offers = offerService.getMyOffers(authFacade.getCurrentUserEmail());
    return ResponseEntity.ok(offers);
  }

  @GetMapping("/{id}")
  public ResponseEntity<OfferResponse> getOffer(@PathVariable UUID id) {
    OfferResponse offer = offerService.getOfferById(id);
    return ResponseEntity.ok(offer);
  }

  @GetMapping("/search")
  public ResponseEntity<OfferListPaginatedResponse> searchOffers(
      @Valid SearchOffersRequest request) {
    return ResponseEntity.ok(offerService.searchOffers(request));
  }

  @GetMapping("/provider/{providerId}")
  public ResponseEntity<List<OfferResponse>> getProviderOffers(
      @PathVariable UUID providerId) {

    List<OfferResponse> offers = offerService.getOffersByProvider(providerId);
    return ResponseEntity.ok(offers);
  }
}