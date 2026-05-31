package com.camerbay.camerbay.auth;

public record LoginRequest(
    String provider,
    String idToken,
    String accessToken) {
}
