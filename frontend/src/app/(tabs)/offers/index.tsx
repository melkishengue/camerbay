import { ActiveFilters } from "@/components/ActiveFilters";
import { CreateOfferFloatingButton } from "@/components/CreateOfferFloatingButton";
import { FullScreenModal } from "@/components/FullScreenModal";
import { OfferCard } from "@/components/offerCard";
import { OfferSearchForm, SearchFormData } from "@/components/OfferSearchForm";
import { ProviderCard } from "@/components/ProviderCard";
import ScreenContainer from "@/components/screenContainer";
import { useAuth } from "@/hooks/useAuth";
import { useOffers } from "@/hooks/useOffers";
import { useProviders } from "@/hooks/useProviders";
import { OfferFilters } from "@/types/offer";
import { ProviderFilters } from "@/types/provider";
import { useRouter } from "expo-router";
import { Button, Spinner, useThemeColor } from "heroui-native";
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

type ActiveTab = "offers" | "providers";

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
  const [activeTab, setActiveTab] = useState<ActiveTab>("offers");

  const [accentColor, mutedColor] = useThemeColor(["accent", "muted"]);

  const {
    offers,
    isLoading: offersLoading,
    isRefreshing: offersRefreshing,
    error: offersError,
    hasMore: offersHasMore,
    fetchOffers,
    refreshOffers,
    loadMore: loadMoreOffers
  } = useOffers();

  const {
    providers,
    isLoading: providersLoading,
    isRefreshing: providersRefreshing,
    error: providersError,
    hasMore: providersHasMore,
    fetchProviders,
    refreshProviders,
    loadMore: loadMoreProviders
  } = useProviders();

  const isLoading = activeTab === "offers" ? offersLoading : providersLoading;
  const isRefreshing =
    activeTab === "offers" ? offersRefreshing : providersRefreshing;
  const error = activeTab === "offers" ? offersError : providersError;

  const handleOfferPress = useCallback(
    (offerId: string) => {
      router.push(`/(tabs)/offers/${offerId}`);
    },
    [router]
  );

  const handleProviderPress = useCallback(
    (providerId: string) => {
      router.push(`/(tabs)/offers/provider/${providerId}`);
    },
    [router]
  );

  const handleSearch = useCallback(
    (searchData: SearchFormData) => {
      const offerFilters: OfferFilters = {
        searchText: searchData.searchQuery,
        categoryId: searchData.category?.id,
        latitude: searchData.city?.geometry.location.lat,
        longitude: searchData.city?.geometry.location.lng,
        radiusKm: searchData.radius
      };

      const providerFilters: ProviderFilters = {
        searchText: searchData.searchQuery,
        latitude: searchData.city?.geometry.location.lat,
        longitude: searchData.city?.geometry.location.lng,
        radiusKm: searchData.radius
      };

      setActiveFilters(searchData);
      setIsSearchModalVisible(false);
      fetchOffers(offerFilters);
      fetchProviders(providerFilters);
    },
    [fetchOffers, fetchProviders]
  );

  const handleClearAllFilters = useCallback(() => {
    setActiveFilters({});
    fetchOffers();
    fetchProviders();
  }, [fetchOffers, fetchProviders]);

  const handleClearFilter = useCallback(
    (key: keyof SearchFormData) => {
      setActiveFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters[key];

        const offerFilters: OfferFilters = {
          searchText: newFilters.searchQuery,
          categoryId: newFilters.category?.id,
          latitude: newFilters.city?.geometry.location.lat,
          longitude: newFilters.city?.geometry.location.lng,
          radiusKm: newFilters.radius
        };

        const providerFilters: ProviderFilters = {
          searchText: newFilters.searchQuery,
          latitude: newFilters.city?.geometry.location.lat,
          longitude: newFilters.city?.geometry.location.lng,
          radiusKm: newFilters.radius
        };

        fetchOffers(offerFilters);
        fetchProviders(providerFilters);
        return newFilters;
      });
    },
    [fetchOffers, fetchProviders]
  );

  const handleEndReached = useCallback(() => {
    if (activeTab === "offers" && offersHasMore && !offersLoading) {
      loadMoreOffers();
    } else if (
      activeTab === "providers" &&
      providersHasMore &&
      !providersLoading
    ) {
      loadMoreProviders();
    }
  }, [
    activeTab,
    offersHasMore,
    offersLoading,
    providersHasMore,
    providersLoading,
    loadMoreOffers,
    loadMoreProviders
  ]);

  const handleRefresh = useCallback(() => {
    if (activeTab === "offers") {
      refreshOffers();
    } else {
      refreshProviders();
    }
  }, [activeTab, refreshOffers, refreshProviders]);

  const openSearchModal = useCallback(() => setIsSearchModalVisible(true), []);
  const closeSearchModal = useCallback(
    () => setIsSearchModalVisible(false),
    []
  );

  const renderOfferItem = useCallback(
    ({ item }: { item: (typeof offers)[0] }) => (
      <OfferCard
        offer={item}
        currentUserId={user?.id}
        onPress={handleOfferPress}
      />
    ),
    [handleOfferPress, user?.id]
  );

  const renderProviderItem = useCallback(
    ({ item }: { item: (typeof providers)[0] }) => (
      <ProviderCard provider={item} onPress={handleProviderPress} />
    ),
    [handleProviderPress]
  );

  const offerKeyExtractor = useCallback(
    (item: (typeof offers)[0]) => item.id,
    []
  );

  const providerKeyExtractor = useCallback(
    (item: (typeof providers)[0]) => item.id,
    []
  );

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
    const label = activeTab === "offers" ? "offre" : "prestataire";
    return (
      <ScreenContainer withSchrollView>
        <View className="flex-1 justify-center items-center py-16">
          <Text className="text-gray-500 text-center mb-2">
            {hasActiveFilterKeys
              ? `Aucun ${label} correspondant à vos filtres`
              : `Aucun ${label} trouvé`}
          </Text>
          <Button
            onPress={() =>
              activeTab === "offers" ? fetchOffers() : fetchProviders()
            }
            variant="secondary"
            className="mt-4"
          >
            Recharger
          </Button>
        </View>
      </ScreenContainer>
    );
  }, [isLoading, hasActiveFilterKeys, activeTab, fetchOffers, fetchProviders]);

  const refreshControl = useMemo(
    () => (
      <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
    ),
    [isRefreshing, handleRefresh]
  );

  const offersContentContainerClassName = useMemo(
    () => (offers.length === 0 ? "flex-grow" : "pt-2 pb-28"),
    [offers.length]
  );

  const providersContentContainerClassName = useMemo(
    () => (providers.length === 0 ? "flex-grow" : "pt-2 pb-28"),
    [providers.length]
  );

  if (isLoading && offers.length === 0 && providers.length === 0 && !error) {
    return (
      <ScreenContainer>
        <View className="flex-1 justify-center items-center p-4">
          <Spinner size="lg" />
          <Text className="mt-4 text-gray-600">Chargement...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error && offers.length === 0 && providers.length === 0) {
    return (
      <ScreenContainer withSchrollView>
        <View className="items-center px-8 mt-60">
          <Text className="text-center mt-3 mb-2 text-foreground">
            Oops! Une erreur s&apos;est produite
          </Text>
          {error ? <Text className="text-center mb-4">{error}</Text> : null}
          <Button
            onPress={() =>
              activeTab === "offers" ? fetchOffers() : fetchProviders()
            }
            variant="secondary"
          >
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
                Rechercher...
              </Text>
              <View
                style={{ width: 1, height: 20, backgroundColor: "#3f3f46" }}
              />
              <SlidersHorizontal size={17} color="#71717a" strokeWidth={2} />
            </View>
          )}
        </Pressable>
      </View>

      {/* Tab switcher */}
      {/* <View className="flex-row" style={{ gap: 8 }}> */}
      <View className="flex-row mb-3" style={{ gap: 8 }}>
        {/* {(["offers", "providers"] as ActiveTab[]).map((tab) => { */}
        {([] as ActiveTab[]).map((tab) => {
          const isActive = activeTab === tab;
          const label = tab === "offers" ? "Offres" : "Prestataires";
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 7,
                borderRadius: 99,
                backgroundColor: isActive ? accentColor : "transparent",
                borderWidth: 1,
                borderColor: isActive ? accentColor : "#3f3f46"
              }}
            >
              <Text
                style={{
                  fontFamily: isActive
                    ? "Inter_600SemiBold"
                    : "Inter_400Regular",
                  fontSize: 13,
                  color: isActive ? "#fff" : mutedColor
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ActiveFilters
        filters={activeFilters}
        onClearAll={handleClearAllFilters}
        onClearFilter={handleClearFilter}
        onPress={openSearchModal}
      />

      {activeTab === "offers" ? (
        <FlatList
          data={offers}
          renderItem={renderOfferItem}
          keyExtractor={offerKeyExtractor}
          contentContainerClassName={offersContentContainerClassName}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={listFooter}
          refreshControl={refreshControl}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={providers}
          renderItem={renderProviderItem}
          keyExtractor={providerKeyExtractor}
          contentContainerClassName={providersContentContainerClassName}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={listFooter}
          refreshControl={refreshControl}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
        />
      )}

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
            showCategory={activeTab === "offers"}
          />
        </FullScreenModal>
      </Modal>
    </ScreenContainer>
  );
}

export default OfferListScreen;
