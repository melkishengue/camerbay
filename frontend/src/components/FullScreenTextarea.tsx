import { useErrorToast } from "@/hooks/useErrorToast";
import { useToast } from "heroui-native";
import React, { useState } from "react";
import { TextInput, View } from "react-native";
import { FullScreenModal } from "./FullScreenModal";

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
  const { showError } = useErrorToast();

  const hasChanged = text !== initialValue;

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
      showError(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FullScreenModal
      title={title}
      saveButtonLabel={saveButtonLabel}
      onClose={onClose}
      onSave={handleSave}
      isSaving={isSaving}
      hasChanges={hasChanged}
    >
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
    </FullScreenModal>
  );
};
