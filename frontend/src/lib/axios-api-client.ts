import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig
} from "axios";
import * as AxiosLogger from "axios-logger";
import * as SecureStore from "expo-secure-store";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8082";

interface TokenResult {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  tokenType: string;
  expiresIn?: string;
  issuedAt?: number;
  provider?: string;
}

interface AppRefreshResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
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

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json"
      }
    });

    this.setupInterceptors();
  }

  setSessionExpiredHandler(handler: () => void) {
    this.onSessionExpired = handler;
  }

  private async getStoredTokens(): Promise<TokenResult | null> {
    try {
      const tokensString = await SecureStore.getItemAsync("auth_tokens");
      return tokensString ? JSON.parse(tokensString) : null;
    } catch {
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
    return expirationTime - Date.now() < bufferSeconds * 1000;
  }

  /**
   * Refresh the backend-issued app token via the backend refresh endpoint.
   * Uses raw axios (not this.client) to avoid triggering the auth interceptor.
   */
  private async refreshAccessToken(tokens: TokenResult): Promise<TokenResult> {
    try {
      if (!tokens.refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await axios.post<AppRefreshResponse>(
        `${API_BASE_URL}/api/v1/auth/refresh`,
        { refreshToken: tokens.refreshToken }
      );

      const newTokens: TokenResult = {
        ...tokens,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken ?? tokens.refreshToken,
        expiresIn: response.data.expiresIn?.toString(),
        issuedAt: Math.floor(Date.now() / 1000)
      };

      await this.saveTokens(newTokens);
      return newTokens;
    } catch {
      await SecureStore.deleteItemAsync("auth_tokens");
      throw new Error("Session expired. Please login again.");
    }
  }

  private async getValidAccessToken(): Promise<string> {
    const tokens = await this.getStoredTokens();

    if (!tokens) {
      throw new Error("No tokens found. Please login.");
    }

    if (this.isTokenExpired(tokens)) {
      const refreshedTokens = await this.refreshAccessToken(tokens);
      return refreshedTokens.accessToken;
    }

    return tokens.accessToken;
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig & RequestConfig) => {
        if (config.skipAuth) {
          return config;
        }

        try {
          const token = await this.getValidAccessToken();
          config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
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

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
          skipAuth?: boolean;
        };

        if (originalRequest?.skipAuth) {
          return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
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

  // Authenticated methods
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

  // Unauthenticated methods
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

  async postWithToken<T = any>(url: string, data: any, token: string) {
    return this.client.post<T>(url, data, {
      skipAuth: true,
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}

export const apiClient = new ApiClient();
