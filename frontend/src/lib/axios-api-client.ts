import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig
} from "axios";
import * as AxiosLogger from "axios-logger";
import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import { authConfig } from "../config/auth.config";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8082";

interface TokenResult {
  accessToken: string;
  refreshToken?: string;
  idToken: string;
  tokenType: string;
  expiresIn?: string;
  issuedAt?: number;
}

interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

interface RequestConfig {
  skipAuth?: boolean;
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: QueuedRequest[] = [];
  private onSessionExpired?: () => void;
  private discovery: AuthSession.DiscoveryDocument | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json"
      }
    });

    this.setupInterceptors();
    this.initializeDiscovery();
  }

  // Initialize discovery document
  private async initializeDiscovery() {
    try {
      this.discovery = await AuthSession.fetchDiscoveryAsync(authConfig.issuer);
    } catch (error) {

    }
  }

  // Set callback for when session expires
  setSessionExpiredHandler(handler: () => void) {
    this.onSessionExpired = handler;
  }

  private async getStoredTokens(): Promise<TokenResult | null> {
    try {
      const tokensString = await SecureStore.getItemAsync("auth_tokens");

      if (tokensString) {
        return JSON.parse(tokensString);
      }
      return null;
    } catch (error) {

      return null;
    }
  }

  private async saveTokens(tokens: TokenResult): Promise<void> {
    await SecureStore.setItemAsync("auth_tokens", JSON.stringify(tokens));
  }

  private isTokenExpired(tokenData: TokenResult, bufferSeconds = 60): boolean {
    if (!tokenData.issuedAt || !tokenData.expiresIn) {
      return true;
    }

    const expiresInMs = parseInt(tokenData.expiresIn) * 1000;
    const issuedAtMs = tokenData.issuedAt * 1000;
    const expirationTime = issuedAtMs + expiresInMs;
    const currentTime = Date.now();
    const bufferTime = bufferSeconds * 1000;

    // Consider expired if it expires within buffer time
    return expirationTime - currentTime < bufferTime;
  }

  private async refreshAccessToken(tokens: TokenResult): Promise<TokenResult> {
    try {

      if (!tokens.refreshToken) {
        throw new Error("No refresh token available");
      }

      if (!this.discovery) {
        // Try to initialize discovery if not already done
        await this.initializeDiscovery();
        if (!this.discovery) {
          throw new Error("Discovery document not available");
        }
      }

      const tokenResult = await AuthSession.refreshAsync(
        {
          clientId: authConfig.clientId,
          refreshToken: tokens.refreshToken
        },
        this.discovery
      );

      const newTokens: TokenResult = {
        accessToken: tokenResult.accessToken,
        refreshToken: tokenResult.refreshToken || tokens.refreshToken,
        idToken: tokenResult.idToken || tokens.idToken,
        tokenType: tokenResult.tokenType || "Bearer",
        expiresIn: tokenResult.expiresIn?.toString(),
        issuedAt: tokenResult.issuedAt
      };

      await this.saveTokens(newTokens);


      return newTokens;
    } catch (error) {

      await SecureStore.deleteItemAsync("auth_tokens");
      throw new Error("Session expired. Please login again.");
    }
  }

  private async getValidAccessToken(): Promise<string> {
    const tokens = await this.getStoredTokens();

    if (!tokens) {
      throw new Error("No tokens found. Please login.");
    }

    // Proactively refresh if expired or expiring soon
    if (this.isTokenExpired(tokens)) {
      const refreshedTokens = await this.refreshAccessToken(tokens);
      return refreshedTokens.accessToken;
    }

    return tokens.accessToken;
  }

  private setupInterceptors() {
    // Request interceptor - add fresh token only if auth not skipped
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig & RequestConfig) => {
        // Skip authentication if explicitly requested
        if (config.skipAuth) {
          return config;
        }

        try {
          // Proactively get valid token (will refresh if needed)
          const token = await this.getValidAccessToken();
          config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {

          // Trigger session expired handler
          if (this.onSessionExpired) {
            this.onSessionExpired();
          }
          throw error;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      AxiosLogger.responseLogger,
      AxiosLogger.errorLogger
    );

    // Response interceptor - handle 401 errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
          skipAuth?: boolean;
        };

        // Skip token refresh for unauthenticated requests
        if (originalRequest?.skipAuth) {
          return Promise.reject(error);
        }

        // If 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue requests while refreshing
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const tokens = await this.getStoredTokens();

            if (!tokens?.refreshToken) {
              throw new Error("No refresh token available");
            }

            const newTokens = await this.refreshAccessToken(tokens);

            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;

            this.processQueue(null, newTokens.accessToken);

            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);

            if (this.onSessionExpired) {
              this.onSessionExpired();
            }

            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else if (token) {
        promise.resolve(token);
      }
    });

    this.failedQueue = [];
  }

  // Public HTTP methods - authenticated by default
  async get<T = any>(url: string, config = {}) {
    return this.client.get<T>(url, config);
  }

  async post<T = any>(url: string, data?: any, config = {}) {
    return this.client.post<T>(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config = {}) {
    return this.client.put<T>(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config = {}) {
    return this.client.patch<T>(url, data, config);
  }

  async delete<T = any>(url: string, config = {}) {
    return this.client.delete<T>(url, config);
  }

  // Unauthenticated HTTP methods
  async getPublic<T = any>(url: string, config = {}) {
    return this.client.get<T>(url, { ...config, skipAuth: true });
  }

  async postPublic<T = any>(url: string, data?: any, config = {}) {
    return this.client.post<T>(url, data, { ...config, skipAuth: true });
  }

  async putPublic<T = any>(url: string, data?: any, config = {}) {
    return this.client.put<T>(url, data, { ...config, skipAuth: true });
  }

  async patchPublic<T = any>(url: string, data?: any, config = {}) {
    return this.client.patch<T>(url, data, { ...config, skipAuth: true });
  }

  async deletePublic<T = any>(url: string, config = {}) {
    return this.client.delete<T>(url, { ...config, skipAuth: true });
  }

  // Special method for passing an explicit token, bypassing the auth interceptor
  async postWithToken<T = any>(url: string, data: any, token: string) {
    return this.client.post<T>(url, data, {
      skipAuth: true,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}

export const apiClient = new ApiClient();
