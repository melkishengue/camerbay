import { ExpandableText } from "@/components/ExpandableText";
import { FullScreenOfferForm } from "@/components/FullScreenOfferForm";
import { ModalPhotoCarousel } from "@/components/modalPhotoCarousel";
import { PhotoCarousel } from "@/components/photoCarousel";
import { PricingListDisplay } from "@/components/pricingListDisplay";
import ScreenContainer from "@/components/screenContainer";
import { SectionLabel } from "@/components/sectionBlock";
import { SwitchField } from "@/components/switchField";
import { useAuth } from "@/hooks/useAuth";
import { useChannelById } from "@/hooks/useChannelById";
import { useOffer } from "@/hooks/useOffer";
import { useOfferDetails } from "@/hooks/useOfferDetails";
import { truncateTitle } from "@/lib/utils";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Avatar,
  Button,
  Spinner,
  useThemeColor,
  useToast
} from "heroui-native";
import {
  ChevronRight,
  Edit,
  LogIn,
  MapPin,
  MessageCircle,
  Share2,
  Star,
  Tag,
  Trash2
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, Modal, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function SectionDivider() {
  return <View className="bg-border h-px my-[22px]" />;
}

export default function OfferDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const [
    backgroundColor,
    themeColorAccentForeground,
    accentColor,
    successColor,
    mutedColor,
    warningColor,
    dangerColor
  ] = useThemeColor([
    "background",
    "accent-foreground",
    "accent",
    "success",
    "muted",
    "warning",
    "danger"
  ]);
  const { user, isAuthenticated, login } = useAuth();
  const { offer, isLoading } = useOfferDetails(id!);
  const { startChatChannel, isCreatingChannel } = useChannelById();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const { activateOffer, deactivateOffer, deleteOffer, isDeleting } =
    useOffer(offer);
  const { toast } = useToast();

  const [carouselVisible, setCarouselVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isActive, setIsActive] = useState<boolean>(offer?.active || false);

  useEffect(() => {
    setIsActive(offer?.active || false);
  }, [offer?.active]);

  useEffect(() => {
    if (offer?.title) {
      navigation.setOptions({
        headerTitle: truncateTitle(offer.title, 25)
      });
    }
  }, [offer?.title, navigation]);

  const isOwner: boolean = user?.id === offer?.providerId;
  const rating = offer?.providerRating || 3;

  const handlePhotoPress = (index: number) => {
    setSelectedPhotoIndex(index);
    setCarouselVisible(true);
  };

  const handleToggleActive = async (value: boolean) => {
    try {
      setIsActive(value);
      if (value) {
        await activateOffer();
        toast.show({ label: "Offre activée", variant: "success" });
      } else {
        await deactivateOffer();
        toast.show({ label: "Offre désactivée", variant: "default" });
      }
    } catch (error) {
      setIsActive(!value);
      toast.show({
        label: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "danger"
      });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Supprimer l'offre",
      "Êtes-vous sûr de vouloir supprimer cette offre ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await deleteOffer();
            toast.show({ label: "Offre supprimée", variant: "success" });
            router.back();
          }
        }
      ]
    );
  };

  const handleShare = async () => {
    toast.show({
      label: "Partage",
      description: "Fonctionnalité de partage à venir",
      variant: "default"
    });
  };

  const contactProvider = async (otherProviderId: string) => {
    await startChatChannel(otherProviderId);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor }}>
        <View className="flex-1 items-center justify-center gap-3">
          <Spinner size="lg" />
          <Text
            className="text-muted text-sm"
            style={{ fontFamily: "Inter_400Regular" }}
          >
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!offer) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor }}>
        <View className="flex-1 items-center justify-center">
          <Text
            className="text-muted"
            style={{ fontFamily: "Inter_400Regular" }}
          >
            Offre introuvable
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1">
      <ScreenContainer withSchrollView immersiveHeader noPadding>
        {/* Photo carousel — full bleed, gradient bleeds into content */}
        <PhotoCarousel onPhotoPress={handlePhotoPress} photos={offer.photos} />

        {/* Content */}
        <View className="px-4 py-6">
          {/* Title + Share */}
          <View className="flex-row items-start gap-3 mb-3">
            <Text
              className="flex-1 text-foreground text-[22px] leading-[30px]"
              style={{ fontFamily: "Inter_700Bold" }}
            >
              {offer.title}
            </Text>
            <Button
              variant="secondary"
              size="sm"
              isIconOnly
              onPress={handleShare}
              className="rounded-xl mt-0.5"
            >
              <Share2
                size={17}
                color={themeColorAccentForeground}
                strokeWidth={2}
              />
            </Button>
          </View>

          {/* Meta chips: category + owner status */}
          <View className="flex-row items-center gap-2 flex-wrap mb-3">
            {/* Category chip */}
            <View
              className="flex-row items-center gap-[5px] px-[10px] py-[5px] rounded-full"
              style={{ backgroundColor: accentColor + "18" }}
            >
              <Tag size={12} color={accentColor} strokeWidth={2} />
              <Text
                className="text-xs"
                style={{ fontFamily: "Inter_500Medium", color: accentColor }}
              >
                {offer.category.title}
              </Text>
            </View>

            {/* Status chip — owner only */}
            {isOwner && (
              <View
                className="px-[10px] py-[5px] rounded-full"
                style={{
                  backgroundColor: offer.active
                    ? successColor + "18"
                    : mutedColor + "18"
                }}
              >
                <Text
                  className="text-xs"
                  style={{
                    fontFamily: "Inter_500Medium",
                    color: offer.active ? successColor : mutedColor
                  }}
                >
                  {offer.active ? "Active" : "Désactivée"}
                </Text>
              </View>
            )}
          </View>

          {/* Location */}
          <View className="flex-row items-center gap-[6px] mb-2">
            <MapPin size={14} color={mutedColor} strokeWidth={2} />
            <Text
              className="text-muted text-[13px]"
              style={{ fontFamily: "Inter_400Regular" }}
            >
              {offer.location.address}
            </Text>
          </View>

          {/* Rating row */}
          <View className="flex-row items-center gap-[6px] mb-6">
            <View className="flex-row gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  fill={s <= rating ? warningColor : "transparent"}
                  color={s <= rating ? warningColor : mutedColor}
                  strokeWidth={1.5}
                />
              ))}
            </View>
            <Text
              className="text-muted text-[13px]"
              style={{ fontFamily: "Inter_500Medium" }}
            >
              {rating > 0 ? rating.toFixed(1) : "—"}
            </Text>
            {offer.providerReviewCount ? (
              <Text
                className="text-muted text-[13px]"
                style={{ fontFamily: "Inter_400Regular" }}
              >
                · {offer.providerReviewCount} avis
              </Text>
            ) : null}
          </View>

          {/* Description */}
          {offer.description ? (
            <>
              <SectionLabel>À propos</SectionLabel>
              <ExpandableText text={offer.description} />
              <SectionDivider />
            </>
          ) : null}

          {/* Pricing */}
          <SectionLabel>Tarifs</SectionLabel>
          <PricingListDisplay pricingItems={offer.pricingItems} />

          <SectionDivider />

          {/* Provider */}
          <SectionLabel>Prestataire</SectionLabel>
          <TouchableOpacity
            onPress={() =>
              router.push(`/(tabs)/offers/provider/${offer.providerId}`)
            }
            activeOpacity={0.7}
            className="bg-surface border border-border flex-row items-center gap-[14px] rounded-[18px] p-[14px]"
          >
            <Avatar size="lg" alt={offer.providerName ?? ""}>
              <Avatar.Image source={{ uri: offer.providerPhotoImageUrl }} />
              <Avatar.Fallback />
            </Avatar>
            <View className="flex-1">
              <Text
                className="text-foreground text-[15px]"
                style={{ fontFamily: "Inter_700Bold" }}
              >
                {offer.providerName}
              </Text>
              <Text
                className="text-muted text-xs mt-0.5"
                style={{ fontFamily: "Inter_400Regular" }}
              >
                Voir le profil complet
              </Text>
            </View>
            <ChevronRight size={20} color={mutedColor} strokeWidth={1.75} />
          </TouchableOpacity>

          {/* Owner: active toggle */}
          {isOwner && (
            <>
              <SectionDivider />
              <View className="bg-surface border border-border rounded-2xl p-4">
                <SwitchField
                  isSelected={isActive}
                  onSelectedChange={handleToggleActive}
                  title="Offre active"
                  description="Les offres désactivées n'apparaissent pas dans les résultats de recherche."
                />
              </View>
            </>
          )}
        </View>

        <ModalPhotoCarousel
          photos={offer.photos || []}
          initialIndex={selectedPhotoIndex}
          visible={carouselVisible}
          onClose={() => setCarouselVisible(false)}
        />

        <Modal
          visible={isEditModalVisible}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <FullScreenOfferForm
            mode="edit"
            offerId={offer.id}
            initialData={offer}
            onClose={() => setIsEditModalVisible(false)}
          />
        </Modal>

        {/* Owner bottom bar */}
        {isOwner && (
          <View className="bg-background border-t border-border px-4 pt-[14px] pb-7 gap-[10px]">
            <Button
              variant="primary"
              onPress={() => setIsEditModalVisible(true)}
            >
              <Edit
                size={20}
                color={themeColorAccentForeground}
                strokeWidth={2}
              />
              <Button.Label
                className="text-[15px]"
                style={{ fontFamily: "Inter_600SemiBold" }}
              >
                Modifier l&apos;offre
              </Button.Label>
            </Button>

            <Button
              variant="ghost"
              onPress={handleDelete}
              isDisabled={isDeleting}
            >
              {!isDeleting ? (
                <>
                  <Trash2 size={20} color={dangerColor} strokeWidth={2} />
                  <Button.Label
                    className="text-danger text-[15px]"
                    style={{ fontFamily: "Inter_600SemiBold" }}
                  >
                    Supprimer l&apos;offre
                  </Button.Label>
                </>
              ) : (
                <Spinner size="sm" />
              )}
            </Button>
          </View>
        )}

        {/* Non-owner bottom bar */}
        {!isOwner && (
          <View className="bg-background border-t border-border px-4 pt-[14px] pb-8">
            {isAuthenticated ? (
              <Button
                variant="primary"
                onPress={() => contactProvider(offer.providerId)}
              >
                <MessageCircle
                  size={20}
                  color={themeColorAccentForeground}
                  strokeWidth={2}
                />
                <Button.Label
                  className="text-[15px]"
                  style={{ fontFamily: "Inter_600SemiBold" }}
                >
                  {isCreatingChannel
                    ? "Un instant..."
                    : `Contacter ${truncateTitle(offer.providerName, 20)}`}
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
                  className="text-[15px]"
                  style={{ fontFamily: "Inter_600SemiBold" }}
                >
                  Se connecter pour contacter
                </Button.Label>
              </Button>
            )}
          </View>
        )}
      </ScreenContainer>
    </View>
  );
}
