import { AlertTriangle, RefreshCw } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          gap: 16
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: "#fef2f2",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <AlertTriangle size={28} color="#ef4444" strokeWidth={1.75} />
        </View>

        <Text
          style={{
            fontSize: 20,
            fontFamily: "Inter_700Bold",
            color: "#111827",
            textAlign: "center"
          }}
        >
          Une erreur est survenue
        </Text>

        <Text
          style={{
            fontSize: 14,
            fontFamily: "Inter_400Regular",
            color: "#6b7280",
            textAlign: "center",
            lineHeight: 22
          }}
        >
          L&apos;application a rencontré un problème inattendu. L&apos;erreur a
          été signalée automatiquement.
        </Text>

        {__DEV__ && error?.message ? (
          <View
            style={{
              backgroundColor: "#fef2f2",
              borderRadius: 8,
              padding: 12,
              width: "100%"
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Inter_400Regular",
                color: "#dc2626"
              }}
            >
              {error.message}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={resetError}
          activeOpacity={0.8}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#111827",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            marginTop: 8
          }}
        >
          <RefreshCw size={16} color="#fff" strokeWidth={2} />
          <Text
            style={{
              fontSize: 15,
              fontFamily: "Inter_600SemiBold",
              color: "#fff"
            }}
          >
            Réessayer
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
