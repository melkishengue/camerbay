package com.camerbay.camerbay.user;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

  Optional<User> findByEmail(String email);

  Optional<User> findByAuthProviderId(String authProviderId);

  boolean existsByEmail(String email);

  @Query(value = """
      SELECT u.* FROM users u
      WHERE u.location IS NOT NULL
      AND ST_DWithin(u.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326), :radiusMeters)
      """, nativeQuery = true)
  List<User> findUsersWithinRadius(
      @Param("latitude") double latitude,
      @Param("longitude") double longitude,
      @Param("radiusMeters") double radiusMeters);
}
