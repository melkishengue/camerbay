import { Button, useToast } from "heroui-native";
import { X } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  View
} from "react-native";

interface FullScreenTextareaProps {
  title: string;
  initialValue?: string;
  placeholder?: string;
  onSave: (text: string) => void | Promise<void>;
  onClose?: () => void;
  maxLength?: number;
  saveButtonLabel?: string;
  multiline?: boolean;
}

export const FullScreenTextarea: React.FC<FullScreenTextareaProps> = ({
  title,
  initialValue = "",
  placeholder = "Commencez à écrire...",
  onSave,
  onClose,
  maxLength,
  saveButtonLabel = "Enregistrer",
  multiline = false
}) => {
  const [text, setText] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(text);
      onClose?.();

      toast.show({
        duration: 1000,
        variant: "success",
        label: "OK",
        actionLabel: "Fermer",
        onActionPress: ({ hide }) => hide()
      });
    } catch (error) {
      toast.show({
        duration: 3000,
        variant: "danger",
        label: "Oops!",
        description: `Une erreur est survenue.`,
        actionLabel: "Fermer",
        onActionPress: ({ hide }) => hide()
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    const hasChanged = text !== initialValue;

    if (hasChanged) {
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

  const hasChanged = text !== initialValue;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="px-6 py-4 flex-row items-center justify-between border-b border-border">
          <Button
            size="lg"
            variant="ghost"
            isIconOnly
            onPress={handleClose}
            className="w-9 h-9"
          >
            <X size={20} color="#64748b" />
          </Button>

          <View className="flex-1 px-4">
            <Text className="text-lg font-bold text-foreground text-center">
              {title}
            </Text>
          </View>

          <Button
            size="lg"
            variant="primary"
            onPress={handleSave}
            isDisabled={isSaving || !hasChanged}
          >
            <Button.Label>{saveButtonLabel}</Button.Label>
          </Button>
        </View>

        <View className={multiline ? "flex-1 px-6 py-4" : "px-6 py-4"}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            multiline={multiline}
            textAlignVertical={multiline ? "top" : "center"}
            maxLength={maxLength}
            autoFocus
            className={
              multiline
                ? "flex-1 text-base text-foreground"
                : "text-base text-foreground"
            }
            style={{
              fontSize: 16,
              lineHeight: 24,
              ...(multiline ? {} : { height: 44 })
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
