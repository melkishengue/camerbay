package com.camerbay.camerbay.user;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

  @Query(value = """
      SELECT u.* FROM users u
      WHERE u.is_provider = true
      AND u.active = true
      AND u.on_boarding_completed = true
      AND (:searchText IS NULL
           OR COALESCE(u.name, '') % :searchText
           OR u.username % :searchText
           OR COALESCE(u.business_name, '') % :searchText)
      AND ST_DWithin(u.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326), :radiusMeters)
      ORDER BY
        GREATEST(
          similarity(COALESCE(u.name, ''), COALESCE(:searchText, '')),
          similarity(u.username, COALESCE(:searchText, '')),
          similarity(COALESCE(u.business_name, ''), COALESCE(:searchText, ''))
        ) DESC,
        ST_Distance(u.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)) ASC
      """,
      countQuery = """
      SELECT COUNT(*) FROM users u
      WHERE u.is_provider = true
      AND u.active = true
      AND u.on_boarding_completed = true
      AND (:searchText IS NULL
           OR COALESCE(u.name, '') % :searchText
           OR u.username % :searchText
           OR COALESCE(u.business_name, '') % :searchText)
      AND ST_DWithin(u.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326), :radiusMeters)
      """,
      nativeQuery = true)
  Page<User> searchProvidersWithLocation(
      @Param("searchText") String searchText,
      @Param("latitude") double latitude,
      @Param("longitude") double longitude,
      @Param("radiusMeters") double radiusMeters,
      Pageable pageable);

  @Query(value = """
      SELECT u.* FROM users u
      WHERE u.is_provider = true
      AND u.active = true
      AND u.on_boarding_completed = true
      AND (:searchText IS NULL
           OR COALESCE(u.name, '') % :searchText
           OR u.username % :searchText
           OR COALESCE(u.business_name, '') % :searchText)
      ORDER BY
        GREATEST(
          similarity(COALESCE(u.name, ''), COALESCE(:searchText, '')),
          similarity(u.username, COALESCE(:searchText, '')),
          similarity(COALESCE(u.business_name, ''), COALESCE(:searchText, ''))
        ) DESC,
        u.average_rating DESC,
        u.created_at DESC
      """,
      countQuery = """
      SELECT COUNT(*) FROM users u
      WHERE u.is_provider = true
      AND u.active = true
      AND u.on_boarding_completed = true
      AND (:searchText IS NULL
           OR COALESCE(u.name, '') % :searchText
           OR u.username % :searchText
           OR COALESCE(u.business_name, '') % :searchText)
      """,
      nativeQuery = true)
  Page<User> searchProvidersWithoutLocation(
      @Param("searchText") String searchText,
      Pageable pageable);
}
