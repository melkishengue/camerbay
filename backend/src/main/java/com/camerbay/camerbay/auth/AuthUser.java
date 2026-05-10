package com.camerbay.camerbay.auth;

import java.util.Map;

import org.springframework.security.oauth2.jwt.Jwt;

import lombok.Data;

@Data
public class AuthUser {
  private String id;
  private String email;
  private String name;
  // private String preferredUsername;
  // private boolean emailVerified;
  // private String organizationId;
  // private String organizationName;
  // private Map<String, Object> roles;

  public static AuthUser fromJwt(Jwt jwt) {
    AuthUser user = new AuthUser();
    user.setId(jwt.getSubject());
    user.setEmail(jwt.getClaim("email"));
    user.setName(jwt.getClaim("name"));
    // user.setPreferredUsername(jwt.getClaim("preferred_username"));
    // user.setEmailVerified(jwt.getClaim("email_verified"));
    // user.setOrganizationId(jwt.getClaim("urn:zitadel:iam:user:resourceowner:id"));
    // user.setOrganizationName(jwt.getClaim("urn:zitadel:iam:user:resourceowner:name"));
    // user.setRoles(jwt.getClaim("urn:zitadel:iam:org:project:roles"));
    return user;
  }

  public static AuthUser fromOpaqueAttributes(Map<String, Object> attributes) {
    AuthUser user = new AuthUser();
    user.setId((String) attributes.get("sub"));
    user.setEmail((String) attributes.get("email"));
    user.setName((String) attributes.get("name"));
    // user.setRoles((Map<String, Object>)
    // attributes.get("urn:zitadel:iam:org:project:roles"));
    return user;
  }
}
