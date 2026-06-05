import { LoginPrompt } from "@/components/LoginPrompt";
import { OfferCard } from "@/components/offerCard";
import ScreenContainer from "@/components/screenContainer";
import { useAuth } from "@/hooks/useAuth";
import { useLikedOffers, useLikeToggle } from "@/hooks/useLikes";
import { useRouter } from "expo-router";
import { Button, Spinner } from "heroui-native";
import { Heart } from "lucide-react-native";
import React, { useCallback } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";

export default function LikesScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toggleLike } = useLikeToggle();
  const { offers, isLoading, isRefreshing, error, load, refresh, loadMore } =
    useLikedOffers(isAuthenticated);

  const handleOfferPress = useCallback(
    (offerId: string) => {
      router.push(`/(tabs)/likes/offers/${offerId}`);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof offers)[0] }) => (
      <OfferCard
        offer={{ ...item, isLiked: true }}
        currentUserId={user?.id}
        onPress={handleOfferPress}
        onLike={toggleLike}
      />
    ),
    [handleOfferPress, user?.id, toggleLike]
  );

  const keyExtractor = useCallback((item: (typeof offers)[0]) => item.id, []);

  if (!isAuthenticated) {
    return (
      <LoginPrompt
        icon={<Heart size={50} color="#ef4444" strokeWidth={1.5} />}
        title="Vos favoris"
        description="Connectez-vous pour sauvegarder vos offres préférées et les retrouver facilement."
      />
    );
  }

  if (isLoading && offers.length === 0) {
    return (
      <ScreenContainer>
        <View className="flex-1 justify-center items-center p-4">
          <Spinner size="lg" />
          <Text className="mt-4 text-gray-600">Chargement...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error && offers.length === 0) {
    return (
      <ScreenContainer withSchrollView>
        <View className="items-center px-8 mt-60">
          <Text className="text-center mt-3 mb-2 text-foreground">
            Oops! Une erreur s&apos;est produite
          </Text>
          <Button onPress={load} variant="secondary" className="mt-4">
            Réessayer
          </Button>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={offers}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerClassName={
          offers.length === 0 ? "flex-grow" : "pt-2 pb-28"
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="flex-1 justify-center items-center py-16">
              <Heart size={48} color="#ef4444" strokeWidth={1.5} />
              <Text className="text-muted text-center mt-4 px-8">
                Aucun favori pour le moment.{"\n"}Likez des offres pour les
                retrouver ici.
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoading ? (
            <View className="py-5 items-center">
              <Spinner />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}
