package com.camerbay.camerbay.offer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LocationRequest(
                @NotBlank(message = "offer.city.required") String city,
                @NotBlank(message = "offer.region.required") String address,
                @NotNull(message = "offer.latitude.required") double latitude,
                @NotNull(message = "offer.longitude.required") double longitude, Integer radius) {
        static LocationRequest fromLocation(Location location) {
                return new LocationRequest(location.getCity(), location.getAddress(), location.getLongitude(),
                                location.getLongitude(), 0);
        }
}
