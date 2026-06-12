import { LoginPrompt } from "@/components/LoginPrompt";
import { useAuth } from "@/hooks/useAuth";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LogIn } from "lucide-react-native";
import { useEffect } from "react";

export default function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { title, description } = useLocalSearchParams<{
    title?: string;
    description?: string;
  }>();

  useEffect(() => {
    if (isAuthenticated) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [isAuthenticated, router]);

  return (
    <LoginPrompt
      icon={<LogIn size={50} color="#0ea5e9" strokeWidth={1.5} />}
      title={title ?? "Connexion"}
      description={
        description ??
        "Connectez-vous pour accéder à toutes les fonctionnalités de Camerbay."
      }
    />
  );
}
