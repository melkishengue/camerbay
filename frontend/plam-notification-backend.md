# Notification Backend Implementation Specification

This document describes everything the backend must implement to support the Camerbay mobile app's notification system. The frontend (React Native / Expo) is already built and expects the exact API contracts described below.

## Context

- **App**: Camerbay — a marketplace connecting service providers with clients
- **Auth**: OIDC via Zitadel (PKCE flow). All authenticated endpoints receive a Bearer token in `Authorization` header. The token is a Zitadel-issued JWT. The backend must validate it against the Zitadel OIDC discovery endpoint.
- **API base URL**: Configured via `EXPO_PUBLIC_API_URL` (default `http://localhost:8082`)
- **Content-Type**: All requests and responses use `application/json`
- **Language**: The app UI is in French. Notification `title` and `body` content should be in French.

---

## 1. Database Schema

### `notifications` table

| Column       | Type                     | Description                                                                 |
|-------------|--------------------------|-----------------------------------------------------------------------------|
| `id`        | UUID (PK)                | Unique notification identifier                                              |
| `user_id`   | UUID (FK → users)        | The recipient user                                                          |
| `type`      | ENUM / VARCHAR           | One of: `chat_message`, `new_offer_nearby`, `offer_status_change`, `offer_review`, `system_announcement` |
| `title`     | VARCHAR(255)             | Short headline (displayed bold in the app)                                  |
| `body`      | TEXT                     | Longer description (up to ~2 lines displayed)                               |
| `data`      | JSONB / JSON             | Key-value routing context (see Data Field section below)                    |
| `read`      | BOOLEAN (default false)  | Whether the user has opened/seen this notification                          |
| `created_at`| TIMESTAMP WITH TIME ZONE | Creation time, used for ordering and relative time display                  |

**Indexes:**
- `(user_id, created_at DESC)` — for paginated listing
- `(user_id, read)` — for unread count queries

### `push_tokens` table

| Column         | Type                     | Description                                                    |
|---------------|--------------------------|----------------------------------------------------------------|
| `id`          | UUID (PK)                | Unique record identifier                                       |
| `user_id`     | UUID (FK → users)        | Owner of the device                                            |
| `expo_push_token` | VARCHAR(255) UNIQUE  | The Expo push token string (e.g. `ExponentPushToken[xxxxxx]`)  |
| `platform`    | VARCHAR(10)              | `ios` or `android`                                             |
| `device_id`   | VARCHAR(255) NULLABLE    | Optional device identifier for deduplication                   |
| `created_at`  | TIMESTAMP WITH TIME ZONE | When the token was first registered                            |
| `updated_at`  | TIMESTAMP WITH TIME ZONE | Last time this token was updated/confirmed                     |

**Constraints:**
- UNIQUE on `expo_push_token` (one token = one device = one registration)
- A single user can have multiple tokens (multiple devices)

---

## 2. REST API Endpoints

All endpoints below are **authenticated** — they require a valid `Authorization: Bearer <token>` header. Return `401 Unauthorized` if the token is missing or invalid.

---

### 2.1 Register Push Token

**`POST /api/v1/users/me/push-token`**

Called by the frontend on every app launch (when authenticated) to register or update the device's push token.

**Request body:**
```json
{
  "expoPushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "ios",
  "deviceId": "optional-device-uuid"
}
```

| Field           | Type   | Required | Description                                    |
|----------------|--------|----------|------------------------------------------------|
| `expoPushToken`| string | yes      | Expo push token from `expo-notifications`      |
| `platform`     | string | yes      | `"ios"` or `"android"`                         |
| `deviceId`     | string | no       | Optional device identifier for deduplication   |

**Behavior:**
- **Upsert**: If a record with the same `expoPushToken` already exists, update `user_id`, `platform`, `device_id`, and `updated_at`. This handles the case where a device changes user (logout/login with different account).
- If `deviceId` is provided and a record with the same `user_id` + `deviceId` exists but a different token, update the token (device got a new token).
- Return `200 OK` or `201 Created`.

**Response:** Empty body or echo back the registration.

---

### 2.2 List Notifications (Paginated)

**`GET /api/v1/notifications?page={page}&size={size}`**

Returns the authenticated user's notifications in reverse chronological order.

**Query parameters:**

| Param  | Type    | Default | Description                    |
|--------|---------|---------|--------------------------------|
| `page` | integer | 0       | Zero-based page index          |
| `size` | integer | 20      | Number of items per page        |

**Response body (`200 OK`):**
```json
{
  "content": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "chat_message",
      "title": "Nouveau message",
      "body": "Jean vous a envoyé un message concernant votre offre",
      "data": {
        "channelId": "channel-abc123"
      },
      "read": false,
      "createdAt": "2026-02-21T14:30:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "type": "new_offer_nearby",
      "title": "Nouvelle offre à proximité",
      "body": "Un plombier est disponible dans votre quartier",
      "data": {
        "offerId": "offer-xyz789"
      },
      "read": true,
      "createdAt": "2026-02-21T12:15:00.000Z"
    }
  ],
  "totalElements": 42,
  "totalPages": 3,
  "currentPage": 0,
  "pageSize": 20
}
```

