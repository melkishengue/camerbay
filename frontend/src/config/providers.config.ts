import * as AuthSession from "expo-auth-session";
import { Platform } from "react-native";

export interface OAuthProviderConfig {
  id: string;
  name: string;
  discoveryUrl: string;
  scopes: string[];
  extraParams?: Record<string, string>;
  /**
   * Returns the OAuth client ID for the current platform.
   */
  getClientId: () => string;
  /**
   * Returns the redirect URI for the current platform.
   * For Google native clients, this must be the reversed client ID scheme.
   */
  getRedirectUri: () => string;
}

/**
 * Google OAuth credentials — create three OAuth 2.0 clients in Google Cloud Console:
 *   - iOS:     type "iOS",     bundle ID = com.camerbay.app
 *   - Android: type "Android", package  = com.camerbay.app + SHA-1 fingerprint
 *   - Web:     type "Web",     authorized redirect URI = exp://localhost:8081 (Expo Go dev)
 *
 * iOS and Android native clients use the reversed client ID as the redirect scheme.
 * This scheme is registered automatically via app.config.js.
 *
 * Required env vars:
 *   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID     e.g. 123456-abc.apps.googleusercontent.com
 *   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID e.g. 789012-xyz.apps.googleusercontent.com
 *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID     e.g. 345678-web.apps.googleusercontent.com (dev/Expo Go)
 */
function makeGoogleConfig(): OAuthProviderConfig {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID as string;
  const androidClientId = process.env
    .EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID as string;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID as string;

  const getClientId = (): string => {
    if (Platform.OS === "ios") return iosClientId;
    if (Platform.OS === "android") return androidClientId;
    return webClientId;
  };

  const getRedirectUri = (): string => {
    if (Platform.OS === "ios" && iosClientId) {
      // Reversed client ID scheme required by Google for native iOS
      const prefix = iosClientId.replace(".apps.googleusercontent.com", "");
      return `com.googleusercontent.apps.${prefix}:/oauth2redirect/google`;
    }
    if (Platform.OS === "android" && androidClientId) {
      const prefix = androidClientId.replace(".apps.googleusercontent.com", "");
      return `com.googleusercontent.apps.${prefix}:/oauth2redirect/google`;
    }
    // Expo Go / web: use standard deep-link URI
    return AuthSession.makeRedirectUri({
      scheme: "com.camerbay.app",
      path: "oauth/callback"
    });
  };

  return {
    id: "google",
    name: "Google",
    discoveryUrl: "https://accounts.google.com",
    scopes: ["openid", "profile", "email"],
    extraParams: {
      access_type: "offline",
      prompt: "consent"
    },
    getClientId,
    getRedirectUri
  };
}

export const OAUTH_PROVIDERS: Record<string, OAuthProviderConfig> = {
  google: makeGoogleConfig()
  // Future providers: apple, facebook, etc.
};
