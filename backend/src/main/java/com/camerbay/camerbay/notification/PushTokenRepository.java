package com.camerbay.camerbay.notification;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PushTokenRepository extends JpaRepository<PushToken, UUID> {

  Optional<PushToken> findByExpoPushToken(String expoPushToken);

  Optional<PushToken> findByUserIdAndDeviceId(UUID userId, String deviceId);

  List<PushToken> findByUserId(UUID userId);

  void deleteByExpoPushToken(String expoPushToken);
}
