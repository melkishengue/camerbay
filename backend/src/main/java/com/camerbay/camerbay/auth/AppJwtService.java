package com.camerbay.camerbay.auth;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class AppJwtService {

  @Value("${app.auth.jwt.secret}")
  private String jwtSecret;

  @Value("${app.auth.jwt.expiry-seconds:3600}")
  private int expirySeconds;

  /**
   * Generates a signed HS256 JWT for the given user.
   *
   * @param email user email — used as the {@code sub} claim
   * @param name  display name — stored in the {@code name} claim, may be null
   * @return compact serialised JWT string
   */
  public String generateToken(String email, String name) {
    try {
      Instant now = Instant.now();
      Instant expiry = now.plusSeconds(expirySeconds);

      JWTClaimsSet claims = new JWTClaimsSet.Builder()
          .subject(email)
          .claim("email", email)
          .claim("name", name)
          .issuer("camerbay")
          .issueTime(Date.from(now))
          .expirationTime(Date.from(expiry))
          .build();

      SignedJWT signedJWT = new SignedJWT(
          new JWSHeader(JWSAlgorithm.HS256),
          claims);

      signedJWT.sign(new MACSigner(secretBytes()));

      return signedJWT.serialize();
    } catch (JOSEException e) {
      log.error("Failed to sign JWT", e);
      throw new RuntimeException("Failed to generate access token", e);
    }
  }

  /**
   * Returns a {@link SecretKeySpec} derived from the configured JWT secret.
   * Exposed so that {@link SecurityConfig} can build a {@code JwtDecoder} from the same key.
   */
  public SecretKeySpec getSecretKey() {
    return new SecretKeySpec(secretBytes(), "HmacSHA256");
  }

  public long getExpirySeconds() {
    return expirySeconds;
  }

  private byte[] secretBytes() {
    return jwtSecret.getBytes(StandardCharsets.UTF_8);
  }
}
