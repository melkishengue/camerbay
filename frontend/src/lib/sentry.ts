import * as Sentry from "@sentry/react-native";

export function initSentry() {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    debug: __DEV__,
    environment: __DEV__ ? "development" : "production",
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
    enableNative: true,
    attachStacktrace: true
  });
}

export { Sentry };
