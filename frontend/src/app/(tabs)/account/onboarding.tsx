import {
  BasicInfoStep,
  OnboardingNavigation,
  OnboardingProgress,
  PhotoUploadStep
} from "@/components/onboarding";
import ScreenContainer from "@/components/screenContainer";
import { useOnboarding } from "@/hooks/useOnboarding";
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";

export default function OnboardingScreen() {
  const {
    control,
    errors,
    currentStepIndex,
    totalSteps,
    progress,
    isLastStep,
    canProceed,
    handleNext,
    handleBack,
    localImageUri,
    existingPhotoUrl,
    isUploading,
    handlePickImage
  } = useOnboarding();

  const renderStep = () => {
    switch (currentStepIndex) {
      case 0:
        return <BasicInfoStep control={control} errors={errors} />;
      case 1:
        return (
          <PhotoUploadStep
            localImageUri={localImageUri}
            existingPhotoUrl={existingPhotoUrl}
            isUploading={isUploading}
            onPickImage={handlePickImage}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ScreenContainer noPadding>
      <OnboardingProgress
        currentStep={currentStepIndex + 1}
        totalSteps={totalSteps}
        progress={progress}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1 }}
          className="px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
          <OnboardingNavigation
            currentStepIndex={currentStepIndex}
            isLastStep={isLastStep}
            canProceed={canProceed}
            isUploading={isUploading}
            onBack={handleBack}
            onNext={handleNext}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
