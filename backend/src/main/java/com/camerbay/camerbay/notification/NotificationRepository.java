package com.camerbay.camerbay.notification;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

  Page<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

  @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.read = false")
  long countByUserIdAndReadFalse(@Param("userId") UUID userId);

  @Modifying
  @Query("UPDATE Notification n SET n.read = true WHERE n.user.id = :userId AND n.read = false")
  int markAllAsRead(@Param("userId") UUID userId);
}
