package com.camerbay.camerbay.offer;

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
public interface OfferRepository extends JpaRepository<Offer, UUID> {

  List<Offer> findByProviderId(UUID providerId);

  List<Offer> findByProviderIdAndActive(UUID providerId, Boolean active);

  @Query("SELECT o FROM Offer o JOIN FETCH o.provider WHERE o.id = :id")
  Optional<Offer> findByIdWithProvider(@Param("id") UUID id);

  @Query("SELECT o FROM Offer o JOIN FETCH o.provider p WHERE o.provider.id = :providerId ORDER BY o.createdAt DESC")
  List<Offer> findByProviderIdWithProvider(@Param("providerId") UUID providerId);

  @Query("SELECT COUNT(o) FROM Offer o WHERE o.provider.id = :providerId AND o.active = true")
  long countActiveByProviderId(@Param("providerId") UUID providerId);

  @Query("SELECT DISTINCT p FROM Offer o JOIN o.photos p WHERE o.provider.id = :providerId")
  List<String> findUniquePhotoUrlsByProviderId(@Param("providerId") UUID providerId);

  @Query(value = """
      SELECT o.* FROM offers o
      JOIN users u ON o.provider_id = u.id
      WHERE o.active = true
      AND (:categoryId IS NULL OR o.category_id = CAST(:categoryId AS uuid))
      AND (:searchText IS NULL OR o.title % :searchText OR o.description % :searchText)
      AND ST_DWithin(o.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326), :radiusMeters)
      ORDER BY
        CASE WHEN :searchText IS NULL THEN 0 ELSE 1 END DESC,
        GREATEST(similarity(o.title, COALESCE(:searchText, '')), similarity(o.description, COALESCE(:searchText, ''))) DESC,
        ST_Distance(o.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)) ASC
      """, countQuery = """
      SELECT COUNT(*) FROM offers o
      WHERE o.active = true
      AND (:categoryId IS NULL OR o.category_id = CAST(:categoryId AS uuid))
      AND (:searchText IS NULL OR o.title % :searchText OR o.description % :searchText)
      AND ST_DWithin(o.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326), :radiusMeters)
      """, nativeQuery = true)
  Page<Offer> searchWithLocation(
      @Param("searchText") String searchText,
      @Param("categoryId") String categoryId,
      @Param("latitude") double latitude,
      @Param("longitude") double longitude,
      @Param("radiusMeters") double radiusMeters,
      Pageable pageable);

  @Query(value = """
      SELECT o.* FROM offers o
      JOIN users u ON o.provider_id = u.id
      WHERE o.active = true
      AND (:categoryId IS NULL OR o.category_id = CAST(:categoryId AS uuid))
      AND (:searchText IS NULL OR o.title % :searchText OR o.description % :searchText)
      ORDER BY
        CASE WHEN :searchText IS NULL THEN 0 ELSE 1 END DESC,
        GREATEST(similarity(o.title, COALESCE(:searchText, '')), similarity(o.description, COALESCE(:searchText, ''))) DESC,
        o.created_at DESC
      """, countQuery = """
      SELECT COUNT(*) FROM offers o
      WHERE o.active = true
      AND (:categoryId IS NULL OR o.category_id = CAST(:categoryId AS uuid))
      AND (:searchText IS NULL OR o.title % :searchText OR o.description % :searchText)
      """, nativeQuery = true)
  Page<Offer> searchWithoutLocation(
      @Param("searchText") String searchText,
      @Param("categoryId") String categoryId,
      Pageable pageable);
}
