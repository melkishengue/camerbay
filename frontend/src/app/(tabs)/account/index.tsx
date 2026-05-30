import { ExpandableText } from "@/components/ExpandableText";
import { FullScreenTextarea } from "@/components/FullScreenTextarea";
import { ImageUploadManager } from "@/components/imageUploadManager";
import { InfoItem } from "@/components/InfoItem";
import { LoginPrompt } from "@/components/LoginPrompt";
import { ProfilePic } from "@/components/profilePic";
import ScreenContainer from "@/components/screenContainer";
import { SectionLabel } from "@/components/sectionBlock";
import { useAuth } from "@/hooks/useAuth";
import { usePortfolioImages } from "@/hooks/usePortfolioImages";
import { truncateTitle } from "@/lib/utils";
import { useRouter } from "expo-router";
import { Button, Divider, Spinner, useThemeColor } from "heroui-native";
import {
  Bell,
  ChevronRight,
  Edit,
  FileText,
  LogOut,
  Scale,
  Shield,
  Star
} from "lucide-react-native";
import React, { useState } from "react";
import { Image, Modal, Text, View } from "react-native";

const AccountScreen = () => {
  const { logout, loading, isAuthenticated, user, refetchUser, updateUser } =
    useAuth();
  const { portfolioImages, updatePortfolioImages } = usePortfolioImages();
  const [refreshing, setRefreshing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const router = useRouter();
  const [themeColorAccentForeground, accentColor] = useThemeColor([
    "accent-foreground",
    "accent"
  ]);

  const handleSaveDescription = async (text: string) => {
    await updateUser({ description: text });
  };

  const handleSaveBusinessName = async (text: string) => {
    await updateUser({ businessName: text });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchUser();
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  };

  const handleImagesChange = async (imageUrls: string[]) => {
    try {
      await updatePortfolioImages(imageUrls);
    } catch (err) {}
  };

  if (loading && !refreshing) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center gap-3">
          <Spinner />
        </View>
      </ScreenContainer>
    );
  }

  // Legal section reused in LoginPrompt (unauthenticated)
  const legalSection = (
    <>
      <Divider className="my-4" />
      <Text
        className="text-foreground px-1 mb-1"
        style={{ fontSize: 15, fontFamily: "Inter_700Bold" }}
      >
        Informations légales
      </Text>
      <InfoItem
        leftIcon={<FileText size={22} color="#64748b" strokeWidth={1.75} />}
        label="Conditions d'utilisation (CGU)"
        rightContent={
          <ChevronRight size={20} color="#64748b" strokeWidth={1.75} />
        }
        onPress={() => router.push("/(tabs)/account/legal-terms")}
      />
      <InfoItem
        leftIcon={<Shield size={22} color="#64748b" strokeWidth={1.75} />}
        label="Politique de confidentialité"
        rightContent={
          <ChevronRight size={20} color="#64748b" strokeWidth={1.75} />
        }
        onPress={() => router.push("/(tabs)/account/legal-privacy")}
      />
      <InfoItem
        leftIcon={<Scale size={22} color="#64748b" strokeWidth={1.75} />}
        label="Mentions légales"
        rightContent={
          <ChevronRight size={20} color="#64748b" strokeWidth={1.75} />
        }
        onPress={() => router.push("/(tabs)/account/legal-notices")}
      />
    </>
  );

  if (!isAuthenticated) {
    return (
      <LoginPrompt
        icon={
          <Image
            source={{ uri: "https://img.icons8.com/cotton/128/share.png" }}
            style={{ width: 50, height: 50 }}
            className="rounded-2xl"
          />
        }
        title="Bienvenue sur Camerbay"
        description="Découvrez des milliers de services et connectez-vous avec des professionnels près de chez vous."
      >
        <InfoItem
          leftIcon={<Shield size={22} color="#0ea5e9" strokeWidth={1.75} />}
          label="Authentification sécurisée"
          value="Vos données sont protégées"
          iconBgColor="bg-blue-500/10"
          onPress={() => {}}
        />
        <InfoItem
          leftIcon={<Bell size={22} color="#22c55e" strokeWidth={1.75} />}
          label="Notifications en temps réel"
          value="Ne manquez aucune réservation"
          iconBgColor="bg-green-500/10"
          onPress={() => {}}
        />
        <InfoItem
          leftIcon={<Star size={22} color="#f59e0b" strokeWidth={1.75} />}
          label="Devenez professionnel"
          value="Proposez vos services et gagnez de l'argent"
          iconBgColor="bg-amber-500/10"
          onPress={() => {}}
        />
        {legalSection}
      </LoginPrompt>
    );
  }

  return (
    <ScreenContainer
      onRefresh={onRefresh}
      refreshing={refreshing}
      withSchrollView
    >
      {/* ── Profile header ── */}
      <View style={{ alignItems: "center", paddingTop: 8, paddingBottom: 24 }}>
        <ProfilePic profilePhotoUrl={user?.profilePhotoUrl} canUpload />

        {/* Name + edit */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: 14
          }}
        >
          <Text
            className="text-foreground"
            style={{ fontSize: 22, fontFamily: "Inter_700Bold" }}
          >
            {truncateTitle(user?.businessName || user?.username || "", 22)}
          </Text>
          <Button
            size="sm"
            variant="secondary"
            isIconOnly
            onPress={() => setEditingField("businessName")}
            className="rounded-xl w-8 h-8"
          >
            <Edit size={14} color="#71717a" strokeWidth={2} />
          </Button>
        </View>

        {/* Provider badge */}
        {user?.isProvider && (
          <View
            style={{
              backgroundColor: accentColor + "18",
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 99,
              marginTop: 8
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Inter_600SemiBold",
                color: accentColor
              }}
            >
              Prestataire
            </Text>
          </View>
        )}

        {/* Contact info */}
        {user?.email ? (
          <Text
            className="text-muted"
            style={{
              fontSize: 13,
              fontFamily: "Inter_400Regular",
              marginTop: 8
            }}
          >
            {user.email}
          </Text>
        ) : null}
        {user?.phone ? (
          <Text
            className="text-muted"
            style={{
              fontSize: 13,
              fontFamily: "Inter_400Regular",
              marginTop: 2
            }}
          >
            {user.phone}
          </Text>
        ) : null}
      </View>

      {/* ── Onboarding CTA ── */}
      {!user?.onBoardingCompleted && (
        <View style={{ marginBottom: 20 }}>
          <InfoItem
            variant="highlighted"
            leftIcon={<Star size={18} color={themeColorAccentForeground} />}
            label="Complétez votre profil"
            value="Débloquez toutes les fonctionnalités en complétant votre profil"
            rightContent={<ChevronRight size={18} color="#64748b" />}
            onPress={() => router.push("/(tabs)/account/onboarding")}
          />
        </View>
      )}

      {/* ── Description (provider only) ── */}
      {user?.isProvider && (
        <View style={{ marginBottom: 20 }}>
          <SectionLabel>À propos</SectionLabel>
          <View className="bg-surface border border-border rounded-2xl overflow-hidden">
            {/* Header row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1
              }}
              className="border-border"
            >
              <Text
                className="text-foreground"
                style={{ fontFamily: "Inter_600SemiBold", fontSize: 14 }}
              >
                Description
              </Text>
              <Button
                size="sm"
                variant="ghost"
                onPress={() => setEditingField("description")}
              >
                <Edit size={14} color="#71717a" strokeWidth={2} />
                <Button.Label
                  className="text-muted"
                  style={{ fontSize: 13, fontFamily: "Inter_500Medium" }}
                >
                  Modifier
                </Button.Label>
              </Button>
            </View>
            {/* Content */}
            <View style={{ padding: 16 }}>
              {user?.description ? (
                <ExpandableText text={user.description} />
              ) : (
                <Text
                  className="text-muted"
                  style={{
                    fontSize: 13,
                    fontFamily: "Inter_400Regular",
                    lineHeight: 20
                  }}
                >
                  Ajoutez une description de vos services...
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* ── Portfolio (provider only) ── */}
      {user?.isProvider && (
        <View style={{ marginBottom: 20 }}>
          <SectionLabel>Portfolio</SectionLabel>
          <ImageUploadManager
            initialImages={portfolioImages}
            onImagesChange={handleImagesChange}
            maxImages={10}
            readOnly
          />
        </View>
      )}

      {/* ── Legal section ── */}
      <SectionLabel>Informations légales</SectionLabel>
      <View
        className="bg-surface border border-border rounded-2xl overflow-hidden"
        style={{ marginBottom: 24 }}
      >
        <InfoItem
          leftIcon={<FileText size={20} color="#64748b" strokeWidth={1.75} />}
          label="Conditions d'utilisation (CGU)"
          rightContent={
            <ChevronRight size={18} color="#64748b" strokeWidth={1.75} />
          }
          onPress={() => router.push("/(tabs)/account/legal-terms")}
        />
        <View className="h-px bg-border" style={{ marginHorizontal: 16 }} />
        <InfoItem
          leftIcon={<Shield size={20} color="#64748b" strokeWidth={1.75} />}
          label="Politique de confidentialité"
          rightContent={
            <ChevronRight size={18} color="#64748b" strokeWidth={1.75} />
          }
          onPress={() => router.push("/(tabs)/account/legal-privacy")}
        />
        <View className="h-px bg-border" style={{ marginHorizontal: 16 }} />
        <InfoItem
          leftIcon={<Scale size={20} color="#64748b" strokeWidth={1.75} />}
          label="Mentions légales"
          rightContent={
            <ChevronRight size={18} color="#64748b" strokeWidth={1.75} />
          }
          onPress={() => router.push("/(tabs)/account/legal-notices")}
        />
      </View>

      {/* ── Logout ── */}
      <View style={{ paddingBottom: 32 }}>
        <Button size="md" variant="danger" onPress={() => logout()}>
          <LogOut size={20} color="white" strokeWidth={2} />
          <Button.Label
            style={{ fontFamily: "Inter_600SemiBold", fontSize: 15 }}
          >
            Se déconnecter
          </Button.Label>
        </Button>
      </View>

      {/* ── Edit modals ── */}
      <Modal
        visible={!!editingField}
        animationType="slide"
        onRequestClose={() => setEditingField(null)}
      >
        {editingField === "description" ? (
          <FullScreenTextarea
            title="Description"
            initialValue={user?.description}
            placeholder="Décrivez votre service..."
            onSave={handleSaveDescription}
            onClose={() => setEditingField(null)}
            maxLength={2000}
            saveButtonLabel="Sauvegarder"
            multiline
          />
        ) : null}

        {editingField === "businessName" ? (
          <FullScreenTextarea
            title="Nom du business"
            initialValue={user?.businessName || user?.username}
            placeholder="Le nom de votre business..."
            onSave={handleSaveBusinessName}
            onClose={() => setEditingField(null)}
            maxLength={40}
            saveButtonLabel="Sauvegarder"
          />
        ) : null}
      </Modal>
    </ScreenContainer>
  );
};

export default AccountScreen;
