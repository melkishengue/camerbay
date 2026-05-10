import { OnboardingFormData } from "@/hooks/useOnboarding";
import { Ionicons } from "@expo/vector-icons";
import { Button, TextField, cn, useThemeColor } from "heroui-native";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Upload
} from "lucide-react-native";
import React from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { withUniwind } from "uniwind";

interface BasicInfoStepProps {
  control: Control<OnboardingFormData>;
  errors: FieldErrors<OnboardingFormData>;
}

export function BasicInfoStep({ control, errors }: BasicInfoStepProps) {
  const StyledIonicons = withUniwind(Ionicons);

  return (
    <View className="gap-5 px-4">
      {/* Header */}
      <View className="gap-4 items-center pt-2">
        {/* <View className="w-[90px] h-[90px] bg-green-100 rounded-full items-center justify-center border-3 border-green-300">
          <Text className="text-5xl">👋</Text>
        </View> */}
        <View className="gap-2 items-center">
          {/* <Text className="text-3xl font-bold text-foreground text-center">
            Bienvenue !
          </Text> */}
          {/* <Text className="text-muted text-base text-center max-w-[300px] leading-6">
            Parlez-nous de vous pour commencer
          </Text> */}
        </View>
      </View>

      <View className="gap-3">
        <View className="gap-2">
          <Controller
            control={control}
            name="phone"
            rules={{
              pattern: {
                value: /^[+]?[\d\s-()]+$/,
                message: "Format de téléphone invalide"
              }
            }}
            render={({ field: { onChange, value } }) => (
              <TextField isInvalid={!!errors.phone}>
                <TextField.Label>Numéro de téléphone</TextField.Label>
                <View className="w-full flex-row items-center">
                  <TextField.Input
                    placeholder="+49 XXX XXX XXX XXX"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="phone-pad"
                    className="flex-1 px-10"
                  />
                  <StyledIonicons
                    name="call"
                    size={16}
                    className="absolute left-3.5 text-muted"
                    pointerEvents="none"
                  />
                </View>
                {errors.phone && (
                  <TextField.ErrorMessage>
                    {errors.phone.message}
                  </TextField.ErrorMessage>
                )}
              </TextField>
            )}
          />
        </View>

        <View className="gap-2">
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <TextField>
                <TextField.Label>Nom</TextField.Label>
                <View className="w-full flex-row items-center">
                  <TextField.Input
                    placeholder="Jean Dupont"
                    value={value}
                    onChangeText={onChange}
                    className="flex-1 px-10"
                  />
                  <StyledIonicons
                    name="person-circle"
                    size={16}
                    className="absolute left-3.5 text-muted"
                    pointerEvents="none"
                  />
                </View>
              </TextField>
            )}
          />
        </View>
        <View className="gap-2">
          <Controller
            control={control}
            name="businessName"
            render={({ field: { onChange, value } }) => (
              <TextField>
                <TextField.Label>Nom de l&apos;entreprise</TextField.Label>
                <View className="w-full flex-row items-center">
                  <TextField.Input
                    placeholder="Salon de beauté Afro"
                    value={value}
                    onChangeText={onChange}
                    className="flex-1 px-10"
                  />
                  <StyledIonicons
                    name="business"
                    size={16}
                    className="absolute left-3.5 text-muted"
                    pointerEvents="none"
                  />
                </View>
              </TextField>
            )}
          />
        </View>
        <View className="gap-2">
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <TextField>
                <TextField.Label>Description</TextField.Label>
                <TextField.Description>
                  Une description de votre activité
                </TextField.Description>
                <TextField.Input
                  placeholder="Coiffure afro, tresses, nattes, soins capillaires..."
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="h-[100px]"
                />
              </TextField>
            )}
          />
        </View>
      </View>
    </View>
  );
}