**Response field details:**

| Field           | Type    | Description                                                       |
|----------------|---------|-------------------------------------------------------------------|
| `content`      | array   | Array of notification objects for this page                       |
| `totalElements`| integer | Total number of notifications across all pages                    |
| `totalPages`   | integer | Total number of pages (`ceil(totalElements / pageSize)`)          |
| `currentPage`  | integer | The current page index (mirrors the `page` query param)           |
| `pageSize`     | integer | The page size used (mirrors the `size` query param)               |

**Notification object fields:**

| Field       | Type    | Description                                                              |
|------------|---------|--------------------------------------------------------------------------|
| `id`       | string  | UUID                                                                     |
| `type`     | string  | One of the 5 notification types (see enum below)                         |
| `title`    | string  | Short headline                                                           |
| `body`     | string  | Description text                                                         |
| `data`     | object  | Nullable. Key-value map with routing context (see Data Field section)    |
| `read`     | boolean | Whether the user has seen/opened this notification                       |
| `createdAt`| string  | ISO 8601 timestamp (e.g. `2026-02-21T14:30:00.000Z`)                    |

**Important:**
- Sort by `created_at DESC` (newest first)
- Only return notifications belonging to the authenticated user
- The `createdAt` field must be serialized as ISO 8601 string (the frontend parses it with `new Date(dateString)`)

---

### 2.3 Get Unread Count

**`GET /api/v1/notifications/unread-count`**

Returns the count of unread notifications for the authenticated user.

**Response body (`200 OK`):**
```json
{
  "count": 5
}
```

**Performance note:** This endpoint is called on every app foreground transition, so it must be fast. Use an indexed query: `SELECT COUNT(*) FROM notifications WHERE user_id = ? AND read = false`.

---

### 2.4 Mark Single Notification as Read

**`PUT /api/v1/notifications/{id}/read`**

Marks one notification as read.

**Path parameters:**

| Param | Type   | Description                |
|-------|--------|----------------------------|
| `id`  | string | UUID of the notification    |

**Behavior:**
- Set `read = true` on the notification
- **Idempotent**: calling on an already-read notification is a no-op, not an error
- Return `404 Not Found` if the notification doesn't exist or doesn't belong to the authenticated user
- Return `200 OK` or `204 No Content` on success

**Request body:** None required.

**Response body:** Empty or echo the updated notification.

---

### 2.5 Mark All Notifications as Read

**`PUT /api/v1/notifications/read-all`**

Marks all of the authenticated user's unread notifications as read.

**Behavior:**
- Bulk update: `UPDATE notifications SET read = true WHERE user_id = ? AND read = false`
- Return `200 OK` or `204 No Content`

**Request body:** None required.

**Response body:** Empty or return `{ "updatedCount": 12 }`.

---

## 3. Notification Types and Data Field

The `type` field determines the icon and navigation behavior in the frontend. The `data` field must contain the routing keys the frontend needs.

### Type: `chat_message`

- **Trigger**: A new message is sent in a Stream Chat channel where the user is a member
- **Title example**: `"Nouveau message"`
- **Body example**: `"Jean vous a envoyé un message"`
- **Required data keys**: `{ "channelId": "<stream-chat-channel-id>" }`
- **Frontend navigation**: Opens `/conversation/{channelId}`

### Type: `new_offer_nearby`

- **Trigger**: A new offer/service is created within a geographic radius of the user's location
- **Title example**: `"Nouvelle offre à proximité"`
- **Body example**: `"Un plombier est disponible dans votre quartier"`
- **Required data keys**: `{ "offerId": "<offer-uuid>" }`
- **Frontend navigation**: Opens `/(tabs)/offers/{offerId}`

### Type: `offer_status_change`

- **Trigger**: An offer the user created or applied to has changed status (e.g. accepted, rejected, completed)
- **Title example**: `"Mise à jour de votre offre"`
- **Body example**: `"Votre offre a été acceptée par un prestataire"`
- **Required data keys**: `{ "offerId": "<offer-uuid>" }`
- **Frontend navigation**: Opens `/(tabs)/offers/{offerId}`

### Type: `offer_review`

- **Trigger**: Someone leaves a review/rating on an offer the user owns
- **Title example**: `"Nouvel avis"`
- **Body example**: `"Marie a laissé un avis 5 étoiles sur votre prestation"`
- **Required data keys**: `{ "offerId": "<offer-uuid>" }`
- **Frontend navigation**: Opens `/(tabs)/offers/{offerId}`

### Type: `system_announcement`

- **Trigger**: Admin-initiated broadcast (app updates, maintenance notices, promotions)
- **Title example**: `"Mise à jour Camerbay"`
- **Body example**: `"Une nouvelle version de l'application est disponible"`
- **Required data keys**: None required (no deep-link). Can optionally include arbitrary keys.
- **Frontend navigation**: Opens `/notifications` (the notification list itself)

---

## 4. Push Notification Delivery

When a notification-worthy event occurs, the backend must do two things:

### 4.1 Persist the notification

