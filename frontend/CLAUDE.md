# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Camerbay — a React Native marketplace app built with Expo 54 (SDK 54, New Architecture enabled) and HeroUI Native UI library. The app connects service providers with clients, featuring offer search/creation, chat (Stream Chat), user accounts, and onboarding.

## Development Commands

- `npm start` / `expo start -c` — Start Expo dev server (clears cache)
- `npm run ios` — Start on iOS simulator
- `npm run android` — Start on Android emulator
- `npm run lint` — Run ESLint (flat config via `expo lint`)
- `npm run reset-project` — Move current `src/` to `app-example-src/` and create fresh scaffold

No test framework is currently configured.

## Architecture

### Routing & Navigation
File-based routing via **Expo Router** (`src/app/`). The `@/*` path alias maps to `./src/*`.

- `src/app/_layout.tsx` — Root layout: loads Inter fonts, wraps app in `GestureHandlerRootView > AppThemeProvider > HeroUINativeProvider > BottomSheetModalProvider > ToastProvider > AuthProvider > ChatProvider`
- `src/app/(tabs)/` — Tab navigator with three tabs: Offers (search), Chat, Account

### Styling
Uses **Uniwind** (NativeWind alternative) with Tailwind CSS v4. Metro config applies `withUniwindConfig`. Styles flow:
- `global.css` — imports tailwindcss, uniwind, heroui-native/styles, and custom themes
- `themes/` — Custom color themes (lavender, mint, sky, alpha) in light/dark variants
- Theme switching via `src/contexts/app-theme-context.tsx` using `Uniwind.setTheme()`, persisted in SecureStore

### Authentication
OIDC via **Zitadel** using `expo-auth-session` with PKCE flow. Key files:
- `src/config/auth.config.ts` — OAuth config (issuer, clientId, scopes)
- `src/hooks/useAuth.tsx` — `AuthProvider` context: login, logout, token exchange, user sync with backend
- `src/lib/axios-api-client.ts` — Singleton `apiClient` with automatic token refresh, request queuing during refresh, and `skipAuth`/public method variants

### Backend Integration
- REST API via Axios (`apiClient`) — base URL from `EXPO_PUBLIC_API_URL` (default `localhost:8082`)
- **Supabase** for file storage (`src/lib/supabase.ts`) — bucket `camerbay-b-one`
- **Stream Chat** for messaging (`src/hooks/useChat.tsx`)

### Environment Variables (EXPO_PUBLIC_*)
- `EXPO_PUBLIC_API_URL` — Backend API base URL
- `EXPO_PUBLIC_OAUTH_ISSUER` — Zitadel domain
- `EXPO_PUBLIC_OAUTH_CLIENT_ID` — OAuth client ID
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- Stream Chat credentials (see `useChat.tsx`)

### Key Patterns
- Context providers for global state (auth, chat, theme) — all nested in root layout
- Custom hooks in `src/hooks/` encapsulate domain logic (offers, categories, onboarding, city search, etc.)
- UI components in `src/components/` built on HeroUI Native primitives
- `react-hook-form` for form handling
- `@gorhom/bottom-sheet` for bottom sheets
- `lucide-react-native` for icons
- App language is French (UI strings, toast messages)
