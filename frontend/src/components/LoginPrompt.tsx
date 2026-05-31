import { OAUTH_PROVIDERS } from "@/config/providers.config";
import { useAuth } from "@/hooks/useAuth";
import { AntDesign } from "@expo/vector-icons";
import { Divider, useThemeColor } from "heroui-native";
import { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "./screenContainer";

const PROVIDER_ICONS: Record<string, ReactNode> = {
  google: <AntDesign name="google" size={20} color="#EA4335" />
};


interface LoginPromptProps {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}

export function LoginPrompt({
  icon,
  title,
  description,
  children
}: LoginPromptProps) {
  const { login } = useAuth();
  const [borderColor, surfaceColor, foregroundColor, mutedColor] =
    useThemeColor(["border", "surface", "foreground", "muted"]);

  const providers = Object.values(OAUTH_PROVIDERS);

  return (
    <ScreenContainer withSchrollView>
      <View className="flex-1 justify-center py-12">
        <View className="items-center mb-6">
          <View className="mb-8">{icon}</View>
          <Text className="text-2xl font-bold text-foreground mb-4 text-center">
            {title}
          </Text>
          <Text className="text-base text-muted text-center max-w-[320px] leading-6">
            {description}
          </Text>
        </View>

        <Divider className="mb-6" />

        {children && <View className="mb-8">{children}</View>}

        <View className="gap-3">
          {providers.map((provider) => (
            <TouchableOpacity
              key={provider.id}
              activeOpacity={0.8}
              onPress={() => login(provider.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderRadius: 12,
                borderWidth: 1,
                borderColor,
                backgroundColor: surfaceColor
              }}
            >
              {PROVIDER_ICONS[provider.id]}
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: "Inter_600SemiBold",
                  color: foregroundColor
                }}
              >
                Continuer avec {provider.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text
          style={{
            fontSize: 12,
            color: mutedColor,
            textAlign: "center",
            marginTop: 16,
            paddingHorizontal: 24,
            lineHeight: 18
          }}
        >
          En continuant, vous acceptez nos{" "}
          <Text style={{ color: "#0ea5e9", fontFamily: "Inter_500Medium" }}>
            Conditions d&apos;utilisation
          </Text>{" "}
          et notre{" "}
          <Text style={{ color: "#0ea5e9", fontFamily: "Inter_500Medium" }}>
            Politique de confidentialit&eacute;
          </Text>
        </Text>
      </View>
    </ScreenContainer>
  );
}
