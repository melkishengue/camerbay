package com.camerbay.camerbay.offer;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.camerbay.camerbay.category.Category;
import com.camerbay.camerbay.category.CategoryRepository;
import com.camerbay.camerbay.notification.NotificationService;
import com.camerbay.camerbay.notification.NotificationType;
import com.camerbay.camerbay.user.User;
import com.camerbay.camerbay.user.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class OfferService {

  private static final int MAX_ACTIVE_OFFERS_PER_PROVIDER = 50;

  private final OfferRepository offerRepository;
  private final UserRepository userRepository;
  private final CategoryRepository categoryRepository;
  private final NotificationService notificationService;

  @Transactional
  public OfferResponse createOffer(CreateOfferRequest request, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    long activeOffersCount = offerRepository.countActiveByProviderId(user.getId());
    if (activeOffersCount >= MAX_ACTIVE_OFFERS_PER_PROVIDER) {
      throw new IllegalArgumentException("Maximum " + MAX_ACTIVE_OFFERS_PER_PROVIDER + " active offers allowed");
    }

    List<PricingItem> pricingItems = new ArrayList();
    if (request.pricingItems() != null) {
      pricingItems = request.pricingItems().stream().map(PricingItem::fromRequest).toList();
    }

    Category category = categoryRepository.findById(request.categoryId())
        .orElseThrow(() -> new IllegalArgumentException("Category not found"));

    Offer offer = Offer.create(
        user,
        request.title(),
        request.description(),
        category,
        request.location(),
        request.photos(),
        pricingItems);

    Offer savedOffer = offerRepository.save(offer);

    notifyAllUsersNewOffer(savedOffer);

    return OfferResponse.from(savedOffer);
  }

  private void notifyAllUsersNewOffer(Offer offer) {
    try {
      java.util.Map<String, Object> data = java.util.Map.of(
          "type", "new_offer",
          "offerId", offer.getId().toString());

      notificationService.broadcastNotification(
          NotificationType.NEW_OFFER,
          "Nouvelle offre disponible",
          offer.getTitle(),
          data);
    } catch (Exception e) {
      log.error("Failed to broadcast new offer notification: {}", e.getMessage(), e);
    }
  }

  @Transactional
  public OfferResponse updateOffer(UUID offerId, UpdateOfferRequest request, String email) {
    Offer offer = offerRepository.findByIdWithProvider(offerId)
        .orElseThrow(() -> new IllegalArgumentException("Offer not found"));

    validateOwnership(offer, email);

    Optional<Category> category = Optional.empty();
    if (request.getCategoryId().isPresent()) {
      UUID categoryId = UUID.fromString(request.getCategoryId().get());
      category = categoryRepository.findById(categoryId);
    }

    offer.update(request, category);
    return OfferResponse.from(offer);
  }

  @Transactional
  public void deleteOffer(UUID offerId, String email) {
    Offer offer = offerRepository.findByIdWithProvider(offerId)
        .orElseThrow(() -> new IllegalArgumentException("Offer not found"));

    validateOwnership(offer, email);

    offer.deactivate();
  }

  public OfferResponse getOfferById(UUID id) {
    Offer offer = offerRepository.findByIdWithProvider(id)
        .orElseThrow(() -> new IllegalArgumentException("Offer not found"));

    return OfferResponse.from(offer);
  }

  public List<OfferResponse> getOffersByProvider(UUID providerId) {
    List<Offer> offers = offerRepository.findByProviderIdWithProvider(providerId);
    return offers.stream()
        .map(OfferResponse::from)
        .toList();
  }

  public List<String> getOfferPhotosByProvider(UUID providerId) {
    List<String> photos = offerRepository.findUniquePhotoUrlsByProviderId(providerId);

    return photos;
  }

  public List<OfferResponse> getMyOffers(String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    List<Offer> offers = offerRepository.findByProviderIdWithProvider(user.getId());
    return offers.stream()
        .map(OfferResponse::from)
        .toList();
  }

  public OfferListPaginatedResponse searchOffers(SearchOffersRequest request) {
    Pageable pageable = PageRequest.of(request.page(), request.size());
    String categoryId = request.categoryId() != null ? request.categoryId().toString() : null;

    Page<Offer> offers;
    if (request.hasLocation()) {
      log.info("radius is {}", request);
      offers = offerRepository.searchWithLocation(
          request.searchText(),
          categoryId,
          request.latitude(),
          request.longitude(),
          request.radiusMeters(),
          pageable);
    } else {
      offers = offerRepository.searchWithoutLocation(
          request.searchText(),
          categoryId,
          pageable);
    }

    return OfferListPaginatedResponse.fromPage(offers);
  }

  private void validateOwnership(Offer offer, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    if (!offer.getProvider().getId().equals(user.getId())) {
      throw new IllegalArgumentException("You don't have permission to modify this offer");
    }
  }
}