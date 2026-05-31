package com.camerbay.camerbay.auth;

import java.net.URL;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jose.proc.JWSKeySelector;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTClaimsVerifier;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class GoogleTokenVerifier {

  private static final String GOOGLE_JWKS_URI = "https://www.googleapis.com/oauth2/v3/certs";
  private static final String GOOGLE_ISSUER = "https://accounts.google.com";

  @Value("${app.auth.google.ios-client-id}")
  private String iosClientId;

  @Value("${app.auth.google.android-client-id}")
  private String androidClientId;

  @Value("${app.auth.google.web-client-id}")
  private String webClientId;

  private ConfigurableJWTProcessor<SecurityContext> jwtProcessor;

  @PostConstruct
  public void init() {
    try {
      JWKSource<SecurityContext> keySource = new RemoteJWKSet<>(new URL(GOOGLE_JWKS_URI));
      JWSKeySelector<SecurityContext> keySelector =
          new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, keySource);

      jwtProcessor = new DefaultJWTProcessor<>();
      jwtProcessor.setJWSKeySelector(keySelector);
      // Disable default audience check — we perform it manually to support multiple client IDs
      jwtProcessor.setJWTClaimsSetVerifier(new DefaultJWTClaimsVerifier<>(null, null));

      log.info("GoogleTokenVerifier initialised with JWKS endpoint {}", GOOGLE_JWKS_URI);
    } catch (Exception e) {
      throw new RuntimeException("Failed to initialise GoogleTokenVerifier", e);
    }
  }

  /**
   * Validates a Google idToken and returns its claims.
   *
   * @param idToken raw Google id_token string
   * @return validated {@link JWTClaimsSet}
   * @throws RuntimeException if the token is invalid, expired, or has wrong issuer/audience
   */
  public JWTClaimsSet verify(String idToken) {
    try {
      JWTClaimsSet claims = jwtProcessor.process(idToken, null);

      // Issuer check
      if (!GOOGLE_ISSUER.equals(claims.getIssuer())) {
        throw new RuntimeException("Invalid issuer: " + claims.getIssuer());
      }

      // Audience must contain at least one of our registered client IDs
      List<String> audience = claims.getAudience();
      List<String> allowedAudiences = List.of(iosClientId, androidClientId, webClientId);
      boolean audienceMatched = audience.stream().anyMatch(allowedAudiences::contains);
      if (!audienceMatched) {
        throw new RuntimeException("Invalid audience: token audience does not match any registered client ID");
      }

      // Expiry — Nimbus processes exp automatically, but we verify the claim is present
      if (claims.getExpirationTime() == null) {
        throw new RuntimeException("Token has no expiry claim");
      }

      return claims;
    } catch (RuntimeException e) {
      throw e;
    } catch (Exception e) {
      log.error("Google idToken verification failed", e);
      throw new RuntimeException("Google idToken verification failed: " + e.getMessage(), e);
    }
  }
}
