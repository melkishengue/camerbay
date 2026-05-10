package com.camerbay.camerbay.offer;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.camerbay.camerbay.category.Category;
import com.camerbay.camerbay.user.User;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "offers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder(access = AccessLevel.PRIVATE)
public class Offer {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "provider_id", nullable = false)
  private User provider;

  @Column(nullable = false, length = 200)
  private String title;

  @Column(columnDefinition = "TEXT", nullable = false)
  private String description;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "category_id", nullable = false)
  private Category category;

  @Embedded
  private Location location;

  @ElementCollection
  @CollectionTable(name = "offer_photos", joinColumns = @JoinColumn(name = "offer_id"))
  @Column(name = "photo_url", length = 500)
  @OrderColumn(name = "photo_order")
  private List<String> photos = new ArrayList<>();

  @ElementCollection
  @CollectionTable(name = "offer_pricing_items", joinColumns = @JoinColumn(name = "offer_id"))
  @OrderColumn(name = "pricing_order")
  private List<PricingItem> pricingList = new ArrayList<>();

  @Column(nullable = false)
  private Boolean active;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private LocalDateTime updatedAt;

  public static Offer create(
      User provider,
      String title,
      String description,
      Category category,
      LocationRequest location,
      List<String> photos,
      List<PricingItem> pricingItems) {

    if (provider == null) {
      throw new IllegalArgumentException("Provider is required");
    }

    if (!provider.getActive()) {
      throw new IllegalArgumentException("Provider must be active");
    }

    return Offer.builder()
        .provider(provider)
        .title(title)
        .description(description)
        .category(category)
        .photos(photos != null ? new ArrayList<>(photos) : new ArrayList<>())
        .pricingList(pricingItems != null ? new ArrayList<>(pricingItems) : new ArrayList<>())
        .active(true)
        .location(Location.of(location.city(), location.address(), location.latitude(), location.longitude()))
        .build();
  }

  public void update(UpdateOfferRequest updateRequest, Optional<Category> updateCategory) {
    updateRequest.getTitle().ifPresent(value -> title = value);
    updateRequest.getDescription().ifPresent(value -> description = value);
    updateCategory.ifPresent(value -> category = value);
    updateRequest.getPricingItems()
        .ifPresent(value -> pricingList = value.stream().map(PricingItem::fromRequest).toList());
    updateRequest.getPhotos().ifPresent(value -> photos = value);
    updateRequest.getLocation().ifPresent(value -> this.location.update(updateRequest.getLocation().get()));
    updateRequest.getActive().ifPresent(value -> active = value);
  }

  public void setPhotos(List<String> photos) {
    if (photos != null && photos.size() > 5) {
      throw new IllegalArgumentException("Maximum 5 photos allowed per offer");
    }
    this.photos = photos != null ? new ArrayList<>(photos) : new ArrayList<>();
  }

  public void addPricingItem(String itemTitle, BigDecimal price) {
    addPricingItem(itemTitle, price, null);
  }

  public void addPricingItem(String itemTitle, BigDecimal price, BigDecimal promotionalPrice) {
    if (itemTitle == null || itemTitle.isBlank()) {
      throw new IllegalArgumentException("Pricing item title cannot be empty");
    }

    PricingItem item = PricingItem.of(itemTitle, price, promotionalPrice);
    this.pricingList.add(item);
  }

  public void removePricingItem(int index) {
    if (index < 0 || index >= this.pricingList.size()) {
      throw new IllegalArgumentException("Invalid pricing item index");
    }

    this.pricingList.remove(index);
  }

  public void updatePricingItem(int index, String itemTitle, BigDecimal price, BigDecimal promotionalPrice) {
    if (index < 0 || index >= this.pricingList.size()) {
      throw new IllegalArgumentException("Invalid pricing item index");
    }

    PricingItem updatedItem = PricingItem.of(itemTitle, price, promotionalPrice);
    this.pricingList.set(index, updatedItem);
  }

  public void setPricingList(List<PricingItem> pricingList) {
    this.pricingList = pricingList != null ? new ArrayList<>(pricingList) : new ArrayList<>();
  }

  public void clearPricingList() {
    this.pricingList.clear();
  }

  public boolean hasPricingList() {
    return this.pricingList != null && !this.pricingList.isEmpty();
  }

  public void activate() {
    if (!this.provider.getActive()) {
      throw new IllegalStateException("Cannot activate offer for inactive provider");
    }
    this.active = true;
  }

  public void deactivate() {
    this.active = false;
  }
}