package com.camerbay.camerbay.auth;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.OAuth2AuthenticatedPrincipal;
import org.springframework.stereotype.Component;

@Component
public class AuthenticationFacade {

  public AuthUser getCurrentUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

    if (authentication != null && authentication.getPrincipal() instanceof OAuth2AuthenticatedPrincipal principal) {
      return AuthUser.fromOpaqueAttributes(principal.getAttributes());
    }

    return null;
  }

  public String getCurrentUserId() {
    AuthUser user = getCurrentUser();
    return user != null ? user.getId() : null;
  }

  public String getCurrentUserEmail() {
    AuthUser user = getCurrentUser();
    return user != null ? user.getEmail() : null;
  }
}