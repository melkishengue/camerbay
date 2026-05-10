# Plan: Category Module

## Context

Category, CategoryEnum, and CategoryRepository already exist inside the `offer` package but there is no controller or service for them. Categories are needed by the frontend to populate dropdowns and by offer creation (which takes a `categoryId`). We need endpoints to list and create categories.

## Changes

### 1. Move category files to a new `category` package

Move these files from `com.camerbay.camerbay.offer` to `com.camerbay.camerbay.category`:
- `Category.java`
- `CategoryEnum.java`
- `CategoryRepository.java`

Update imports in all files that reference them (Offer.java, OfferService.java, OfferResponse.java).

### 2. Create `CategoryResponse` record

**File:** `src/main/java/com/camerbay/camerbay/category/CategoryResponse.java`

Fields: `UUID id`, `String title`, `CategoryEnum name`, `Boolean active`. Static factory `from(Category)`.

### 3. Create `CreateCategoryRequest` record

**File:** `src/main/java/com/camerbay/camerbay/category/CreateCategoryRequest.java`

Fields: `@NotBlank String title`, `@NotNull CategoryEnum name`. Validated with Bean Validation.

### 4. Create `CategoryService`

**File:** `src/main/java/com/camerbay/camerbay/category/CategoryService.java`

- `List<CategoryResponse> getActiveCategories()` — returns all active categories
- `CategoryResponse createCategory(CreateCategoryRequest)` — creates via `Category.create()`, saves, returns response

### 5. Create `CategoryController`

**File:** `src/main/java/com/camerbay/camerbay/category/CategoryController.java`

- `GET /api/v1/categories` — list active categories (public)
- `POST /api/v1/categories` — create category (public per user preference)

### 6. Update `SecurityConfig`

Add `/api/v1/categories` and `/api/v1/categories/**` to the public permitAll rules.

### 7. Create `category.http` test file

**File:** `category.http` (project root)

Following the same format as `offer-request.http`, with requests for:
- `GET /api/v1/categories` — list categories
- `POST /api/v1/categories` — create each of the 3 MVP categories (HAIR_BEAUTY, FOOD_CATERING, FASHION)

## Files to modify

- `src/main/java/com/camerbay/camerbay/auth/SecurityConfig.java` — add category endpoints to permitAll
- `src/main/java/com/camerbay/camerbay/offer/Offer.java` — update Category import
- `src/main/java/com/camerbay/camerbay/offer/OfferService.java` — update Category/CategoryRepository imports
- `src/main/java/com/camerbay/camerbay/offer/OfferResponse.java` — update Category import

## Files to create

- `src/main/java/com/camerbay/camerbay/category/Category.java` (moved)
- `src/main/java/com/camerbay/camerbay/category/CategoryEnum.java` (moved)
- `src/main/java/com/camerbay/camerbay/category/CategoryRepository.java` (moved)
- `src/main/java/com/camerbay/camerbay/category/CategoryResponse.java`
- `src/main/java/com/camerbay/camerbay/category/CreateCategoryRequest.java`
- `src/main/java/com/camerbay/camerbay/category/CategoryService.java`
- `src/main/java/com/camerbay/camerbay/category/CategoryController.java`
- `category.http`

## Files to delete

- `src/main/java/com/camerbay/camerbay/offer/Category.java`
- `src/main/java/com/camerbay/camerbay/offer/CategoryEnum.java`
- `src/main/java/com/camerbay/camerbay/offer/CategoryRepository.java`
