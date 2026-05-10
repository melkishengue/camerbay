# Notification System Implementation Plan

## Context

The Camerbay React Native frontend expects a notification backend with push token registration, paginated notification listing, read/unread management, and Expo push delivery. This plan implements the full `notification/` module plus a `pushtoken/` concern on the user module, following existing project patterns (layered architecture, records for DTOs, Lombok entities, `AuthenticationFacade` for auth).

**Key decision:** Users currently have no stored location. We'll add an embedded `Location` to the `User` entity so `new_offer_nearby` can query users within 25 km of a new offer.

---

## Files to Create

### 1. Notification Entity & Enum

**`notification/Notification.java`** — JPA entity, table `notifications`
- Fields: `id` (UUID), `user` (ManyToOne → User), `type` (NotificationType enum), `title`, `body`, `data` (Map stored as JSONB via `@JdbcTypeCode(SqlTypes.JSON)`), `read` (boolean, default false), `createdAt` (Instant)
- Use `@Builder`, `@Getter`, `@NoArgsConstructor(PROTECTED)` like other entities

**`notification/NotificationType.java`** — Enum
- `CHAT_MESSAGE`, `NEW_OFFER_NEARBY`, `OFFER_STATUS_CHANGE`, `OFFER_REVIEW`, `SYSTEM_ANNOUNCEMENT`

### 2. Notification DTOs

**`notification/NotificationResponse.java`** — Record
- Fields: `id`, `type`, `title`, `body`, `data`, `read`, `createdAt` (String ISO 8601)
- Static `from(Notification)` factory

**`notification/NotificationPageResponse.java`** — Record
- Fields: `content` (List<NotificationResponse>), `totalElements`, `totalPages`, `currentPage`, `pageSize`
- Static `fromPage(Page<Notification>, int page, int size)` factory
- Note: The frontend expects this custom shape (not Spring's default Page JSON), matching the spec's `totalElements/totalPages/currentPage/pageSize` fields

**`notification/UnreadCountResponse.java`** — Record with single `count` field

**`notification/MarkAllReadResponse.java`** — Record with single `updatedCount` field

### 3. Notification Repository

**`notification/NotificationRepository.java`** — JpaRepository<Notification, UUID>
- `Page<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable)`
- `@Query` for `countByUserIdAndReadFalse(UUID userId)` → long
- `@Modifying @Query` for `markAllAsRead(UUID userId)` → int (returns updated count)

### 4. Notification Controller

**`notification/NotificationController.java`** — `@RestController`, `@RequestMapping("/api/v1/notifications")`
- `GET /` — list paginated (page, size params, default 0/20)
- `GET /unread-count` — returns `UnreadCountResponse`
- `PUT /{id}/read` — mark single as read, 404 if not found or not owned
- `PUT /read-all` — mark all as read, returns `MarkAllReadResponse`

### 5. Notification Service

**`notification/NotificationService.java`** — `@Service`
- CRUD operations for the controller
- `sendNotification(userId, type, title, body, data)` — internal method called by other services:
  1. Save notification to DB
  2. Async: look up push tokens, send via Expo, handle errors

### 6. Push Token Entity & DTOs

**`notification/PushToken.java`** — JPA entity, table `push_tokens`
- Fields: `id` (UUID), `user` (ManyToOne → User), `expoPushToken` (unique), `platform`, `deviceId`, `createdAt`, `updatedAt`

**`notification/RegisterPushTokenRequest.java`** — Record
- `expoPushToken` (required), `platform` (required), `deviceId` (optional)

**`notification/PushTokenRepository.java`** — JpaRepository
- `findByExpoPushToken(String token)` → Optional
- `findByUserIdAndDeviceId(UUID userId, String deviceId)` → Optional
- `findByUserId(UUID userId)` → List
- `deleteByExpoPushToken(String token)`

### 7. Push Token Registration (on UserController)

Add to **`user/UserController.java`**:
- `POST /api/v1/users/me/push-token` — delegates to `NotificationService.registerPushToken(...)`

### 8. Expo Push Service

**`notification/ExpoPushService.java`** — `@Service`
- Sends push notifications to Expo's `POST https://exp.host/--/api/v2/push/send`
- Uses Spring's `RestClient` (available in Spring Boot 4.x)
- Handles `DeviceNotRegistered` → deletes stale token
- Called `@Async` from NotificationService
- Unauthenticated (no access token)
- Batches multiple tokens into a single request (array format)

### 9. Async Configuration

**`notification/AsyncConfig.java`** — `@Configuration`, `@EnableAsync`
- Configure a `TaskExecutor` bean for push notification sending

### 10. User Entity — Add Location

**Modify `user/User.java`**:
- Add `@Embedded` `Location location` field (reuse existing `offer/Location.java` which has PostGIS Point + city/region/lat/lng)
- Add setter or update method for location

**Modify `user/UpdateUserRequest.java`**:
- Add optional `LocationRequest location` field

**Modify `user/UserRepository.java`**:
- Add native query: `findUsersWithinRadius(double lat, double lng, double radiusMeters)` using PostGIS `ST_DWithin`

### 11. SecurityConfig Update

**Modify `auth/SecurityConfig.java`**:
- No changes needed since all non-public routes are already authenticated via `anyRequest().authenticated()`

### 12. Integration Points (Notification Triggers)

**Modify `offer/OfferService.java`** — `createOffer()`:
- After saving, async query users within 25 km of the offer's location
- Call `notificationService.sendNotification()` for each nearby user (exclude the offer creator)

**`offer_status_change` and `offer_review`**: These triggers depend on features (status changes, reviews) that don't exist yet in the codebase. We'll create the `NotificationType` enum values but won't wire triggers — they'll be ready when those features are added.

**`chat_message`**: Requires Stream Chat webhook setup. We'll document the webhook handler but not implement the webhook endpoint yet (needs Stream dashboard config).

**`system_announcement`**: Admin-triggered. We'll provide the `sendNotification()` method ready to be called but won't create an admin endpoint.

---

## Implementation Order

1. **NotificationType enum** — no dependencies
2. **Notification entity + repository** — depends on enum
3. **PushToken entity + repository** — no dependencies
4. **DTOs** (NotificationResponse, NotificationPageResponse, UnreadCountResponse, MarkAllReadResponse, RegisterPushTokenRequest)
5. **AsyncConfig** — enables @Async
6. **ExpoPushService** — push delivery logic
7. **NotificationService** — orchestrates DB + push
8. **NotificationController** — REST endpoints
9. **Push token registration** on UserController
10. **User entity location** — add Location embed + repository query
11. **OfferService integration** — wire `new_offer_nearby` trigger
12. **SecurityConfig** — verify no changes needed (confirm)

---

## Database Indexes (Manual SQL)

```sql
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, read);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens (user_id);
```

---

## Verification

1. `./mvnw clean package` — ensure compilation succeeds
2. `./mvnw test` — ensure existing tests pass
3. Test with HTTP requests:
   - Register a push token: `POST /api/v1/users/me/push-token`
   - List notifications: `GET /api/v1/notifications?page=0&size=10`
   - Get unread count: `GET /api/v1/notifications/unread-count`
   - Mark as read: `PUT /api/v1/notifications/{id}/read`
   - Mark all read: `PUT /api/v1/notifications/read-all`
4. Create an offer with a location and verify nearby-user notification logic fires
5. Create an HTTP test file `notification-requests.http` for manual testing
