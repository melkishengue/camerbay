package com.camerbay.camerbay.offer;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Embedded;
import lombok.*;

import java.math.BigDecimal;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@EqualsAndHashCode
public class PricingItem {

  @Column(name = "item_title", nullable = false, length = 200)
  private String title;

  @Embedded
  private Price price;

  public static PricingItem of(String title, BigDecimal price) {
    return of(title, price, null);
  }

  public static PricingItem of(String title, BigDecimal price, BigDecimal promotionalPrice) {
    if (title == null || title.isBlank()) {
      throw new IllegalArgumentException("Pricing item title is required");
    }

    Price itemPrice = price != null
        ? Price.of(price, promotionalPrice)
        : Price.onQuote();

    return new PricingItem(title, itemPrice);
  }

  public boolean isOnQuote() {
    return this.price.isOnQuote();
  }

  public boolean hasPromotion() {
    return this.price.hasPromotion();
  }

  public static PricingItem fromRequest(PricingItemRequest request) {
    return PricingItem.of(request.title(), request.price().amount());
  }
}