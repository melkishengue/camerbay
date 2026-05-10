import { useAuth } from "@/hooks/useAuth";
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { useThemeColor } from "heroui-native";
import { Camera } from "lucide-react-native";
import { ActivityIndicator, Image, Pressable, View } from "react-native";

const SIZE = 88;

const DEFAULT_AVATAR =
  "https://img.icons8.com/external-bearicons-glyph-bearicons/64/1A1A1A/external-user-full-body-woman-avatar-bearicons-glyph-bearicons.png";

export const ProfilePic = ({
  profilePhotoUrl,
  canUpload
}: {
  profilePhotoUrl?: string;
  canUpload?: boolean;
}) => {
  const { pickAndUpload, uploading, deleteImage, extractPathFromUrl } =
    useSupabaseStorage();
  const { updateUser } = useAuth();
  const [accentColor, accentForeground] = useThemeColor([
    "accent",
    "accent-foreground"
  ]);

  const handlePress = async () => {
    const uploadResult = await pickAndUpload();
    const oldImagePath = extractPathFromUrl(profilePhotoUrl || "");
    deleteImage(oldImagePath);
    await updateUser({ photoImageUrl: uploadResult?.url });
  };

  return (
    <View style={{ position: "relative", alignSelf: "center" }}>
      {/* Avatar */}
      <View
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          overflow: "hidden",
          borderWidth: 2.5,
          borderColor: accentColor + "28"
        }}
      >
        <Image
          source={{ uri: profilePhotoUrl || DEFAULT_AVATAR }}
          style={{ width: SIZE, height: SIZE }}
          resizeMode="cover"
        />
      </View>

      {/* Upload overlay */}
      {uploading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            backgroundColor: "rgba(0,0,0,0.52)",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <ActivityIndicator color="white" size="small" />
        </View>
      )}

      {/* Camera button */}
      {canUpload && (
        <Pressable
          onPress={handlePress}
          disabled={uploading}
          style={({ pressed }) => ({
            position: "absolute",
            bottom: 2,
            right: 2,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: accentColor,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.78 : 1,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.28,
            shadowRadius: 3,
            elevation: 4
          })}
        >
          <Camera size={14} color={accentForeground} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
};
