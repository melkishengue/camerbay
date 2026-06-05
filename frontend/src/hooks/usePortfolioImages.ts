import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/axios-api-client";

interface UsePortfolioImagesReturn {
  portfolioImages: string[];
  updating: boolean;
  error: string | null;
  updatePortfolioImages: (imageUrls: string[]) => Promise<void>;
  refetchPortfolioImages: () => Promise<void>;
}

export const usePortfolioImages = (): UsePortfolioImagesReturn => {
  const { user, updateUser } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const updatePortfolioImages = useCallback(
    async (imageUrls: string[]) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      try {
        setUpdating(true);
        setError(null);

        await updateUser({
          photos: imageUrls
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to update portfolio images";
        setError(errorMessage);

        throw err;
      } finally {
        setUpdating(false);
      }
    },
    [user, updateUser]
  );

  const getPortfolioImages = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    const response = await apiClient.get<{ images: string[] }>(
      `/api/v1/users/${user?.id}/portfolio`,
      {}
    );

    setPortfolioImages(response.data.images);
  }, [user?.id]);

  useEffect(() => {
    getPortfolioImages();
  }, [user?.id]);

  return {
    portfolioImages,
    updating,
    error,
    updatePortfolioImages,
    refetchPortfolioImages: getPortfolioImages
  };
};
