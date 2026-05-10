import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { Button, useThemeColor } from "heroui-native";
import { Edit, ImageIcon, Plus, Trash2, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

interface PortfolioImage {
  id: string;
  url: string;
  path: string;
}

interface PortfolioImageManagerProps {
  initialImages?: string[];
  onImagesChange: (imageUrls: string[]) => Promise<void>;
  maxImages?: number;
  readOnly?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const ImageUploadManager: React.FC<PortfolioImageManagerProps> = ({
  initialImages = [],
  onImagesChange,
  maxImages = 10,
  readOnly
}) => {
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [enlargedImageIndex, setEnlargedImageIndex] = useState<number | null>(
    null
  );
  const { pickAndUpload, deleteImage, uploading, error, extractPathFromUrl } =
    useSupabaseStorage();
  const [themeColorAccentForeground] = useThemeColor(["accent-foreground"]);

  useEffect(() => {
    if (initialImages.length > 0) {
      const portfolioImages = initialImages.map((url, index) => ({
        id: `initial-${index}-${url}`,
        url,
        path: extractPathFromUrl(url)
      }));
      setImages(portfolioImages);
    } else {
      setImages([]);
    }
  }, [initialImages]);

  const pickImage = async () => {
    if (images.length >= maxImages) {
      Alert.alert(
        "Limite atteinte",
        `Vous pouvez télécharger jusqu'à ${maxImages} images.`
      );
      return;
    }

    try {
      const uploadResult = await pickAndUpload();

      if (uploadResult) {
        const newImage: PortfolioImage = {
          id: `${Date.now()}-${Math.random()}`,
          url: uploadResult.url,
          path: uploadResult.path
        };

        const updatedImages = [...images, newImage];
        setImages(updatedImages);
        await syncWithBackend(updatedImages);
      }
    } catch (err) {
      Alert.alert(
        "Échec du téléchargement",
        "Impossible de télécharger l'image. Veuillez réessayer."
      );
    }
  };

  const handleImagePress = (index: number) => {
    setEnlargedImageIndex(index);
  };

  const handleDeletePress = (index: number, event: any) => {
    event.stopPropagation();
    const image = images[index];

    Alert.alert(
      "Supprimer l'image",
      "Êtes-vous sûr de vouloir supprimer cette image ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const success = await deleteImage(image.path);

            if (success) {
              const updatedImages = images.filter((_, i) => i !== index);
              setImages(updatedImages);
              await syncWithBackend(updatedImages);
            } else {
              Alert.alert(
                "Échec de la suppression",
                "Impossible de supprimer l'image. Veuillez réessayer."
              );
            }
          }
        }
      ]
    );
  };

  const handleReplaceImage = async (index: number) => {
    if (index === null) return;

    const oldImage = images[index];

    try {
      const uploadResult = await pickAndUpload();

      if (uploadResult) {
        await deleteImage(oldImage.path);

        const newImage: PortfolioImage = {
          id: `${Date.now()}-${Math.random()}`,
          url: uploadResult.url,
          path: uploadResult.path
        };

        const updatedImages = [...images];
        updatedImages[index] = newImage;
        setImages(updatedImages);
        await syncWithBackend(updatedImages);
      }
    } catch (err) {
      Alert.alert(
        "Échec du remplacement",
        "Impossible de remplacer l'image. Veuillez réessayer."
      );
    }
  };

  const syncWithBackend = async (currentImages: PortfolioImage[]) => {
    try {
      setSyncing(true);
      const imageUrls = currentImages.map((img) => img.url);
      await onImagesChange(imageUrls);
    } catch (err) {
      Alert.alert(
        "Échec de la synchronisation",
        "Impossible de synchroniser avec le serveur. Veuillez réessayer."
      );
    } finally {
      setSyncing(false);
    }
  };

  const isLoading = uploading || syncing;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            {/* <Text className="text-lg font-bold text-foreground">Portfolio</Text> */}
            {isLoading && <ActivityIndicator size="small" />}
          </View>
          {!readOnly ? (
            <Button
              size="sm"
              variant="primary"
              onPress={pickImage}
              isDisabled={isLoading || images.length >= maxImages}
            >
              <Plus size={16} color={themeColorAccentForeground} />
              <Button.Label>Ajouter</Button.Label>
            </Button>
          ) : null}
        </View>

        {error && (
          <View className="bg-red-50 rounded-xl p-3 mb-4">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        )}

        {images.length > 0 ? (
          <View className="flex-row flex-wrap gap-x-2 gap-y-8">
            {images.map((image, index) => (
              <View key={image.id} className="relative">
                <TouchableOpacity
                  onPress={() => handleImagePress(index)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: image.url }}
                    style={{
                      width: 100,
                      height: 100
                    }}
                    className="rounded-xl"
                    resizeMode="cover"
                  />
                </TouchableOpacity>

                {!readOnly ? (
                  <>
                    <Button
                      size="sm"
                      variant="danger"
                      isIconOnly
                      onPress={(e) => handleDeletePress(index, e)}
                      className="absolute -top-2 -right-2 shadow-lg"
                      style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5
                      }}
                    >
                      <Trash2 size={14} color={themeColorAccentForeground} />
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      isIconOnly
                      onPress={() => handleReplaceImage(index)}
                      className="absolute -bottom-2 -right-2 shadow-lg"
                      style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5
                      }}
                    >
                      <Edit size={14} color={themeColorAccentForeground} />
                    </Button>
                  </>
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-card rounded-2xl border border-dashed border-border p-8 items-center">
            <ImageIcon size={48} color="#94a3b8" className="mb-3" />
            <Text className="text-sm font-medium text-muted mb-1">
              Aucune image pour le moment
            </Text>
            <Text className="text-xs text-muted text-center">
              Ajoutez des photos de vos réalisations
            </Text>
          </View>
        )}

        {/* Image Enlarge Modal */}
        <Modal
          visible={enlargedImageIndex !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setEnlargedImageIndex(null)}
        >
          <Pressable
            className="flex-1 bg-black/95 justify-center items-center"
            onPress={() => setEnlargedImageIndex(null)}
          >
            {enlargedImageIndex !== null && (
              <>
                <Image
                  source={{ uri: images[enlargedImageIndex].url }}
                  style={{
                    width: SCREEN_WIDTH * 0.95,
                    height: SCREEN_HEIGHT * 0.8
                  }}
                  resizeMode="contain"
                />

                {/* Close button */}
                <Button
                  size="md"
                  variant="ghost"
                  isIconOnly
                  onPress={() => setEnlargedImageIndex(null)}
                  className="absolute top-12 right-6 w-10 h-10 bg-white/20 rounded-full"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5
                  }}
                >
                  <X size={24} color="#fff" />
                </Button>
              </>
            )}
          </Pressable>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
};
