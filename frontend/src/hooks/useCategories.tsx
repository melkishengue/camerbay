import { apiClient } from "@/lib/axios-api-client";
import { Category, CategoryListResponse } from "@/types/category";
import { useCallback, useState } from "react";

interface UseCategoriesResult {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
}

export const useCategories = (): UseCategoriesResult => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response =
        await apiClient.getPublic<CategoryListResponse>(`/api/v1/categories`);

      const data = response.data;

      setCategories(data.categories);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch categories";
      setError(errorMessage);

    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    categories,
    isLoading,
    error,
    fetchCategories
  };
};
