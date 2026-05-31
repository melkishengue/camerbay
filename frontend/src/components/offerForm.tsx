import { ImageUploadManager } from "@/components/imageUploadManager";
import { Place } from "@/hooks/useCitySearch";
import { Category } from "@/types/category";
import { Offer, OfferFormResult, PricingItem } from "@/types/offer";
import { Button, TextField, useThemeColor } from "heroui-native";
import {
  AlignLeft,
  Camera,
  CheckCircle2,
  MapPin,
  Tag,
  Trash2,
  X
} from "lucide-react-native";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { CategorySelect } from "./categorySelect";
import { CityAutocomplete } from "./cityAutoComplete";
import { IconTextField } from "./iconTextField";
import { SectionBlock } from "./sectionBlock";

interface OfferFormData {
  title: string;
  description: string;
  category: Category | null;
  postalCode: string;
  city: Place;
}

interface OfferFormProps {
  initialData?: Offer;
  onSubmit: (data: OfferFormResult) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel?: string;
}

export function OfferForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = "Enregistrer"
}: OfferFormProps) {
  const [photos, setPhotos] = useState<string[]>(initialData?.photos || []);
  const [pricingItems, setPricingItems] = useState<PricingItem[]>(
    initialData?.pricingItems || []
  );
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [themeColorAccentForeground, accentColor] = useThemeColor([
    "accent-foreground",
    "accent"
  ]);

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<OfferFormData>({
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      category: initialData?.category || null,
      city: initialData
        ? {
            name: initialData.location.city,
            formatted_address: initialData.location.address,
            geometry: {
              location: {
                lat: initialData.location.latitude,
                lng: initialData.location.longitude
              }
            }
          }
        : undefined
    }
  });

  const handleAddPricingItem = () => {
    if (!newItemTitle.trim() || !newItemPrice.trim()) {
      Alert.alert("Erreur", "Veuillez remplir le titre et le prix");
      return;
    }

    const price = parseFloat(newItemPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Erreur", "Le prix doit être un nombre positif");
      return;
    }

    if (pricingItems.length >= 20) {
      Alert.alert("Erreur", "Vous ne pouvez pas ajouter plus de 20 tarifs");
      return;
    }

    setPricingItems([
      ...pricingItems,
      {
        title: newItemTitle.trim(),
        price: {
          amount: price,
          currency: "EUR"
        }
      }
    ]);

    setNewItemTitle("");
    setNewItemPrice("");
  };

  const handleRemovePricingItem = (index: number) => {
    setPricingItems(pricingItems.filter((_, i) => i !== index));
  };

  const handleImagesChange = async (imageUrls: string[]) => {
    setPhotos(imageUrls);
  };

  const onSubmitForm = async (data: OfferFormData) => {
    if (!data.category) {
      Alert.alert("Erreur", "Veuillez sélectionner une catégorie");
      return;
    }

    console.log("🎅", data.city);

    const offerData: OfferFormResult = {
      title: data.title,
      description: data.description,
      categoryId: data.category.id,
      category: data.category,
      location: {
        city: data.city.name,
        address: data.city.formatted_address,
        latitude: data.city.geometry.location.lat,
        longitude: data.city.geometry.location.lng
      },
      pricingItems,
      photos
    };

    console.log("👨‍👨‍👧‍👧", JSON.stringify(offerData, null, 2));

    await onSubmit(offerData);
  };

  return (
    <View className="flex-1 px-2">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
      >
        {/* Informations de base */}
        <SectionBlock
          title="Informations de base"
          icon={<AlignLeft size={11} color={accentColor} strokeWidth={2.5} />}
        >
          <View style={{ gap: 12 }}>
            <Controller
              control={control}
              name="title"
              rules={{
                required: "Le titre est requis",
                maxLength: {
                  value: 200,
                  message: "Le titre ne peut pas dépasser 200 caractères"
                }
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <IconTextField
                  label="Titre"
                  value={value}
                  maxLength={50}
                  onChangeText={onChange}
                  placeholder="Ex: Coupe de cheveux homme"
                  error={errors.title?.message}
                  icon={<AlignLeft size={16} color="#71717a" strokeWidth={2} />}
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              rules={{
                required: "La description est requise"
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField isInvalid={!!errors.description}>
                  <TextField.Label>Description</TextField.Label>
                  <TextField.Input
                    placeholder="Décrivez votre offre en détail..."
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    className="h-[100px]"
                  />
                  {errors.description && (
                    <TextField.ErrorMessage>
                      {errors.description.message}
                    </TextField.ErrorMessage>
                  )}
                </TextField>
              )}
            />

            <CategorySelect control={control} errors={errors} />
          </View>
        </SectionBlock>

        {/* Localisation */}
        <SectionBlock
          title="Localisation"
          icon={<MapPin size={11} color={accentColor} strokeWidth={2.5} />}
        >
          <CityAutocomplete
            control={control}
            name="city"
            errors={errors}
            label="Ville *"
            description="Recherchez une ville ou utilisez votre localisation"
            placeholder="Entrez le nom d'une ville..."
            countryCode="DE"
            radiusKm={2}
            isRequired
            rules={{
              required: "La ville est requise"
            }}
          />
        </SectionBlock>

        {/* Tarifs */}
        <SectionBlock
          title="Tarifs (optionnel)"
          icon={<Tag size={11} color={accentColor} strokeWidth={2.5} />}
        >
          <View style={{ gap: 12 }}>
            {pricingItems.length > 0 && (
              <View style={{ gap: 8 }}>
                {pricingItems.map((item, index) => (
                  <View
                    key={index}
                    className="flex-row items-center gap-3 border border-border rounded-xl px-4 py-3"
                  >
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center"
                      style={{ backgroundColor: accentColor + "18" }}
                    >
                      <Tag size={16} color={accentColor} strokeWidth={2} />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-foreground"
                        style={{
                          fontSize: 14,
                          fontFamily: "Inter_600SemiBold"
                        }}
                      >
                        {item.title}
                      </Text>
                      <Text
                        className="text-muted"
                        style={{ fontSize: 12, fontFamily: "Inter_500Medium" }}
                      >
                        {item.price.amount.toLocaleString()}{" "}
                        {item.price.currency}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemovePricingItem(index)}
                      className="w-9 h-9 items-center justify-center rounded-xl"
                      style={{ backgroundColor: "#ef444418" }}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={17} color="#ef4444" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Add new pricing item */}
            <View
              className="border border-border rounded-xl"
              style={{ padding: 12, gap: 10 }}
            >
              <Text
                className="text-foreground"
                style={{ fontSize: 14, fontFamily: "Inter_600SemiBold" }}
              >
                Ajouter un tarif
              </Text>

              <IconTextField
                label="Intitulé"
                value={newItemTitle}
                maxLength={50}
                onChangeText={setNewItemTitle}
                placeholder="Ex: Coupe simple"
                icon={<AlignLeft size={16} color="#71717a" strokeWidth={2} />}
              />

              <IconTextField
                label="Prix (€)"
                value={newItemPrice}
                maxLength={10}
                onChangeText={setNewItemPrice}
                placeholder="Ex: 25"
                keyboardType="numeric"
                icon={<Tag size={16} color="#71717a" strokeWidth={2} />}
              />

              <Button
                variant="secondary"
                size="sm"
                onPress={handleAddPricingItem}
                isDisabled={!newItemTitle.trim() || !newItemPrice.trim()}
              >
                <Tag size={16} color={accentColor} strokeWidth={2} />
                <Button.Label
                  style={{ fontFamily: "Inter_600SemiBold", fontSize: 14 }}
                >
                  Ajouter ce tarif
                </Button.Label>
              </Button>
            </View>

            <Text
              className="text-muted"
              style={{ fontSize: 12, fontFamily: "Inter_400Regular" }}
            >
              Jusqu&apos;à 20 tarifs différents
            </Text>
          </View>
        </SectionBlock>

        {/* Photos */}
        <SectionBlock
          title="Photos"
          icon={<Camera size={11} color={accentColor} strokeWidth={2.5} />}
        >
          <ImageUploadManager
            initialImages={photos}
            onImagesChange={handleImagesChange}
            maxImages={10}
          />
        </SectionBlock>

        {/* Bottom action buttons */}
        <View className="gap-2 pt-2">
          <Button
            variant="primary"
            onPress={handleSubmit(onSubmitForm)}
            isDisabled={isSubmitting}
            size="lg"
          >
            {isSubmitting ? (
              <Button.Label>Enregistrement...</Button.Label>
            ) : (
              <>
                <CheckCircle2
                  size={20}
                  color={themeColorAccentForeground}
                  strokeWidth={2}
                />
                <Button.Label>{submitLabel}</Button.Label>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onPress={onCancel}
            isDisabled={isSubmitting}
            size="lg"
          >
            <X size={18} color="#71717a" strokeWidth={2} />
            <Button.Label className="text-muted">Annuler</Button.Label>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
