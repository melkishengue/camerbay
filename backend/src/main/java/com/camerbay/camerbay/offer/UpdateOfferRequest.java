package com.camerbay.camerbay.offer;

import java.util.List;
import java.util.Optional;

import lombok.Data;

@Data
public class UpdateOfferRequest {
  private Optional<String> title = Optional.empty();
  private Optional<String> description = Optional.empty();
  private Optional<String> categoryId = Optional.empty();
  private Optional<Boolean> active = Optional.empty();
  private Optional<LocationRequest> location = Optional.empty();
  private Optional<String> city = Optional.empty();
  private Optional<List<PricingItemRequest>> pricingItems = Optional.empty();
  private Optional<List<String>> photos = Optional.empty();
}
