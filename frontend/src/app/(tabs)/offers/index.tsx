import { ActiveFilters } from "@/components/ActiveFilters";
import { CreateOfferFloatingButton } from "@/components/CreateOfferFloatingButton";
import { FullScreenModal } from "@/components/FullScreenModal";
import { OfferCard } from "@/components/offerCard";
import { OfferSearchForm, SearchFormData } from "@/components/OfferSearchForm";
import ScreenContainer from "@/components/screenContainer";
import { useAuth } from "@/hooks/useAuth";
import { OfferFilters } from "@/types/offer";
import { useRouter } from "expo-router";
import { Button, Spinner } from "heroui-native";
import { Search, SlidersHorizontal } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  View
} from "react-native";
import { useOffers } from "../../../hooks/useOffers";

// eslint-disable-next-line react/display-name
const ListFooter = React.memo(({ isLoading }: { isLoading: boolean }) => {
  if (!isLoading) return null;
  return (
    <View className="py-5 items-center">
      <Spinner />
    </View>
  );
});

function OfferListScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Partial<SearchFormData>>(
    {}
  );

  const {
    offers,
    isLoading,
    isRefreshing,
    error,
    hasMore,
    fetchOffers,
    refreshOffers,
    loadMore
  } = useOffers();

  const handleOfferPress = useCallback(
    (offerId: string) => {
      router.push(`/(tabs)/offers/${offerId}`);
    },
    [router]
  );

  const handleSearch = useCallback(
    (searchData: SearchFormData) => {
      const filters: OfferFilters = {
        searchText: searchData.searchQuery,
        categoryId: searchData.category?.id,
        latitude: searchData.city?.geometry.location.lat,
        longitude: searchData.city?.geometry.location.lng,
        radiusKm: searchData.radius
      };

      setActiveFilters(searchData);
      setIsSearchModalVisible(false);
      fetchOffers(filters);
    },
    [fetchOffers]
  );

  const handleClearAllFilters = useCallback(() => {
    setActiveFilters({});
    fetchOffers();
  }, [fetchOffers]);

  const handleClearFilter = useCallback(
    (key: keyof SearchFormData) => {
      setActiveFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters[key];

        const filters: OfferFilters = {
          searchText: newFilters.searchQuery,
          categoryId: newFilters.category?.id,
          latitude: newFilters.city?.geometry.location.lat,
          longitude: newFilters.city?.geometry.location.lng,
          radiusKm: newFilters.radius
        };

        fetchOffers(filters);
        return newFilters;
      });
    },
    [fetchOffers]
  );

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoading) {
      loadMore();
    }
  }, [hasMore, isLoading, loadMore]);

  const openSearchModal = useCallback(() => setIsSearchModalVisible(true), []);

  const closeSearchModal = useCallback(
    () => setIsSearchModalVisible(false),
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof offers)[0] }) => (
      <OfferCard
        offer={item}
        currentUserId={user?.id}
        onPress={handleOfferPress}
      />
    ),
    [handleOfferPress, user?.id]
  );

  const keyExtractor = useCallback((item: (typeof offers)[0]) => item.id, []);

  const listFooter = useMemo(
    () => <ListFooter isLoading={isLoading} />,
    [isLoading]
  );

  const hasActiveFilterKeys = useMemo(
    () => Object.keys(activeFilters).length > 0,
    [activeFilters]
  );

  const renderEmptyState = useCallback(() => {
    if (isLoading) return null;

    return (
      <ScreenContainer withSchrollView>
        <View className="flex-1 justify-center items-center py-16">
          <Text className="text-gray-500 text-center mb-2">
            {hasActiveFilterKeys
              ? "Aucune offre correspondant à vos filtres"
              : "Aucune offre trouvée"}
          </Text>
          <Button
            onPress={() => fetchOffers()}
            variant="secondary"
            className="mt-4"
          >
            Recharger
          </Button>
        </View>
      </ScreenContainer>
    );
  }, [isLoading, hasActiveFilterKeys, fetchOffers]);

  const refreshControl = useMemo(
    () => (
      <RefreshControl refreshing={isRefreshing} onRefresh={refreshOffers} />
    ),
    [isRefreshing, refreshOffers]
  );

  const contentContainerClassName = useMemo(
    () => (offers.length === 0 ? "flex-grow" : "pt-2 pb-28"),
    [offers.length]
  );

  if (isLoading && offers.length === 0 && !error) {
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
          {error ? <Text className="text-center mb-4">{error}</Text> : null}
          <Button onPress={() => fetchOffers()} variant="secondary">
            Reessayer
          </Button>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer noHeader>
      {/* Header + search bar */}
      <View className="pt-5 pb-4">
        <Text
          className="text-foreground"
          style={{ fontSize: 30, fontFamily: "Inter_700Bold", marginBottom: 2 }}
        >
          Découvrir
        </Text>
        <Text
          className="text-muted"
          style={{
            fontSize: 13,
            fontFamily: "Inter_400Regular",
            marginBottom: 14
          }}
        >
          Trouvez les meilleurs services près de vous
        </Text>

        <Pressable onPress={openSearchModal}>
          {({ pressed }) => (
            <View
              className="flex-row items-center bg-surface rounded-2xl border border-border px-4"
              style={{ height: 50, opacity: pressed ? 0.75 : 1, gap: 12 }}
            >
              <Search size={18} color="#71717a" strokeWidth={2} />
              <Text
                className="text-muted flex-1"
                style={{ fontSize: 14, fontFamily: "Inter_400Regular" }}
              >
                Rechercher des offres...
              </Text>
              <View
                style={{ width: 1, height: 20, backgroundColor: "#3f3f46" }}
              />
              <SlidersHorizontal size={17} color="#71717a" strokeWidth={2} />
            </View>
          )}
        </Pressable>
      </View>

      <ActiveFilters
        filters={activeFilters}
        onClearAll={handleClearAllFilters}
        onClearFilter={handleClearFilter}
        onPress={openSearchModal}
      />

      {/* <CategoryList
        categories={categories}
        selectedId={activeFilters.category?.id}
        onSelect={handleCategorySelect}
      /> */}

      <FlatList
        data={offers}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        // numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerClassName={contentContainerClassName}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={listFooter}
        refreshControl={refreshControl}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />

      <CreateOfferFloatingButton />

      <Modal
        visible={isSearchModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeSearchModal}
      >
        <FullScreenModal
          title="Rechercher"
          onClose={closeSearchModal}
          showSaveButton={false}
        >
          <OfferSearchForm
            initialValues={activeFilters}
            onSearch={handleSearch}
          />
        </FullScreenModal>
      </Modal>
    </ScreenContainer>
  );
}

export default OfferListScreen;
