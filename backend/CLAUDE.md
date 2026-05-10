# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
# Build
./mvnw clean package

# Run (port 8082)
./mvnw spring-boot:run

# Run tests
./mvnw test

# Run a single test class
./mvnw test -Dtest=CamerbayApplicationTests
```

**Initial setup:** Copy `application-andre.properties` to `application.properties` in `src/main/resources/`. The database requires PostGIS and pg_trgm extensions:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

**Trigram indexes** (create manually, Hibernate won't generate GIN indexes):

```sql
CREATE INDEX IF NOT EXISTS idx_offers_title_trgm ON offers USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_offers_description_trgm ON offers USING gin (description gin_trgm_ops);
```

## Architecture

Spring Boot 4.0.1 marketplace API (Java 17) connecting service providers with clients. PostgreSQL + PostGIS for geospatial data, Zitadel for OAuth2 auth, Stream.io for chat.

### Module Structure (`com.camerbay.camerbay`)

- **offer/** — Service listings with geospatial location, pricing, categories, photos
- **user/** — User profiles, onboarding (client vs provider roles), auth sync
- **chat/** — Stream.io chat integration (token generation, channel creation)
- **auth/** — OAuth2 opaque token validation, `AuthenticationFacade` for extracting current user

### Patterns

- **Layered architecture:** Controller → Service → Repository (JPA)
- **DTOs as Java records:** `CreateOfferRequest`, `OfferResponse`, etc. — immutable request/response types
- **Entities use Lombok:** `@Builder`, `@Getter`, `@Setter` with JPA annotations
- **Embedded value objects:** `Location` (with PostGIS Point, SRID 4326), `PhoneNumber` (E.164), `Price`, `PricingItem`
- **Error handling:** RFC 7807 Problem Details via `GlobalExceptionHandler` and `ProblemDetail` class
- **Validation:** Bean Validation on request DTOs with custom message keys (e.g., `offer.title.required`)

### Security

- OAuth2 Resource Server with opaque token introspection against Zitadel (`https://sso.afribytes.com`)
- Stateless sessions, CSRF disabled
- Public: `GET /api/v1/offers/**`, `GET /api/v1/users/{id}`, `/api/health`
- Authenticated: all write operations, `/api/v1/users/me`, `/api/v1/chat/**`

### Key Domain Rules

- Max 50 active offers per provider
- Offer photos capped at 5
- Price range: 0–100,000 with 2 decimal places; promotional price must be less than regular price
- Currency: EUR only
- Categories: HAIR_BEAUTY, FOOD_CATERING, FASHION

### API

- Base path: `/api/v1/`
- Swagger UI: `/swagger-ui.html`
- HTTP test files in project root: `offer-request.http`, `requests-client.http`, `requests-provider.http`, `chat.http`, `oauth.http`
- Pagination via Spring `Pageable` (default page=0, size=10)

### Database

- PostgreSQL with PostGIS extension
- Hibernate auto-update DDL strategy
- N+1 prevention: custom queries use join fetch (see `OfferRepository`)
- Element collections for lists (photos, pricing items)
- UUID primary keys with auto-generation
