import { Button, useThemeColor } from "heroui-native";
import { CheckCircle2Icon, X } from "lucide-react-native";
import React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  View
} from "react-native";

interface FullScreenModalProps {
  title: string;
  saveButtonLabel?: string;
  onClose?: () => void;
  onSave?: () => void | Promise<void>;
  isSaving?: boolean;
  hasChanges?: boolean;
  showSaveButton?: boolean;
  children: React.ReactNode;
}

export const FullScreenModal: React.FC<FullScreenModalProps> = ({
  title,
  saveButtonLabel = "Enregistrer",
  onClose,
  onSave,
  isSaving = false,
  hasChanges = false,
  showSaveButton = true,
  children
}) => {
  const [themeColorAccentForeground, textForeground] = useThemeColor([
    "accent-foreground",
    "foreground"
  ]);
  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        "Modifications non enregistrées",
        "Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?",
        [
          {
            text: "Annuler",
            style: "cancel"
          },
          {
            text: "Quitter",
            style: "destructive",
            onPress: () => onClose?.()
          }
        ]
      );
    } else {
      onClose?.();
    }
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-4 flex-row items-center justify-between border-b border-border" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <Button
            size="sm"
            variant="secondary"
            isIconOnly
            onPress={handleClose}
            className="w-10 h-10 rounded-xl"
          >
            <X size={20} color={textForeground} strokeWidth={2} />
          </Button>

          <View className="flex-1 px-4">
            <Text
              className="text-foreground text-center"
              style={{ fontSize: 17, fontFamily: "Inter_700Bold" }}
            >
              {title}
            </Text>
          </View>

          {showSaveButton ? (
            <Button
              size="sm"
              variant="primary"
              onPress={handleSave}
              isDisabled={isSaving || !hasChanges}
            >
              <CheckCircle2Icon
                size={16}
                color={themeColorAccentForeground}
                strokeWidth={2}
              />
              <Button.Label style={{ fontFamily: "Inter_600SemiBold" }}>
                {saveButtonLabel}
              </Button.Label>
            </Button>
          ) : (
            <View className="w-10" />
          )}
        </View>

        <View className="flex-1">{children}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
