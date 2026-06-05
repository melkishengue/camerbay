package com.camerbay.camerbay.auth;

import java.net.URL;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.camerbay.camerbay.user.User;
import com.camerbay.camerbay.user.UserRepository;
import com.camerbay.camerbay.user.UserResponse;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jose.proc.JWSKeySelector;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class AuthSyncService {

  @Value("${spring.security.oauth2.resourceserver.opaquetoken.client-id}")
  private String clientId;

  @Value("${app.auth.project-id}")
  private String projectId;

  @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}")
  private String issuer;

  private final UserRepository userRepository;

  public AuthSyncService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public UserResponse syncUser(String idToken) throws Exception {
    // 1. Setup the JWT Processor with the JWKS source from Zitadel
    // Tip: issuer + "/.well-known/jwks.json"
    ConfigurableJWTProcessor<SecurityContext> jwtProcessor = new DefaultJWTProcessor<>();
    JWKSource<SecurityContext> keySource = new RemoteJWKSet<>(new URL(issuer + "/oauth/v2/keys"));

    // 2. Configure signature verification (Zitadel uses RS256)
    JWSKeySelector<SecurityContext> keySelector = new JWSVerificationKeySelector<>(
        JWSAlgorithm.RS256, keySource);
    jwtProcessor.setJWSKeySelector(keySelector);

    // 3. Process & Validate
    JWTClaimsSet claims = jwtProcessor.process(idToken, null);

    // 4. Manual Claim Checks (Security Best Practices)
    // if (!claims.getAudience().contains(clientId)) {
    // throw new RuntimeException("Invalid Audience: Token not meant for this app");
    // }

    if (!claims.getAudience().contains(projectId)) {
      throw new RuntimeException("Invalid Audience");
    }

    if (!claims.getIssuer().equals(issuer)) {
      throw new RuntimeException("Invalid Issuer");
    }

    String authProviderId = claims.getSubject();
    String email = claims.getStringClaim("email");
    String username = claims.getStringClaim("preferred_username");
    String name = claims.getStringClaim("name");
    String picture = claims.getStringClaim("picture");

    log.info("Syncing user: authProviderId={}, username={}, hasName={}, hasPicture={}",
        authProviderId, username, name != null, picture != null);

    Optional<User> existingUser = userRepository.findByAuthProviderId(authProviderId);
    if (existingUser.isPresent()) {
      log.info("User already exists {}", authProviderId);
      User user = existingUser.get();
      user.updateFromProvider(name, picture);
      return UserResponse.from(userRepository.save(user));
    }

    User savedUser = userRepository.save(
        User.createUserForAuth(authProviderId, email, username, name, picture));

    return UserResponse.from(savedUser);
  }
}