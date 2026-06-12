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
      WHERE o.active = true
      AND (:categoryId IS NULL OR o.category_id = CAST(:categoryId AS uuid))
      AND ST_DWithin(o.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326), :radiusMeters)
      AND (
        :searchText IS NULL
        OR o.search_vector_en @@ websearch_to_tsquery('english', :searchText)
        OR o.search_vector_fr @@ websearch_to_tsquery('french',  :searchText)
        OR similarity(o.title, :searchText) > 0.2
        OR similarity(o.description, :searchText) > 0.2
      )
      ORDER BY
        CASE
          WHEN :searchText IS NULL THEN
            1.0 - LEAST(
              ST_Distance(o.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)) / :radiusMeters,
              1.0)
          ELSE
            0.5 * GREATEST(
              LEAST(
                ts_rank_cd(o.search_vector_en, websearch_to_tsquery('english', :searchText))
                + ts_rank_cd(o.search_vector_fr, websearch_to_tsquery('french',  :searchText)),
                1.0),
              similarity(o.title, :searchText),
              similarity(o.description, :searchText))
            + 0.5 * (1.0 - LEAST(
              ST_Distance(o.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)) / :radiusMeters,
              1.0))
        END DESC,
        o.created_at DESC
      """, countQuery = """
      SELECT COUNT(*) FROM offers o
      WHERE o.active = true
      AND (:categoryId IS NULL OR o.category_id = CAST(:categoryId AS uuid))
      AND ST_DWithin(o.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326), :radiusMeters)
      AND (
        :searchText IS NULL
        OR o.search_vector_en @@ websearch_to_tsquery('english', :searchText)
        OR o.search_vector_fr @@ websearch_to_tsquery('french',  :searchText)
        OR similarity(o.title, :searchText) > 0.2
        OR similarity(o.description, :searchText) > 0.2
      )
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
      WHERE o.active = true
      AND (:categoryId IS NULL OR o.category_id = CAST(:categoryId AS uuid))
      AND (
        :searchText IS NULL
        OR o.search_vector_en @@ websearch_to_tsquery('english', :searchText)
        OR o.search_vector_fr @@ websearch_to_tsquery('french',  :searchText)
        OR similarity(o.title, :searchText) > 0.2
        OR similarity(o.description, :searchText) > 0.2
      )
      ORDER BY
        CASE WHEN :searchText IS NULL THEN 0 ELSE 1 END DESC,
        CASE
          WHEN :searchText IS NULL THEN 0.0
          ELSE GREATEST(
            LEAST(
              ts_rank_cd(o.search_vector_en, websearch_to_tsquery('english', :searchText))
              + ts_rank_cd(o.search_vector_fr, websearch_to_tsquery('french',  :searchText)),
              1.0),
            similarity(o.title, :searchText),
            similarity(o.description, :searchText))
        END DESC,
        o.created_at DESC
      """, countQuery = """
      SELECT COUNT(*) FROM offers o
      WHERE o.active = true
      AND (:categoryId IS NULL OR o.category_id = CAST(:categoryId AS uuid))
      AND (
        :searchText IS NULL
        OR o.search_vector_en @@ websearch_to_tsquery('english', :searchText)
        OR o.search_vector_fr @@ websearch_to_tsquery('french',  :searchText)
        OR similarity(o.title, :searchText) > 0.2
        OR similarity(o.description, :searchText) > 0.2
      )
      """, nativeQuery = true)
  Page<Offer> searchWithoutLocation(
      @Param("searchText") String searchText,
      @Param("categoryId") String categoryId,
      Pageable pageable);
}
