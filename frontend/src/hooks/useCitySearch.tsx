import debounce from "lodash.debounce";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const baseUrl = "https://api.placesdb.dev/v1";

// Types based on the OpenAPI specification
export interface Place {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  population: number;
  relevance?: number;
}

interface PaginationMeta {
  limit: number;
  next_cursor: number;
  has_more: boolean;
  count: number;
}

interface CitiesResponse {
  data: Place[];
  pagination: PaginationMeta;
}

interface UseCitySearchOptions {
  countryCode?: string;
  radiusKm?: number;
  debounceMs?: number;
  minPopulation?: number;
  maxPopulation?: number;
  limit?: number;
}

interface UseCitySearchReturn {
  // Autocomplete search
  searchByName: (query: string) => void;
  cities: Place[];
  isLoading: boolean;
  error: Error | null;

  // Location-based search
  searchByLocation: (latitude: number, longitude: number) => Promise<void>;
  nearbyCities: Place[];
  isLoadingNearby: boolean;
  nearbyError: Error | null;

  // Clear functions
  clearSearch: () => void;
  clearNearby: () => void;
}

export const useCitySearch = (
  options: UseCitySearchOptions = {}
): UseCitySearchReturn => {
  const {
    countryCode = "DE",
    radiusKm = 2,
    debounceMs = 300,
    minPopulation,
    maxPopulation,
    limit = 10
  } = options;

  // State for autocomplete search
  const [cities, setCities] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // State for location-based search
  const [nearbyCities, setNearbyCities] = useState<Place[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [nearbyError, setNearbyError] = useState<Error | null>(null);

  // Refs for abort controllers
  const abortController = useRef<AbortController | null>(null);
  const nearbyAbortController = useRef<AbortController | null>(null);

  // Fetch cities by name
  const fetchCitiesByName = useCallback(
    async (query: string) => {
      // Cancel previous request
      if (abortController.current) {
        abortController.current.abort();
      }

      // If query is empty, clear results
      if (!query.trim()) {
        setCities([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      abortController.current = new AbortController();
      const signal = abortController.current.signal;

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          q: query,
          limit: limit.toString(),
          offset: "0",
          country: "DE",
          types: "locality"
        });

        if (minPopulation !== undefined) {
          params.append("min_population", minPopulation.toString());
        }
        if (maxPopulation !== undefined) {
          params.append("max_population", maxPopulation.toString());
        }

        const response = await fetch(
          `${baseUrl}/places/search?${params.toString()}`,
          { signal }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: CitiesResponse = await response.json();

        if (!signal.aborted) {
          setCities(data.data);
          setError(null);
        }
      } catch (err) {
        if (!signal.aborted) {
          if (err instanceof Error && err.name === "AbortError") {
            // Request was cancelled, don't update error state
            return;
          }
          setError(
            err instanceof Error ? err : new Error("Failed to fetch cities")
          );
          setCities([]);
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [baseUrl, countryCode, limit, minPopulation, maxPopulation]
  );

  // Create debounced search function
  const debouncedSearch = useMemo(
    () => debounce(fetchCitiesByName, debounceMs),
    [fetchCitiesByName, debounceMs]
  );

  // Search by name (autocomplete) with debounce
  const searchByName = useCallback(
    (query: string) => {
      // Show loading immediately for better UX
      if (query.trim()) {
        setIsLoading(true);
      } else {
        setCities([]);
        setError(null);
        setIsLoading(false);
      }

      debouncedSearch(query);
    },
    [debouncedSearch]
  );

  // Search by location (latitude/longitude)
  const searchByLocation = useCallback(
    async (latitude: number, longitude: number) => {
      // Cancel previous nearby search
      if (nearbyAbortController.current) {
        nearbyAbortController.current.abort();
      }

      nearbyAbortController.current = new AbortController();
      const signal = nearbyAbortController.current.signal;

      setIsLoadingNearby(true);
      setNearbyError(null);

      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: "0",
          country: "DE",
          types: "locality",
          radius_km: radiusKm.toString(),
          lat: latitude.toString(),
          lng: longitude.toString()
        });

        if (minPopulation !== undefined) {
          params.append("min_population", minPopulation.toString());
        }
        if (maxPopulation !== undefined) {
          params.append("max_population", maxPopulation.toString());
        }

        const response = await fetch(
          `${baseUrl}/places/search?${params.toString()}`,
          { signal }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: CitiesResponse = await response.json();

        if (!signal.aborted) {
          setNearbyCities(data.data);
          setNearbyError(null);
        }
      } catch (err) {
        if (!signal.aborted) {
          if (err instanceof Error && err.name === "AbortError") {
            return;
          }
          setNearbyError(
            err instanceof Error
              ? err
              : new Error("Failed to fetch nearby cities")
          );
          setNearbyCities([]);
        }
      } finally {
        if (!signal.aborted) {
          setIsLoadingNearby(false);
        }
      }
    },
    [baseUrl, countryCode, radiusKm, limit, minPopulation, maxPopulation]
  );

  // Clear search results
  const clearSearch = useCallback(() => {
    debouncedSearch.cancel();
    if (abortController.current) {
      abortController.current.abort();
    }
    setCities([]);
    setError(null);
    setIsLoading(false);
  }, [debouncedSearch]);

  // Clear nearby results
  const clearNearby = useCallback(() => {
    if (nearbyAbortController.current) {
      nearbyAbortController.current.abort();
    }
    setNearbyCities([]);
    setNearbyError(null);
    setIsLoadingNearby(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
      if (abortController.current) {
        abortController.current.abort();
      }
      if (nearbyAbortController.current) {
        nearbyAbortController.current.abort();
      }
    };
  }, [debouncedSearch]);

  return {
    // Autocomplete search
    searchByName,
    cities,
    isLoading,
    error,

    // Location-based search
    searchByLocation,
    nearbyCities,
    isLoadingNearby,
    nearbyError,

    // Clear functions
    clearSearch,
    clearNearby
  };
};
