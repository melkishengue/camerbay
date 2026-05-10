import { X } from "lucide-react-native";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface PhotoCarouselProps {
  photos: string[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export function ModalPhotoCarousel({
  photos,
  initialIndex = 0,
  visible,
  onClose
}: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  if (photos.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)" }}>
        {/* Close Button */}
        <View className="absolute top-12 right-6 z-10">
          <Pressable
            onPress={onClose}
            className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
          >
            <X size={24} color="white" />
          </Pressable>
        </View>

        {/* Photo Counter */}
        <View className="absolute top-12 left-6 z-10">
          <View className="bg-black/50 px-3 py-1.5 rounded-full">
            <Text className="text-white text-sm font-medium">
              {currentIndex + 1} / {photos.length}
            </Text>
          </View>
        </View>

        {/* Scrollable Photos */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentOffset={{ x: initialIndex * SCREEN_WIDTH, y: 0 }}
        >
          {photos.map((photo, index) => (
            <View
              key={index}
              style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
              className="items-center justify-center"
            >
              <Image
                source={{ uri: photo }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                resizeMode="contain"
              />
            </View>
          ))}
        </ScrollView>

        {/* {photos.length > 1 && (
          <View className="absolute bottom-12 left-0 right-0 flex-row justify-center gap-2">
            {photos.map((_, index) => (
              <Dot size={10} key={index} />
              // <View
              //   key={index}
              //   className={`h-2 rounded-full ${
              //     index === currentIndex ? "bg-white w-8" : "bg-blue/40 w-2"
              //   }`}
              // />
            ))}
          </View>
        )} */}
      </SafeAreaView>
    </Modal>
  );
}
