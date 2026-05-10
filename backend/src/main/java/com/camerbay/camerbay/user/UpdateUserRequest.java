package com.camerbay.camerbay.user;

import java.util.List;
import java.util.Optional;

import com.camerbay.camerbay.offer.LocationRequest;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private Optional<String> name = Optional.empty();
    private Optional<String> photoImageUrl = Optional.empty();
    private Optional<String> businessName = Optional.empty();
    private Optional<String> description = Optional.empty();
    private Optional<List<String>> photos = Optional.empty();
    private Optional<String> phone = Optional.empty();
    private Optional<LocationRequest> location = Optional.empty();
}
