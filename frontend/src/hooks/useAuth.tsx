import { Sentry } from "@/lib/sentry";
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
import { OAUTH_PROVIDERS } from "../config/providers.config";
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
  picture?: string;
  preferred_username?: string;
}

export interface BackendUser {
  id: string;
  username: string;
  name?: string;
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

/**
 * App tokens — issued by the backend after validating the provider token.
 * accessToken: backend-issued JWT used as Bearer for all API calls.
 * idToken:     provider idToken (OIDC providers only, e.g. Google/Apple).
 *              Stored to populate oidcUser; absent for OAuth-only providers (e.g. GitHub).
 */
interface TokenResult {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  tokenType: string;
  expiresIn?: string;
  issuedAt?: number;
  provider: string;
}

interface AppLoginResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | undefined;
  oidcUser: UserInfo | null;
  user: BackendUser | null;
  loading: boolean;
  error: Error | null;
  updateUser: (user: BackendUserUpdate) => Promise<void>;
  login: (providerId: string) => Promise<void>;
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

  useEffect(() => {
    apiClient.setSessionExpiredHandler(() => {
      setTokens(null);
      setOidcUser(null);
      setUser(null);
      setError(new Error("Session expired. Please login again."));
    });
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoading(true);
        const savedTokensString = await SecureStore.getItemAsync("auth_tokens");

        if (savedTokensString) {
          const savedTokens: TokenResult = JSON.parse(savedTokensString);

          setTokens(savedTokens);

          // Populate oidcUser from provider idToken if present (OIDC providers only)
          if (savedTokens.idToken) {
            try {
              setOidcUser(jwtDecode<UserInfo>(savedTokens.idToken));
            } catch {
              // Non-OIDC provider or malformed token — oidcUser stays null
            }
          }

          try {
            const userResponse =
              await apiClient.get<BackendUser>("/api/v1/users/me");
            setUser(userResponse.data);
          } catch (err) {
            if (err instanceof AxiosError && err.status === 404) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (providerId: string) => {
      const provider = OAUTH_PROVIDERS[providerId];
      if (!provider) {
        setError(new Error(`Unknown provider: ${providerId}`));
        return;
      }

      Sentry.addBreadcrumb({
        category: "auth",
        message: `Login initiated with provider: ${providerId}`,
        level: "info"
      });

      try {
        setLoading(true);
        setError(null);

        // ── Step 1: OAuth with the external provider ──────────────────────────
        const discovery = await AuthSession.fetchDiscoveryAsync(
          provider.discoveryUrl
        );
        const clientId = provider.getClientId();
        const redirectUri = provider.getRedirectUri();

        const request = new AuthSession.AuthRequest({
          clientId,
          scopes: provider.scopes,
          redirectUri,
          usePKCE: true,
          responseType: AuthSession.ResponseType.Code,
          extraParams: provider.extraParams
        });

        const result = await request.promptAsync(discovery, {
          createTask: false,
          showInRecents: true
        });

        if (result.type === "error") {
          const errMsg = result.error?.message || "Authentication failed";
          Sentry.captureException(new Error(errMsg), {
            tags: { auth_step: "oauth_response" },
            extra: { oauth_error: result.error }
          });
          setError(new Error(errMsg));
          return;
        }

        if (result.type === "cancel" || result.type === "dismiss") {
          Sentry.addBreadcrumb({
            category: "auth",
            message: `OAuth flow ${result.type} by user`,
            level: "info"
          });
          return;
        }

        if (result.type !== "success") return;

        // ── Step 2: Exchange auth code for provider tokens ────────────────────
        Sentry.addBreadcrumb({
          category: "auth",
          message: "Exchanging authorization code for provider tokens",
          level: "info"
        });

        const providerTokens = await AuthSession.exchangeCodeAsync(
          {
            clientId,
            code: result.params.code,
            redirectUri,
            extraParams: request.codeVerifier
              ? { code_verifier: request.codeVerifier }
              : {}
          },
          discovery
        );

        // ── Step 3: Exchange provider tokens for backend app tokens ───────────
        // Backend validates the provider token (Google → JWKS, GitHub → API call,
        // etc.), syncs/creates the user, and issues its own JWT + refresh token.
        Sentry.addBreadcrumb({
          category: "auth",
          message: "Exchanging provider tokens with backend",
          level: "info"
        });

        const appLoginResponse = await apiClient.postPublic<AppLoginResponse>(
          "/api/v1/auth/login",
          {
            provider: providerId,
            idToken: providerTokens.idToken,       // OIDC providers (Google, Apple)
            accessToken: providerTokens.accessToken // all providers (GitHub uses this)
          }
        );

        const appTokens: TokenResult = {
          accessToken: appLoginResponse.data.accessToken,
          refreshToken: appLoginResponse.data.refreshToken,
          idToken: providerTokens.idToken ?? undefined, // kept for oidcUser only
          tokenType: "Bearer",
          expiresIn: appLoginResponse.data.expiresIn?.toString(),
          issuedAt: Math.floor(Date.now() / 1000),
          provider: providerId
        };

        // Decode oidcUser from provider idToken (OIDC providers only)
        if (providerTokens.idToken) {
          try {
            setOidcUser(jwtDecode<UserInfo>(providerTokens.idToken));
          } catch {
            // Non-OIDC provider — oidcUser stays null
          }
        }

        await SecureStore.setItemAsync("auth_tokens", JSON.stringify(appTokens));

        // ── Step 4: Fetch the backend user ────────────────────────────────────
        // Backend synced/created the user during /auth/login, so /users/me is ready.
        const userResponse = await apiClient.get<BackendUser>(
          "/api/v1/users/me"
        );
        setUser(userResponse.data);
        Sentry.setUser({
          id: userResponse.data.id,
          email: userResponse.data.email,
          username: userResponse.data.username
        });

        // Set tokens only after user fetch — prevents isAuthenticated flipping true
        // early and firing concurrent notification queries mid-login.
        setTokens(appTokens);

        toast.show({
          duration: 5000,
          variant: "default",
          label: "Bienvenue",
          description: `Bienvenue sur Camerbay, ${userResponse.data.username}`,
          actionLabel: "Fermer",
          onActionPress: ({ hide }) => hide()
        });
      } catch (err) {
        Sentry.captureException(err, {
          tags: { auth_step: "login" },
          extra: { providerId }
        });
        setError(err instanceof Error ? err : new Error("Login failed"));
        setTokens(null);
        setOidcUser(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const logout = useCallback(
    async (showMessage = false) => {
      try {
        setLoading(true);
        setError(null);

        // Best-effort backend logout (invalidates refresh token server-side)
        try {
          await apiClient.postPublic("/api/v1/auth/logout", {
            refreshToken: tokens?.refreshToken
          });
        } catch {
          // Continue logout even if backend call fails
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

        setTokens(null);
        setOidcUser(null);
        setUser(null);
        Sentry.setUser(null);

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
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Logout failed"));
      } finally {
        setLoading(false);
      }
    },
    [tokens, toast]
  );

  const refetchUser = useCallback(async () => {
    if (!tokens?.accessToken) {
      console.warn("Cannot refetch user: no access token");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<BackendUser>("/api/v1/users/me");
      setUser(response.data);
    } catch (err) {
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
