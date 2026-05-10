import { FullScreenOfferForm } from "@/components/FullScreenOfferForm";
import { useThemeColor } from "heroui-native";
import { Plus } from "lucide-react-native";
import React, { useState } from "react";
import { Modal, Pressable, Text } from "react-native";

export const CreateOfferFloatingButton = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [themeColorAccent, themeColorAccentForeground] = useThemeColor([
    "accent",
    "accent-foreground"
  ]);

  return (
    <>
      <Pressable
        onPress={() => setIsModalVisible(true)}
        style={({ pressed }) => ({
          position: "absolute",
          right: 16,
          bottom: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 99,
          backgroundColor: themeColorAccent,
          paddingHorizontal: 22,
          paddingVertical: 15,
          gap: 8,
          zIndex: 50
        })}
      >
        <Plus size={20} color={themeColorAccentForeground} strokeWidth={2.5} />
        <Text
          style={{
            color: themeColorAccentForeground,
            fontSize: 14,
            fontFamily: "Inter_600SemiBold"
          }}
        >
          Créer
        </Text>
      </Pressable>

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
