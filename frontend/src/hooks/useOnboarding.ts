import { API_BASE_URL } from "@/config/config";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSupabaseStorage } from "./useSupabaseStorage";

export interface OnboardingFormData {
  phone: string;
  name: string;
  businessName: string;
  description: string;
  photoImageUrl: string;
}

interface OnboardingRequest {
  phone?: string;
  name?: string;
  photoImageUrl?: string;
  businessName?: string;
  description?: string;
}

const TOTAL_STEPS = 2;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function useOnboarding() {
  const router = useRouter();
  const { accessToken, login, refetchUser } = useAuth();
  const { uploadImage } = useSupabaseStorage();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<OnboardingFormData>({
    mode: "onChange",
    defaultValues: {
      phone: "",
      name: "",
      businessName: "",
      description: "",
      photoImageUrl: ""
    }
  });

  const formValues = watch();

  // Calculate progress
  const progress = ((currentStepIndex + 1) / TOTAL_STEPS) * 100;

  // Check if current step can proceed
  const canProceed = () => {
    switch (currentStepIndex) {
      case 0:
        // Step 1: Basic info - all fields optional, just need valid phone format if provided
        if (formValues.phone && errors.phone) {
          return false;
        }
        return true;
      case 1:
        // Step 2: Photo upload - optional, always can proceed
        return true;
      default:
        return false;
    }
  };

  // Navigate to next step
  const handleNext = async () => {
    const isLastStep = currentStepIndex === TOTAL_STEPS - 1;

    if (isLastStep) {
      // Submit the form
      await handleSubmit(onSubmit)();
    } else {
      // Move to next step
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  // Navigate to previous step
  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        alert(
          "Nous avons besoin de votre permission pour accéder à vos photos."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setLocalImageUri(imageUri);
      }
    } catch (error) {

      alert("Une erreur est survenue lors de la sélection de l'image.");
    }
  };

  const uploadImageToSupabase = async (uri: string): Promise<string> => {
    try {
      setIsUploading(true);

      const response = await fetch(uri);
      const blob = await response.blob();

      if (blob.size > MAX_FILE_SIZE) {
        throw new Error("L'image est trop volumineuse. Maximum 5MB.");
      }

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
        .from("camerbay-b-one")
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: false
        });

      if (error) {

        throw error;
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from("camerbay-b-one").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {

      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      setIsUploading(true);

      let photoImageUrl: string | undefined = undefined;
      if (localImageUri) {
        try {
          const result = await uploadImage(localImageUri);

          if (!result?.url) {
            throw new Error("upload failed");
          }

          photoImageUrl = result.url;
          setValue("photoImageUrl", result.url);
        } catch (error) {

          alert("Impossible de télécharger la photo. Veuillez réessayer.");
          return;
        }
      }

      // Prepare request payload - only include non-empty fields
      const payload: OnboardingRequest = {};

      if (data.phone?.trim()) {
        payload.phone = data.phone.trim();
      }
      if (data.name?.trim()) {
        payload.name = data.name.trim();
      }
      if (data.businessName?.trim()) {
        payload.businessName = data.businessName.trim();
      }
      if (data.description?.trim()) {
        payload.description = data.description.trim();
      }
      if (photoImageUrl) {
        payload.photoImageUrl = photoImageUrl;
      }

      // Submit to backend
      const response = await fetch(`${API_BASE_URL}/api/v1/users/onboarding`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        login();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to complete onboarding: ${response.status}`
        );
      }

      const result = await response.json();

      // Refetch user data
      await refetchUser();

      // Navigate to home screen
      if (router.canDismiss()) {
        router.dismiss();
      } else {
        router.replace("/(tabs)/account");
      }
    } catch (error) {

      alert(
        "Une erreur est survenue lors de la finalisation de votre inscription. Veuillez réessayer."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return {
    // Form control
    control,
    errors,
    formValues,

    // Step management
    currentStepIndex,
    totalSteps: TOTAL_STEPS,
    progress,
    isLastStep: currentStepIndex === TOTAL_STEPS - 1,

    // Navigation
    canProceed: canProceed(),
    handleNext,
    handleBack,

    // Image handling
    localImageUri,
    isUploading,
    handlePickImage,

    // Form submission
    onSubmit: handleSubmit(onSubmit)
  };
}
