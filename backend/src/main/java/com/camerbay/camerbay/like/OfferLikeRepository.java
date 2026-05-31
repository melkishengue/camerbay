package com.camerbay.camerbay.like;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.camerbay.camerbay.offer.Offer;

public interface OfferLikeRepository extends JpaRepository<OfferLike, UUID> {

  Optional<OfferLike> findByUserIdAndOfferId(UUID userId, UUID offerId);

  boolean existsByUserIdAndOfferId(UUID userId, UUID offerId);

  long countByOfferId(UUID offerId);

  @Query("SELECT o FROM Offer o JOIN OfferLike l ON l.offerId = o.id WHERE l.userId = :userId ORDER BY l.createdAt DESC")
  Page<Offer> findLikedOffersByUserId(@Param("userId") UUID userId, Pageable pageable);
}
