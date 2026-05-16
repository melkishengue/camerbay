import { LinearGradient } from "expo-linear-gradient";
import { useThemeColor } from "heroui-native";
import { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_HEIGHT = 320;

type PhotoCarouselProps = {
  photos?: string[];
  onPhotoPress?: (index: number) => void;
};

export function PhotoCarousel({ photos, onPhotoPress }: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const [backgroundColor] = useThemeColor(["background"]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    setActiveIndex(Math.round(x / SCREEN_WIDTH));
  };

  if (!photos || photos.length === 0) {
    return (
      <View
        style={{ height: IMAGE_HEIGHT, position: "relative" }}
        className="bg-surface items-center justify-center"
      >
        <Text
          className="text-muted"
          style={{ fontFamily: "Inter_400Regular", fontSize: 14 }}
        >
          Aucune photo
        </Text>
        {/* Still bleed into content */}
        <LinearGradient
          colors={["transparent", backgroundColor]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 80
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ position: "relative" }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{ height: IMAGE_HEIGHT }}
      >
        {photos.map((photo, index) => (
          <Pressable key={index} onPress={() => onPhotoPress?.(index)}>
            <Image
              source={{ uri: photo }}
              style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}
              resizeMode="cover"
            />
          </Pressable>
        ))}
      </ScrollView>

      {/* Gradient bleed into page background */}
      {/* <LinearGradient
        colors={["transparent", backgroundColor]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 88
        }}
      /> */}

      {/* Photo counter — top right */}
      {photos.length > 1 && (
        <View
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            backgroundColor: "rgba(0,0,0,0.55)",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 99
          }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.95)",
              fontSize: 12,
              fontFamily: "Inter_500Medium"
            }}
          >
            {activeIndex + 1}/{photos.length}
          </Text>
        </View>
      )}

      {/* Pill dots — overlaid inside image at bottom */}
      {photos.length > 1 && (
        <View
          style={{
            position: "absolute",
            bottom: 18,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "center",
            gap: 5,
            alignItems: "center"
          }}
        >
          {photos.map((_, index) => (
            <View
              key={index}
              style={{
                height: 5,
                width: index === activeIndex ? 20 : 5,
                borderRadius: 99,
                backgroundColor:
                  index === activeIndex
                    ? "rgba(255,255,255,0.95)"
                    : "rgba(255,255,255,0.38)"
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
