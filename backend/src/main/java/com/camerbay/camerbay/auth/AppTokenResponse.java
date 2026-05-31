package com.camerbay.camerbay.auth;

public record AppTokenResponse(
    String accessToken,
    String refreshToken,
    long expiresIn) {
}
