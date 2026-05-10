import {
  BasicInfoStep,
  OnboardingNavigation,
  OnboardingProgress,
  PhotoUploadStep
} from "@/components/onboarding";
import ScreenContainer from "@/components/screenContainer";
import { useOnboarding } from "@/hooks/useOnboarding";
import React from "react";
import { ScrollView } from "react-native";

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
            isUploading={isUploading}
            onPickImage={handlePickImage}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ScreenContainer withSchrollView>
      <OnboardingProgress
        currentStep={currentStepIndex + 1}
        totalSteps={totalSteps}
        progress={progress}
      />
      <ScrollView style={{ flex: 1 }}>{renderStep()}</ScrollView>
      <OnboardingNavigation
        currentStepIndex={currentStepIndex}
        isLastStep={isLastStep}
        canProceed={canProceed}
        isUploading={isUploading}
        onBack={handleBack}
        onNext={handleNext}
      />
    </ScreenContainer>
  );
}