interface OnboardingNavigationProps {
  currentStepIndex: number;
  isLastStep: boolean;
  canProceed: boolean;
  isUploading: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function OnboardingNavigation({
  currentStepIndex,
  isLastStep,
  canProceed,
  isUploading,
  onBack,
  onNext
}: OnboardingNavigationProps) {
  const [themeColorAccentForeground] = useThemeColor(["accent-foreground"]);

  return (
    <View className="p-4 border-t border-border bg-background gap-3">
      <View className="flex-row gap-3">
        {currentStepIndex > 0 && (
          <Button
            variant="secondary"
            onPress={onBack}
            isDisabled={isUploading}
            className="flex-1"
          >
            <ChevronLeft size={18} color="#0e7fe9" />
            <Button.Label>Retour</Button.Label>
          </Button>
        )}

        <Button
          variant="primary"
          onPress={onNext}
          isDisabled={!canProceed || isUploading}
          className={cn(
            "bg-accent",
            currentStepIndex === 0 ? "flex-1" : "flex-[2]"
          )}
        >
          {isLastStep && (
            <Sparkles size={18} color={themeColorAccentForeground} />
          )}
          <Button.Label>
            {isUploading
              ? "Téléchargement..."
              : isLastStep
                ? "Terminer l'inscription"
                : "Continuer"}
          </Button.Label>
          {!isLastStep && (
            <ChevronRight size={18} color={themeColorAccentForeground} />
          )}
        </Button>
      </View>
    </View>
  );
}

interface PhotoUploadStepProps {
  localImageUri: string | null;
  isUploading: boolean;
  onPickImage: () => void;
}

export function PhotoUploadStep({
  localImageUri,
  isUploading,
  onPickImage
}: PhotoUploadStepProps) {
  return (
    <View className="gap-5 px-4">
      {/* <View className="flex-row items-center gap-3">
        <View className="w-[50px] h-[50px] bg-yellow-100 rounded-full items-center justify-center">
          <Camera size={24} color="#f59e0b" />
        </View>
        <View className="flex-1">
          <Text className="text-2xl font-bold text-foreground">
            Photo de profil
          </Text>
          <Text className="text-muted text-sm mt-1">
            Mettez un visage sur votre profil
          </Text>
        </View>
      </View> */}

      <View className="items-center gap-5 py-4">
        {localImageUri ? (
          <View className="gap-4 items-center">
            <View>
              <Image
                source={{ uri: localImageUri }}
                style={{ width: 180, height: 180, borderRadius: 90 }}
              />
            </View>

            <View className="items-center gap-2">
              <Text className="text-base font-bold text-success">
                Photo ajoutée avec succès !
              </Text>
              <Text className="text-sm text-muted">
                Vous pouvez la modifier si besoin
              </Text>
            </View>

            <Button
              size="lg"
              variant="primary"
              onPress={onPickImage}
              isDisabled={isUploading}
              className="h-12"
            >
              <Upload size={18} />
              <Button.Label className="font-semibold ml-2">
                Changer la photo
              </Button.Label>
            </Button>
          </View>
        ) : (
          <View className="gap-4 w-full items-center">
            <TouchableOpacity
              onPress={onPickImage}
              activeOpacity={0.8}
              className="w-full max-w-[300px]"
            >
              <View className="h-[240px] rounded-2xl border-3 border-dashed border-success/50 bg-success/5 items-center justify-center">
                <View className="items-center gap-3">
                  <View className="w-20 h-20 bg-success/20 rounded-full items-center justify-center">
                    <Upload size={36} color="#22c55e" />
                  </View>
                  <View className="items-center gap-1">
                    <Text className="font-bold text-lg text-foreground">
                      Ajouter une photo
                    </Text>
                    <Text className="text-sm text-muted">
                      Cliquez pour sélectionner
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            <Text className="text-xs text-muted text-center max-w-[280px]">
              Format JPG, PNG ou WEBP • Max 5MB
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  progress: number;
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  progress
}: OnboardingProgressProps) {
  return (
    <View className="pt-8 px-4 pb-5 bg-background">
      <View className="gap-3">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-2">
            <View className="w-2 h-2 bg-success rounded-full" />
            <Text className="text-sm text-foreground font-bold">
              Étape {currentStep} / {totalSteps}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-xs text-muted">Progression</Text>
            <View className="px-2.5 py-1 bg-success rounded">
              <Text className="text-xs text-white font-bold">
                {Math.round(progress)}%
              </Text>
            </View>
          </View>
        </View>

        <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-success rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>
    </View>
  );
}
