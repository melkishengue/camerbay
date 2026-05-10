# Plan: Screen Synchronization for Offers

## Problem

When a user edits an offer and the edit modal closes, both the detail screen and list screen still show stale data. The same happens after creating or deleting an offer. This creates a poor user experience where the user has to manually navigate away and back to see updated content.

### Root Cause

The app has three independent hooks that each manage their own isolated state:

- **`useOffers`** (list screen) — holds `offers[]` in its own `useState`
- **`useOfferDetails`** (detail screen) — holds a single `offer` in a separate `useState`
- **`useOffer`** (edit form / detail screen) — performs mutations (create/update/delete) but does NOT notify the other hooks

When `updateOffer` succeeds, neither `useOfferDetails` nor `useOffers` are notified — both hold stale data.

### Additional Context

- The edit form is a `<Modal>` child of the detail screen (not a separate route), so Expo Router navigation lifecycle events don't apply to modal open/close
- The list is paginated (page-based with `loadMore`)
- Stack screens stay mounted — navigating from list → detail keeps the list screen mounted with its stale state

## Approaches Evaluated

### 1. Callback + useFocusEffect (Quick Fix)

Add `onSaved` callback to the edit form modal. Detail screen calls `refetch()` when modal closes after save. List screen uses `useFocusEffect` to refresh when it regains focus.

- **Pros**: ~10 lines of code, no new dependencies
- **Cons**: Only solves direct parent-child sync. List screen refetches every time it gains focus (even when nothing changed). Doesn't scale — every new mutation point needs manual wiring. Resets pagination/scroll position on refetch.

### 2. Event Emitter

Create a lightweight event bus. Mutations emit events (`offer:updated`, `offer:created`, `offer:deleted`). Hooks subscribe and update/refetch.

- **Pros**: ~20 lines for the bus, minimal changes to existing hooks, decoupled
- **Cons**: Not React-idiomatic, no type safety, easy to leak listeners, harder to debug

### 3. React Context (Shared State)

Single `OffersProvider` holding canonical offer data. All screens read/write through context.

- **Pros**: Single source of truth, familiar pattern
- **Cons**: Re-renders all consumers on any change, becomes a god object, must manually manage pagination + caching + loading states

### 4. TanStack Query (React Query)

Replace custom hooks with `useQuery` / `useInfiniteQuery` / `useMutation`. Cache invalidation and background refetching are built in.

- **Pros**: Purpose-built for this problem. Cache invalidation, pagination (`useInfiniteQuery`), optimistic updates, background refetching, deduplication, retry — all built in. Replaces ~220 lines of custom hook code with ~80 lines. Industry standard.
- **Cons**: New dependency (~35KB), learning curve, requires refactoring all data-fetching hooks

### 5. Zustand (Lightweight Store)

Global store with selectors for minimal re-renders.

- **Pros**: Tiny (~1KB), no provider needed, selector-based re-renders
- **Cons**: Still must build all caching/refetching/pagination logic manually. Essentially a better-performing Context without solving the data-fetching problem.

## Recommended Approach: Two-Phase Implementation

### Phase 1 — Immediate Fix (Callback + useFocusEffect)

Solves the worst UX issues with minimal changes. Can be done in 30 minutes.

**Files to modify:**

| File | Change |
|------|--------|
| `src/components/FullScreenOfferForm.tsx` | Add `onSaved?: () => void` prop. Call `onSaved()` after successful create/update, before `onClose()`. |
| `src/app/(tabs)/offers/[id].tsx` | Pass `onSaved={() => refetch()}` to `FullScreenOfferForm`. Also refetch after activate/deactivate/delete. |
| `src/app/(tabs)/offers/index.tsx` | Add `useFocusEffect` that calls `refreshOffers()` when the screen gains focus. Track a `isDirty` flag to avoid unnecessary refetches. |
| `src/components/CreateOfferFloatingButton.tsx` | Accept `onCreated?: () => void` prop. Call it after successful offer creation. Parent (list screen) passes `fetchOffers`. |

**Detail screen sync (edit modal → detail):**
```tsx
// [id].tsx
<FullScreenOfferForm
  mode="edit"
  offerId={offer.id}
  initialData={offer}
  onClose={() => setIsEditModalVisible(false)}
  onSaved={() => refetch()}
/>
```

**List screen sync (on navigate back):**
```tsx
// offers/index.tsx
import { useFocusEffect } from '@react-navigation/native';

useFocusEffect(
  useCallback(() => {
    refreshOffers();
  }, [refreshOffers])
);
```

### Phase 2 — Long-term Solution (TanStack Query)

Replaces all custom data-fetching hooks with React Query. Eliminates the sync problem structurally.

**Install:**
```bash
npm install @tanstack/react-query
```

**Files to create/modify:**

| File | Change |
|------|--------|
| `src/lib/queryClient.ts` | New file. Create and export `QueryClient` instance. |
| `src/app/_layout.tsx` | Wrap app with `QueryClientProvider`. |
| `src/hooks/useOffers.tsx` | Replace with `useInfiniteQuery` for paginated list. |
| `src/hooks/useOfferDetails.tsx` | Replace with `useQuery(['offer', id])`. |
| `src/hooks/useOffer.tsx` | Replace mutations with `useMutation` + `invalidateQueries` / `setQueryData` on success. |
| `src/app/(tabs)/offers/index.tsx` | Adapt to new hook API (data shape changes slightly for infinite queries). |
| `src/app/(tabs)/offers/[id].tsx` | Adapt to new hook API. Remove manual refetch wiring — invalidation handles it. |
| `src/components/FullScreenOfferForm.tsx` | Adapt to new mutation hook. No need for `onSaved` callback — query invalidation propagates automatically. |
| `src/components/CreateOfferFloatingButton.tsx` | Adapt to new mutation hook. |

**Key patterns:**

```tsx
// useOffers.tsx — paginated list
export function useOffers(filters?: OfferFilters) {
  return useInfiniteQuery({
    queryKey: ['offers', filters],
    queryFn: ({ pageParam = 0 }) =>
      apiClient.getPublic<OfferListResponse>(
        `/api/v1/offers/search?${buildQueryString(pageParam, filters)}`
      ).then(r => r.data),
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.totalPages - 1
        ? lastPage.currentPage + 1
        : undefined,
    initialPageParam: 0,
  });
}

// useOfferDetails.tsx — single offer
export function useOfferDetails(offerId: string) {
  return useQuery({
    queryKey: ['offer', offerId],
    queryFn: () =>
      apiClient.getPublic<Offer>(`/api/v1/offers/${offerId}`).then(r => r.data),
    enabled: !!offerId,
  });
}

// useOffer.tsx — mutations with auto-sync
export function useUpdateOffer(offerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateOfferRequest) =>
      apiClient.patch<Offer>(`/api/v1/offers/${offerId}`, data).then(r => r.data),
    onSuccess: (updatedOffer) => {
      // Instant update on detail screen (no refetch)
      queryClient.setQueryData(['offer', offerId], updatedOffer);
      // Background refetch for list screen
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });
}
```

**Benefits over Phase 1:**
- No manual `refetch()` wiring needed anywhere
- List pagination preserved across updates (invalidation refetches in background)
- Optimistic updates possible via `onMutate`
- Deduplication — if two components fetch the same offer, only one request fires
- Automatic retry on failure
- Background refetching when screens regain focus (built-in `refetchOnWindowFocus`)
