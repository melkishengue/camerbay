import { ExpandableText } from "@/components/ExpandableText";
import { ImageUploadManager } from "@/components/imageUploadManager";
import { ProfilePic } from "@/components/profilePic";
import ScreenContainer from "@/components/screenContainer";
import { SectionBlock, SectionLabel } from "@/components/sectionBlock";
import { useAuth } from "@/hooks/useAuth";
import { useChannelById } from "@/hooks/useChannelById";
import { useUser } from "@/hooks/useUser";
import { apiClient } from "@/lib/axios-api-client";
import { truncateTitle } from "@/lib/utils";
import { useLocalSearchParams } from "expo-router";
import { Button, Spinner, useThemeColor } from "heroui-native";
import { LogIn, MessageCircle } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function ProviderProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: authUser, isAuthenticated, login } = useAuth();
  const { user, loading } = useUser(id!);
  const { startChatChannel, isCreatingChannel } = useChannelById();
  const [themeColorAccentForeground, accentColor] = useThemeColor([
    "accent-foreground",
    "accent"
  ]);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);

  const isOwnProfile = authUser?.id === id;

  useEffect(() => {
    if (!id) return;
    apiClient
      .get<{ images: string[] }>(`/api/v1/users/${id}/portfolio`)
      .then((res) => setPortfolioImages(res.data.images))
      .catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center gap-3">
          <Spinner size="lg" />
          <Text
            className="text-muted"
            style={{ fontFamily: "Inter_400Regular", fontSize: 14 }}
          >
            Chargement...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!user) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <Text
            className="text-muted"
            style={{ fontFamily: "Inter_400Regular" }}
          >
            Profil introuvable
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer withSchrollView>

        {/* ── Profile header ── */}
        <View style={{ alignItems: "center", paddingTop: 8, paddingBottom: 24 }}>
          <ProfilePic profilePhotoUrl={user.profilePhotoUrl} />

          {/* Name */}
          <Text
            className="text-foreground"
            style={{
              fontSize: 22,
              fontFamily: "Inter_700Bold",
              marginTop: 14,
              textAlign: "center"
            }}
          >
            {truncateTitle(user.businessName || user.username || "", 24)}
          </Text>

          {/* Provider badge */}
          {user.isProvider && (
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
        </View>

        {/* ── Description ── */}
        {user.description ? (
          <View style={{ marginBottom: 20 }}>
            <SectionBlock title="À propos">
              <ExpandableText text={user.description} />
            </SectionBlock>
          </View>
        ) : null}

        {/* ── Portfolio ── */}
        {portfolioImages.length > 0 ? (
          <View style={{ marginBottom: 24 }}>
            <SectionLabel>Portfolio</SectionLabel>
            <ImageUploadManager
              initialImages={portfolioImages}
              onImagesChange={() => {}}
              maxImages={10}
              readOnly
            />
          </View>
        ) : null}

      </ScreenContainer>

      {/* ── Bottom bar (non-own profile) ── */}
      {!isOwnProfile && (
        <View
          className="bg-background border-t border-border"
          style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32 }}
        >
          {isAuthenticated ? (
            <Button
              variant="primary"
              onPress={() => startChatChannel(id!)}
            >
              <MessageCircle
                size={20}
                color={themeColorAccentForeground}
                strokeWidth={2}
              />
              <Button.Label
                style={{ fontFamily: "Inter_600SemiBold", fontSize: 15 }}
              >
                {isCreatingChannel
                  ? "Un instant..."
                  : `Contacter ${truncateTitle(user.businessName || user.username || "", 20)}`}
              </Button.Label>
            </Button>
          ) : (
            <Button variant="primary" onPress={login}>
              <LogIn
                size={20}
                color={themeColorAccentForeground}
                strokeWidth={2}
              />
              <Button.Label
                style={{ fontFamily: "Inter_600SemiBold", fontSize: 15 }}
              >
                Se connecter pour contacter
              </Button.Label>
            </Button>
          )}
        </View>
      )}
    </View>
  );
}
