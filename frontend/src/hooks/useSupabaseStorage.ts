import { useEffect, useState } from "react";

import * as ImagePicker from "expo-image-picker";

import { bucketName, supabase } from "@/lib/supabase";
import { Alert } from "react-native";

interface UploadResult {
  url: string;
  path: string;
}

interface UseSupabaseStorageReturn {
  uploadImage: (uri: string) => Promise<UploadResult | null>;
  deleteImage: (path: string) => Promise<boolean>;
  uploading: boolean;
  error: string | null;
  extractPathFromUrl: (url: string) => string;
  selectImage: () => Promise<ImagePicker.ImagePickerResult>;
  pickAndUpload: () => Promise<UploadResult | null>;
}

export const useSupabaseStorage = (): UseSupabaseStorageReturn => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission requise",
          "Veuillez autoriser l'accès à la galerie photo."
        );
      }
    })();
  }, []);

  const uploadImage = async (uri: string): Promise<UploadResult | null> => {
    try {
      setUploading(true);

      const response = await fetch(uri);
      const blob = await response.blob();

      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });

      const fileExt = uri.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `profile-images/${filename}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: false
        });

      if (error) {

        throw error;
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      return {
        url: publicUrl,
        path: data.path
      };
    } catch (error) {

      throw error;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (path: string): Promise<boolean> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([path]);

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete image";
      setError(errorMessage);

      return false;
    }
  };

  const selectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8
    });

    return result;
  };

  const extractPathFromUrl = (url: string): string => {
    const match = url.match(/portfolio-images\/(.+)$/);
    return match ? `portfolio-images/${match[1]}` : "";
  };

  const pickAndUpload = async (): Promise<UploadResult | null> => {
    const result = await selectImage();

    if (!result.canceled && result.assets[0]) {
      return await uploadImage(result.assets[0].uri);
    }

    return null;
  };

  return {
    uploadImage,
    deleteImage,
    uploading,
    error,
    selectImage,
    pickAndUpload,
    extractPathFromUrl
  };
};
