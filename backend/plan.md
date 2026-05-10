# Plan: Implement Offer Search

## Context

The search endpoint (`GET /api/v1/offers/search`) is stubbed out and returns `null`. Each offer already has an embedded `Location` with a PostGIS `geography(Point, 4326)` column. The project has `hibernate-spatial` and `jts-core` dependencies ready. The repository has several broken methods referencing `CategoryEnum` that need cleanup.

## Approach

### 1. Create `SearchOffersRequest` DTO

A single record to replace all scattered `@RequestParam` parameters:

```
SearchOffersRequest(
    String searchText,      // optional — matches title/description
    UUID categoryId,        // optional — filter by category
    Double latitude,        // optional — center of proximity search
    Double longitude,       // optional — center of proximity search
    Double radiusKm,        // optional — radius in km (default 25)
    int page,               // default 0
    int size                // default 10
)
```

Latitude, longitude, and radiusKm work together: if lat/lng are provided, filter offers within `radiusKm` of that point using PostGIS. If not provided, no location filter is applied.

**Validation:** Add a custom validation check to ensure latitude and longitude are always provided together — if one is present the other must be too. Implement this as a class-level `@AssertTrue` method or a custom validator on the record. If only one is provided, return a validation error.

### 2. Add native PostGIS search query to `OfferRepository`

JPQL does not support PostGIS functions like `ST_DWithin`. Use a **native SQL query** instead.

Since the sort order is dynamic (distance vs created_at), use **two separate native queries**:

**Query A — with location (sort by distance):**
```sql
SELECT o.* FROM offers o
JOIN users u ON o.provider_id = u.id
LEFT JOIN categories c ON o.category_id = c.id
WHERE o.active = true
AND (:categoryId IS NULL OR o.category_id = CAST(:categoryId AS uuid))
AND (:searchText IS NULL
     OR LOWER(o.title) LIKE LOWER(CONCAT('%', :searchText, '%'))
     OR LOWER(o.description) LIKE LOWER(CONCAT('%', :searchText, '%')))
AND ST_DWithin(o.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326), :radiusMeters)
ORDER BY ST_Distance(o.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)) ASC
```

**Query B — without location (sort by newest):**
```sql
SELECT o.* FROM offers o
JOIN users u ON o.provider_id = u.id
LEFT JOIN categories c ON o.category_id = c.id
WHERE o.active = true
AND (:categoryId IS NULL OR o.category_id = CAST(:categoryId AS uuid))
AND (:searchText IS NULL
     OR LOWER(o.title) LIKE LOWER(CONCAT('%', :searchText, '%'))
     OR LOWER(o.description) LIKE LOWER(CONCAT('%', :searchText, '%')))
ORDER BY o.created_at DESC
```

Each query gets a matching **count query** (same WHERE, no joins/order) for `Page<Offer>` pagination.

`ST_DWithin` on `geography` type works in **meters**, so the service converts `radiusKm * 1000`.

### 3. Clean up broken `OfferRepository` methods

Remove these methods that reference `CategoryEnum` on the `Offer` entity (the field is now a `Category` entity):
- `findByCategory(CategoryEnum category)`
- `findByCategoryAndActiveOrderByCreatedAtDesc(CategoryEnum, Boolean, Pageable)`
- `findActiveByCategoryWithProvider(CategoryEnum category)`

### 4. Add `searchOffers` method to `OfferService`

- Accepts `SearchOffersRequest`
- Creates `PageRequest` from page/size
- If lat/lng are provided: converts `radiusKm` to meters (default 25km if no radius given), calls Query A
- If no lat/lng: calls Query B
- Returns `OfferListPaginatedResponse.fromPage(result)`

### 5. Remove obsolete service methods

Remove `getActiveOffers(Pageable)` and `getActiveOffersByCategory(CategoryEnum, Pageable)` from `OfferService` — the new search method replaces both.

### 6. Update `OfferController`

Replace the current stubbed `searchOffers` method:

```java
@GetMapping("/search")
public ResponseEntity<OfferListPaginatedResponse> searchOffers(
    @Valid SearchOffersRequest request) {
    return ResponseEntity.ok(offerService.searchOffers(request));
}
```

## Order of changes

1. Create `SearchOffersRequest` record (with lat/lng pair validation)
2. Add two native PostGIS search queries + count queries to `OfferRepository`
3. Remove broken `CategoryEnum` query methods from `OfferRepository`
4. Add `searchOffers` to `OfferService` (branches on whether location is provided)
5. Remove obsolete `getActiveOffers` / `getActiveOffersByCategory` from `OfferService`
6. Update `OfferController.searchOffers`
