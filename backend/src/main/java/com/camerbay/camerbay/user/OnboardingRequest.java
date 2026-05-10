package com.camerbay.camerbay.user;

public record OnboardingRequest(
                String phone,

                String name,

                String photoImageUrl,

                String businessName,

                String description) {
}
