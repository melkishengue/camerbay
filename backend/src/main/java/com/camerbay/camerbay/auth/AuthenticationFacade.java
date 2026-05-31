package com.camerbay.camerbay.auth;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
public class AuthenticationFacade {

  public AuthUser getCurrentUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

    if (authentication instanceof JwtAuthenticationToken jwtAuth) {
      return AuthUser.fromJwt((org.springframework.security.oauth2.jwt.Jwt) jwtAuth.getPrincipal());
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