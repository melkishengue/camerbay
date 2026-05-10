import { AxiosError } from "axios";
import * as AuthSession from "expo-auth-session";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { useToast } from "heroui-native";
import { jwtDecode } from "jwt-decode";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";
import { authConfig } from "../config/auth.config";
import { apiClient } from "../lib/axios-api-client";

export interface BackendUserUpdate {
  name?: string;
  photoImageUrl?: string;
  businessName?: string;
  description?: string;
  photos?: string[];
  phone?: string;
}

// Complete auth session for iOS
WebBrowser.maybeCompleteAuthSession();

export interface UserInfo {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  "urn:zitadel:iam:org:project:roles"?: Record<string, Record<string, string>>;
}

export interface BackendUser {
  id: string;
  username: string;
  businessName?: string;
  role: string;
  phone: string;
  email: string;
  onBoardingCompleted: boolean;
  isProvider?: boolean;
  profilePhotoUrl?: string;
  photos: string[];
  createdAt?: string;
  description?: string;
}

interface TokenResult {
  accessToken: string;
  refreshToken?: string;
  idToken: string;
  tokenType: string;
  expiresIn?: string;
  issuedAt?: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | undefined;
  oidcUser: UserInfo | null;
  user: BackendUser | null;
  loading: boolean;
  error: Error | null;
  updateUser: (user: BackendUserUpdate) => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<TokenResult | null>(null);
  const [oidcUser, setOidcUser] = useState<UserInfo | null>(null);
  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Create the discovery configuration from your authConfig
  const discovery = AuthSession.useAutoDiscovery(authConfig.issuer as string);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: authConfig.clientId,
      scopes: authConfig.scopes,
      prompt: AuthSession.Prompt.Login,
      redirectUri: authConfig.redirectUrl,
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
      extraParams: {
        ui_locales: "fr"
      }
    },
    discovery
  );

  const syncAndFetchUser = async (
    idToken: string,
    accessToken: string
  ): Promise<BackendUser> => {
    try {
      // 1. Sync with backend
      await apiClient.postWithToken(
        "/api/v1/users/sync",
        { idToken },
        accessToken
      );

      // 2. Fetch full user details
      const userResponse = await apiClient.get<BackendUser>("/api/v1/users/me");

      setUser(userResponse.data);
      return userResponse.data;
    } catch (e) {
      throw e;
    }
  };

  useEffect(() => {
    apiClient.setSessionExpiredHandler(() => {
      // Clear state immediately
      setTokens(null);
      setOidcUser(null);
      setUser(null);
      setError(new Error("Session expired. Please login again."));
    });
  }, []);

  useEffect(() => {
    const handleResponse = async () => {
      console.log("😦", response);
      if (response?.type === "success" && discovery) {
        try {
          setLoading(true);
          const { code } = response.params;

          console.log("👁", code);

          // Exchange code for tokens
          const tokenResult = await AuthSession.exchangeCodeAsync(
            {
              clientId: authConfig.clientId,
              code,
              redirectUri: authConfig.redirectUrl,
              extraParams: request?.codeVerifier
                ? { code_verifier: request.codeVerifier }
                : {}
            },
            discovery
          );
          console.log("🧣", tokenResult);

          const tokens: TokenResult = {
            accessToken: tokenResult.accessToken,
            refreshToken: tokenResult.refreshToken,
            idToken: tokenResult.idToken || "",
            tokenType: tokenResult.tokenType || "Bearer",
            expiresIn: tokenResult.expiresIn?.toString(),
            issuedAt: tokenResult.issuedAt
          };

          // Decode user info from ID token
          const decodedUser: UserInfo = jwtDecode(tokens.idToken);
          setOidcUser(decodedUser);
          setTokens(tokens);

          console.log("🕵️‍♂️", decodedUser);

          // Save tokens securely
          await SecureStore.setItemAsync("auth_tokens", JSON.stringify(tokens));

          // Sync with backend and fetch full user
          const backendUser = await syncAndFetchUser(
            tokens.idToken,
            tokens.accessToken
          );

          toast.show({
            duration: 5000,
            variant: "default",
            label: "Bienvenue",
            description: `Bienvenue sur Camerbay, ${backendUser.username}`,
            actionLabel: "Fermer",
            onActionPress: ({ hide }) => hide()
          });
        } catch (err) {
          setError(
            err instanceof Error ? err : new Error("Authentication failed")
          );
          setTokens(null);
          setOidcUser(null);
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else if (response?.type === "error") {
        setError(new Error(response.error?.message || "Authentication failed"));
        setLoading(false);
      } else if (response?.type === "cancel" || response?.type === "dismiss") {
        setLoading(false);
      }
    };

    handleResponse();
  }, [response, discovery]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoading(true);
        const savedTokensString = await SecureStore.getItemAsync("auth_tokens");

        if (savedTokensString) {
          const savedTokens: TokenResult = JSON.parse(savedTokensString);
          const decodedUser: UserInfo = jwtDecode(savedTokens.idToken);

          setTokens(savedTokens);
          setOidcUser(decodedUser);

          // Fetch full user from backend
          try {
            const userResponse =
              await apiClient.get<BackendUser>("/api/v1/users/me");
            setUser(userResponse.data);
          } catch (err) {
            const shouldLogout =
              err instanceof AxiosError && err.status === 404;

            if (shouldLogout) {
              await logout(true);
              return;
            }

            setError(
              err instanceof Error ? err : new Error("Failed to load user")
            );
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Bootstrap failed"));
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Trigger the OAuth flow
      await promptAsync({
        createTask: false,
        showInRecents: true
      });
    } catch (error) {
      setError(error instanceof Error ? error : new Error("Login failed"));
      setTokens(null);
      setOidcUser(null);
      setUser(null);
      setLoading(false);
    }
  }, [promptAsync]);

  const logout = useCallback(
    async (showMessage = false) => {
      try {
        setLoading(true);
        setError(null);

        if (tokens?.accessToken && discovery?.revocationEndpoint) {
          try {
            await AuthSession.revokeAsync(
              {
                clientId: authConfig.clientId,
                token: tokens.accessToken
              },
              discovery
            );
          } catch (revokeError: any) {
            // Ignore JSON parse errors - empty response is expected and means success
            if (
              revokeError?.message?.includes("JSON Parse error") ||
              revokeError?.message?.includes("Unexpected end of input")
            ) {
            } else {
            }
            // Continue with logout even if revocation fails
          }
        }

        // Unregister push token
        try {
          const pushToken = await SecureStore.getItemAsync("expo_push_token");
          if (pushToken) {
            await apiClient.delete("/api/v1/users/me/push-token");
            await SecureStore.deleteItemAsync("expo_push_token");
          }
          await Notifications.setBadgeCountAsync(0);
        } catch {
          // Continue logout even if push token cleanup fails
        }

        // Clear all state immediately
        setTokens(null);
        setOidcUser(null);
        setUser(null);

        // Clear secure store
        await SecureStore.deleteItemAsync("auth_tokens");

        if (showMessage) {
          toast.show({
            duration: 5000,
            variant: "success",
            label: "Oops",
            description: "Vous avez été deconnecté. Connectez-vous à nouveau.",
            actionLabel: "Close",
            onActionPress: ({ hide }) => hide()
          });
        }
      } catch (error) {
        setError(error instanceof Error ? error : new Error("Logout failed"));
      } finally {
        setLoading(false);
      }
    },
    [tokens, discovery]
  );

  const refetchUser = useCallback(async () => {
    if (!tokens?.accessToken) {
      console.warn("Cannot refetch user: no access token");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // API client handles token refresh automatically
      const response = await apiClient.get<BackendUser>("/api/v1/users/me");
      setUser(response.data);
    } catch (err) {
      // Check if it's a session expired error
      if (err instanceof Error && err.message.includes("Session expired")) {
        await logout();
        return;
      }

      setError(
        err instanceof Error ? err : new Error("Failed to refetch user")
      );
    } finally {
      setLoading(false);
    }
  }, [tokens?.accessToken, logout]);

  const updateUser = async (update: BackendUserUpdate) => {
    const response = await apiClient.put<BackendUser>(`/api/v1/users/me`, {
      ...update
    });

    setUser(response.data);
  };

  const value: AuthContextType = {
    isAuthenticated: !!tokens?.accessToken,
    accessToken: tokens?.accessToken,
    oidcUser,
    user,
    loading,
    error,
    login,
    logout,
    refetchUser,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
