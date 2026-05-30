export interface ProviderPublicProfile {
  id: string;
  profilePhotoUrl?: string;
  name?: string;
  username: string;
  businessName?: string;
  description?: string;
  totalReviewsCount: number;
  averageRating: number;
  city?: string;
  createdAt: string;
}

export interface ProviderListResponse {
  content: ProviderPublicProfile[];
  offset: number;
  pageNumber: number;
  hasNext: boolean;
  hasPrevious: boolean;
  pageSize: number;
}

export interface ProviderFilters {
  searchText?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}