Insert a row into the `notifications` table with `read = false`.

### 4.2 Send push notification via Expo Push API

Send an HTTP request to Expo's push service for each of the user's registered push tokens.

**Expo Push API endpoint:** `POST https://exp.host/--/api/v2/push/send`

**Request body (per notification):**
```json
{
  "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "title": "Nouveau message",
  "body": "Jean vous a envoyé un message",
  "data": {
    "type": "chat_message",
    "channelId": "channel-abc123"
  },
  "sound": "default",
  "badge": 5,
  "priority": "high",
  "channelId": "default"
}
```

**Field details:**

| Field       | Type    | Description                                                                                  |
|------------|---------|----------------------------------------------------------------------------------------------|
| `to`       | string  | The recipient's Expo push token                                                              |
| `title`    | string  | Same as the notification record's `title`                                                    |
| `body`     | string  | Same as the notification record's `body`                                                     |
| `data`     | object  | **Must include `type`** plus the same routing keys stored in the notification record's `data`. The frontend destructures `{ type, ...data }` from this field to determine navigation. |
| `sound`    | string  | `"default"` to play the device's default notification sound                                  |
| `badge`    | integer | The user's current unread notification count (including this new one). Sets the iOS app badge.|
| `priority` | string  | `"high"` for time-sensitive notifications, `"default"` otherwise                             |
| `channelId`| string  | `"default"` — matches the Android notification channel configured in the app                 |

**Batching:** Expo supports sending up to 100 notifications in a single request as an array. Batch when sending to multiple tokens or multiple users.

**Error handling:**
- Expo returns a `"DeviceNotRegistered"` error for invalid/expired tokens. When this happens, **delete the token** from `push_tokens` to avoid repeated failures.
- Expo returns `"MessageTooBig"` if the payload exceeds 4096 bytes. Keep `title` and `body` concise.
- Implement retry with exponential backoff for transient failures (5xx responses).
- Consider using Expo's receipt endpoint (`POST https://exp.host/--/api/v2/push/getReceipts`) to check delivery status after sending.

**Documentation:** https://docs.expo.dev/push-notifications/sending-notifications/

---

## 5. Notification Creation Service (Internal)

The backend needs an internal service/module that other parts of the application call to create and send notifications. This is NOT an API endpoint — it's internal logic.

### Interface (pseudocode)

```
function sendNotification(params: {
  userId: UUID,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, string>
}): void
```

### Steps

1. Insert a new row in the `notifications` table
2. Query the `push_tokens` table for all tokens belonging to `userId`
3. For each token, send a push notification via the Expo Push API (include `badge` = current unread count for this user)
4. Handle `DeviceNotRegistered` errors by deleting stale tokens

### Integration points — where to call this service

| Event source                    | Notification type        | Notes                                                          |
|--------------------------------|--------------------------|----------------------------------------------------------------|
| Stream Chat webhook / event    | `chat_message`           | Use a Stream Chat webhook or server-side event to detect new messages. Don't notify the sender — only other channel members. |
| Offer creation endpoint        | `new_offer_nearby`       | After a new offer is saved, query for users within a configurable radius of the offer's location and notify them. |
| Offer status update endpoint   | `offer_status_change`    | When an offer's status changes, notify the offer creator and/or applicants. |
| Review creation endpoint       | `offer_review`           | When a review is submitted, notify the offer owner.            |
| Admin action / scheduled task  | `system_announcement`    | Admin-triggered. Could be a dedicated admin endpoint or a scheduled broadcast job. |

---

## 6. Token Cleanup

Push tokens go stale when users uninstall the app or revoke notification permissions. Implement cleanup:

1. **On Expo error response**: When sending a push and Expo returns `DeviceNotRegistered`, immediately delete that token from `push_tokens`.
2. **Periodic cleanup (optional)**: Run a scheduled job to remove tokens that haven't been updated (via the registration endpoint) in e.g. 90 days.

---

## 7. Security Considerations

- **Authorization**: Every endpoint must verify the Bearer token (Zitadel JWT validation). Extract `user_id` (the `sub` claim) from the token.
- **Data isolation**: A user must only be able to read/modify their own notifications. The `PUT /notifications/{id}/read` endpoint must verify the notification's `user_id` matches the authenticated user.
- **Rate limiting**: The unread count endpoint is called frequently. Consider caching or rate-limiting to prevent abuse.
- **Input validation**: Validate `page` >= 0, `size` between 1 and 100, and `id` is a valid UUID format.

---

## 8. Summary of Endpoints

| Method | Path                                | Description                       | Auth |
|--------|-------------------------------------|-----------------------------------|------|
| POST   | `/api/v1/users/me/push-token`       | Register/update push token        | Yes  |
| GET    | `/api/v1/notifications`             | List notifications (paginated)    | Yes  |
| GET    | `/api/v1/notifications/unread-count` | Get unread notification count    | Yes  |
| PUT    | `/api/v1/notifications/{id}/read`   | Mark one notification as read     | Yes  |
| PUT    | `/api/v1/notifications/read-all`    | Mark all notifications as read    | Yes  |
