package com.camerbay.camerbay.offer;

import java.math.BigDecimal;
import java.util.Objects;

import com.camerbay.camerbay.BusinessException;
import com.camerbay.camerbay.ErrorCode;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Price {

  private static final BigDecimal MIN_PRICE = BigDecimal.ZERO;
  private static final BigDecimal MAX_PRICE = BigDecimal.valueOf(100000);

  @Column(name = "price", precision = 10, scale = 2)
  private BigDecimal amount;

  @Column(name = "promotional_price", precision = 10, scale = 2)
  private BigDecimal promotionalAmount;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Currency currency;

  public static Price of(BigDecimal amount) {
    return of(amount, null);
  }

  public static Price of(BigDecimal amount, BigDecimal promotionalAmount) {
    if (amount != null) {
      validateAmount(amount);
    }
    if (promotionalAmount != null) {
      validateAmount(promotionalAmount);
      if (amount != null && promotionalAmount.compareTo(amount) >= 0) {
        throw new BusinessException(ErrorCode.PRICE_PROMO_INVALID,
            "Promotional price must be less than regular price");
      }
    }
    return new Price(amount, promotionalAmount, Currency.EUR);
  }

  public static Price onQuote() {
    return new Price(null, null, Currency.EUR);
  }

  private static void validateAmount(BigDecimal amount) {
    if (amount.compareTo(MIN_PRICE) < 0) {
      throw new BusinessException(ErrorCode.PRICE_NEGATIVE, "Price cannot be negative");
    }
    if (amount.compareTo(MAX_PRICE) > 0) {
      throw new BusinessException(ErrorCode.PRICE_EXCEEDS_MAX, "Price cannot exceed " + MAX_PRICE);
    }
  }

  public boolean isOnQuote() {
    return amount == null;
  }

  public BigDecimal getEffectivePrice() {
    if (promotionalAmount != null) {
      return promotionalAmount;
    }
    return amount;
  }

  public boolean hasPromotion() {
    return promotionalAmount != null;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (o == null || getClass() != o.getClass())
      return false;
    Price price = (Price) o;
    return Objects.equals(amount, price.amount) &&
        Objects.equals(promotionalAmount, price.promotionalAmount);
  }

  @Override
  public int hashCode() {
    return Objects.hash(amount, promotionalAmount);
  }
}