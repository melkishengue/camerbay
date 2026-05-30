package com.camerbay.camerbay.user;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record SearchProvidersRequest(
    String searchText,
    Double latitude,
    Double longitude,
    Double radiusKm,
    @Min(0) int page,
    @Min(1) @Max(100) int size) {

  public SearchProvidersRequest {
    if (page < 0) page = 0;
    if (size <= 0) size = 10;
    if (size > 100) size = 100;
  }

  @AssertTrue(message = "search.location.lat_lng_required_together")
  public boolean isLatLngValid() {
    return (latitude == null && longitude == null) || (latitude != null && longitude != null);
  }

  public boolean hasLocation() {
    return latitude != null && longitude != null;
  }

  public double radiusMeters() {
    double km = radiusKm != null ? radiusKm : 25.0;
    return km * 1000;
  }
}
