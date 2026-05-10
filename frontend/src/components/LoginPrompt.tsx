import { useAuth } from "@/hooks/useAuth";
import { Button, Divider, useThemeColor } from "heroui-native";
import { LogIn } from "lucide-react-native";
import { ReactNode } from "react";
import { Text, View } from "react-native";
import ScreenContainer from "./screenContainer";

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
  const [themeColorAccentForeground] = useThemeColor(["accent-foreground"]);

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

        <View className="gap-4">
          <Button variant="primary" onPress={login}>
            <LogIn size={22} color={themeColorAccentForeground} />
            <Button.Label className="font-semibold ml-2">
              Se connecter
            </Button.Label>
          </Button>

          <Text className="text-xs text-muted text-center px-6 leading-5">
            En continuant, vous acceptez nos{" "}
            <Text className="text-primary font-medium">
              Conditions d&apos;utilisation
            </Text>{" "}
            et notre{" "}
            <Text className="text-primary font-medium">
              Politique de confidentialit&eacute;
            </Text>
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
