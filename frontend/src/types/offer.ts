import { Category } from "./category";

export interface Location {
  city: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface Provider {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  active: boolean;
}

export interface Offer {
  id: string;
  providerId: string;
  providerName: string;
  providerPhotoImageUrl: string;
  providerBusinessName: string;
  providerRating: number;
  providerReviewCount: number;
  title: string;
  description: string;
  category: Category;
  photos: string[];
  pricingItems: PricingItem[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  location: Location;
}

export interface CreateOfferRequest {
  title: string;
  description: string;
  categoryId: string;
  pricingItems: PricingItem[];
  photos: string[];
  location: Location;
}

export interface Price {
  amount: number;
  currency: string;
}

export interface PricingItem {
  title: string;
  price: Price;
}

export interface OfferFormResult extends CreateOfferRequest {
  category: Category;
}

export interface UpdateOfferRequest {
  title?: string;
  description?: string;
  category?: Category;
  location?: Location;
  pricingItems?: PricingItem[];
  photos?: string[];
  active?: boolean;
}

export interface OfferListResponse {
  content: Offer[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface OfferFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  searchText?: string;
  onlyWithPhotos?: boolean;
  onlyActive?: boolean;
}
