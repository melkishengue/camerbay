import { FullScreenOfferForm } from "@/components/FullScreenOfferForm";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "expo-router";
import { Button, useThemeColor } from "heroui-native";
import { Plus } from "lucide-react-native";
import React, { useState } from "react";
import { Modal } from "react-native";

export const CreateOfferFloatingButton = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [themeColorAccentForeground] = useThemeColor(["accent-foreground"]);

  const handlePress = () => {
    if (!isAuthenticated) {
      router.push({
        pathname: "/login",
        params: {
          title: "Créer une offre",
          description:
            "Connectez-vous pour publier vos services et commencer à recevoir des demandes."
        }
      });
      return;
    }
    setIsModalVisible(true);
  };

  return (
    <>
      <Button
        variant="primary"
        size="lg"
        onPress={handlePress}
        style={{
          position: "absolute",
          right: 16,
          bottom: 16,
          borderRadius: 99,
          width: 56,
          height: 56,
          zIndex: 50
        }}
      >
        <Plus size={24} color={themeColorAccentForeground} strokeWidth={2.5} />
      </Button>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <FullScreenOfferForm
          mode="create"
          onClose={() => setIsModalVisible(false)}
        />
      </Modal>
    </>
  );
};
