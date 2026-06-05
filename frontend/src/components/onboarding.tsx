import { IconTextField } from "@/components/iconTextField";
import { SectionBlock } from "@/components/sectionBlock";
import { OnboardingFormData } from "@/hooks/useOnboarding";
import { Button, cn, TextField, useThemeColor } from "heroui-native";
import {
  AlignLeft,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Sparkles,
  Upload,
  User
} from "lucide-react-native";
import React from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View
} from "react-native";

interface BasicInfoStepProps {
  control: Control<OnboardingFormData>;
  errors: FieldErrors<OnboardingFormData>;
}

export function BasicInfoStep({ control, errors }: BasicInfoStepProps) {
  const [accentColor] = useThemeColor(["accent"]);

  return (
    <View style={{ gap: 16 }}>
      {/* Welcome header */}
      <View
        style={{
          alignItems: "center",
          paddingTop: 8,
          paddingBottom: 4,
          gap: 8
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: accentColor + "18",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: accentColor + "30"
          }}
        >
          <User size={28} color={accentColor} strokeWidth={1.75} />
        </View>
        <Text
          className="text-foreground text-center"
          style={{ fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 4 }}
        >
          Informations personnelles
        </Text>
        <Text
          className="text-muted text-center"
          style={{
            fontSize: 13,
            fontFamily: "Inter_400Regular",
            lineHeight: 20,
            maxWidth: 280
          }}
        >
          Ces informations seront visibles sur votre profil
        </Text>
      </View>

      {/* Contact section */}
      <SectionBlock
        title="Contact"
        icon={<Phone size={11} color={accentColor} strokeWidth={2.5} />}
      >
        <Controller
          control={control}
          name="phone"
          rules={{
            pattern: {
              value: /^\+[\d\s\-()]+$/,
              message:
                "Doit commencer par + et l'indicatif pays (ex: +49 17643244788)"
            }
          }}
          render={({ field: { onChange, value } }) => (
            <IconTextField
              label="Numéro de téléphone"
              value={value ?? ""}
              onChangeText={onChange}
              placeholder="+49 XXX XXX XXX"
              description="Doit commencer par + suivi de l'indicatif pays"
              keyboardType="phone-pad"
              error={errors.phone?.message}
              icon={<Phone size={16} color="#71717a" strokeWidth={1.75} />}
            />
          )}
        />
      </SectionBlock>

      {/* Profil section */}
      <SectionBlock
        title="Profil"
        icon={<User size={11} color={accentColor} strokeWidth={2.5} />}
      >
        <View style={{ gap: 12 }}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <IconTextField
                label="Nom"
                value={value ?? ""}
                onChangeText={onChange}
                placeholder="Jean Dupont"
                icon={<User size={16} color="#71717a" strokeWidth={1.75} />}
              />
            )}
          />

          <Controller
            control={control}
            name="businessName"
            render={({ field: { onChange, value } }) => (
              <IconTextField
                label="Nom de l'entreprise"
                value={value ?? ""}
                onChangeText={onChange}
                placeholder="Salon de beauté Afro"
                icon={
                  <AlignLeft size={16} color="#71717a" strokeWidth={1.75} />
                }
              />
            )}
          />

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
      </SectionBlock>
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
  const [accentForeground, accentColor] = useThemeColor([
    "accent-foreground",
    "accent"
  ]);

  return (
    <View style={{ paddingTop: 24, gap: 12 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {currentStepIndex > 0 && (
          <Button
            variant="secondary"
            onPress={onBack}
            isDisabled={isUploading}
            className="flex-1"
          >
            <ChevronLeft size={18} color={accentColor} />
            <Button.Label style={{ fontFamily: "Inter_600SemiBold" }}>
              Retour
            </Button.Label>
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
          {isUploading ? (
            <>
              <ActivityIndicator size="small" color={accentForeground} />
              <Button.Label style={{ fontFamily: "Inter_600SemiBold" }}>
                Téléchargement...
              </Button.Label>
            </>
          ) : isLastStep ? (
            <>
              {/* <Sparkles size={18} color={accentForeground} /> */}
              <Button.Label style={{ fontFamily: "Inter_700Bold" }}>
                Terminer l&apos;inscription
              </Button.Label>
              <ChevronRight size={18} color={accentForeground} />
            </>
          ) : (
            <>
              <Button.Label style={{ fontFamily: "Inter_600SemiBold" }}>
                Continuer
              </Button.Label>
              <ChevronRight size={18} color={accentForeground} />
            </>
          )}
        </Button>
      </View>
    </View>
  );
}

interface PhotoUploadStepProps {
  localImageUri: string | null;
  existingPhotoUrl?: string | null;
  isUploading: boolean;
  onPickImage: () => void;
}

export function PhotoUploadStep({
  localImageUri,
  existingPhotoUrl,
  isUploading,
  onPickImage
}: PhotoUploadStepProps) {
  const displayUri = localImageUri ?? existingPhotoUrl ?? null;
  const [accentColor] = useThemeColor(["accent"]);

  return (
    <View style={{ gap: 16 }}>
      {/* Header */}
      <View
        style={{
          alignItems: "center",
          paddingTop: 8,
          paddingBottom: 4,
          gap: 8
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: accentColor + "18",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: accentColor + "30"
          }}
        >
          <Camera size={28} color={accentColor} strokeWidth={1.75} />
        </View>
        <Text
          className="text-foreground text-center"
          style={{ fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 4 }}
        >
          Photo de profil
        </Text>
        <Text
          className="text-muted text-center"
          style={{
            fontSize: 13,
            fontFamily: "Inter_400Regular",
            lineHeight: 20,
            maxWidth: 280
          }}
        >
          Une photo aide les autres utilisateurs à vous reconnaître
        </Text>
      </View>

      <SectionBlock
        title="Photo"
        icon={<Camera size={11} color={accentColor} strokeWidth={2.5} />}
      >
        <View style={{ alignItems: "center", gap: 16 }}>
          {displayUri ? (
            /* Image selected (new local pick or existing remote photo) */
            <View style={{ alignItems: "center", gap: 16 }}>
              <View
                style={{
                  position: "relative",
                  borderRadius: 100,
                  borderWidth: 3,
                  borderColor: accentColor + "40",
                  padding: 3
                }}
              >
                <Image
                  source={{ uri: displayUri }}
                  style={{ width: 160, height: 160, borderRadius: 80 }}
                />
                {isUploading && (
                  <View
                    style={{
                      position: "absolute",
                      top: 3,
                      left: 3,
                      width: 160,
                      height: 160,
                      borderRadius: 80,
                      backgroundColor: "rgba(0,0,0,0.45)",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <ActivityIndicator color="white" size="large" />
                  </View>
                )}
              </View>

              <View style={{ alignItems: "center", gap: 4 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <CheckCircle2 size={16} color={accentColor} strokeWidth={2} />
                  <Text
                    className="text-foreground"
                    style={{ fontSize: 14, fontFamily: "Inter_600SemiBold" }}
                  >
                    {localImageUri ? "Photo ajoutée" : "Photo importée de votre compte"}
                  </Text>
                </View>
                <Text
                  className="text-muted"
                  style={{ fontSize: 12, fontFamily: "Inter_400Regular" }}
                >
                  Vous pouvez la modifier si besoin
                </Text>
              </View>

              <Button
                variant="secondary"
                onPress={onPickImage}
                isDisabled={isUploading}
              >
                <Upload size={16} color={accentColor} strokeWidth={2} />
                <Button.Label style={{ fontFamily: "Inter_600SemiBold" }}>
                  Changer la photo
                </Button.Label>
              </Button>
            </View>
          ) : (
            /* No image yet */
            <View style={{ width: "100%", gap: 12, alignItems: "center" }}>
              <TouchableOpacity
                onPress={onPickImage}
                activeOpacity={0.75}
                style={{ width: "100%", maxWidth: 300 }}
              >
                <View
                  className="border-border bg-surface"
                  style={{
                    height: 220,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderStyle: "dashed",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <View style={{ alignItems: "center", gap: 12 }}>
                    <View
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 36,
                        backgroundColor: accentColor + "18",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Upload
                        size={32}
                        color={accentColor}
                        strokeWidth={1.75}
                      />
                    </View>
                    <View style={{ alignItems: "center", gap: 4 }}>
                      <Text
                        className="text-foreground"
                        style={{
                          fontSize: 15,
                          fontFamily: "Inter_600SemiBold"
                        }}
                      >
                        Ajouter une photo
                      </Text>
                      <Text
                        className="text-muted"
                        style={{ fontSize: 13, fontFamily: "Inter_400Regular" }}
                      >
                        Appuyez pour sélectionner
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              <Text
                className="text-muted text-center"
                style={{ fontSize: 11, fontFamily: "Inter_400Regular" }}
              >
                Format JPG, PNG ou WEBP · Max 5 MB
              </Text>
            </View>
          )}
        </View>
      </SectionBlock>
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
  const [accentColor, accentForeground] = useThemeColor([
    "accent",
    "accent-foreground"
  ]);

  const stepLabels = ["Informations", "Photo"];

  return (
    <View
      className="bg-background border-b border-border"
      style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 }}
    >
      {/* Step dots */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 14
        }}
      >
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isDone = stepNum < currentStep;

          return (
            <React.Fragment key={i}>
              <View style={{ alignItems: "center", gap: 4 }}>
                <View
                  style={{
                    width: isActive ? 28 : 22,
                    height: isActive ? 28 : 22,
                    borderRadius: 14,
                    backgroundColor:
                      isDone || isActive ? accentColor : accentColor + "20",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {isDone ? (
                    <CheckCircle2
                      size={13}
                      color={accentForeground}
                      strokeWidth={2.5}
                    />
                  ) : (
                    <Text
                      style={{
                        fontSize: isActive ? 11 : 10,
                        fontFamily: "Inter_700Bold",
                        color: isActive ? accentForeground : accentColor
                      }}
                    >
                      {stepNum}
                    </Text>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: isActive
                      ? "Inter_600SemiBold"
                      : "Inter_400Regular",
                    color: isActive ? accentColor : "#71717a"
                  }}
                >
                  {stepLabels[i]}
                </Text>
              </View>

              {i < totalSteps - 1 && (
                <View
                  className="flex-1"
                  style={{
                    height: 1.5,
                    backgroundColor:
                      currentStep > stepNum ? accentColor : accentColor + "25",
                    marginBottom: 16
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Progress bar */}
      <View
        className="bg-border"
        style={{ height: 3, borderRadius: 99, overflow: "hidden" }}
      >
        <View
          style={{
            height: "100%",
            width: `${progress}%`,
            backgroundColor: accentColor,
            borderRadius: 99
          }}
        />
      </View>
    </View>
  );
}
