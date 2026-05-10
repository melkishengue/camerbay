# Plan: Fix Android OAuth Redirect Launching a New App Instance

## Problem

After a successful Zitadel login on Android, the browser redirect opens a **new instance** of the Camerbay dev client instead of returning to the existing one. The original app instance (which started the OAuth flow and holds the `AuthSession` listener) never receives the callback. The result is that login appears to silently fail — the new instance starts fresh with no auth state.

## Root Cause Analysis

### 1. Android has no native AuthSession — it uses a polyfill

On Android, `expo-web-browser`'s `_authSessionIsNativelySupported()` explicitly returns `false`. The entire flow uses a polyfill that:

1. Opens Chrome Custom Tabs via `openBrowserAsync`
2. Races between `AppState` becoming `'active'` (browser closed) and a `Linking.addEventListener('url')` event matching the redirect URL

The `Linking` listener only exists in the **original** app instance. If the redirect launches a **new** instance, the listener never fires. The original instance eventually sees `AppState` change to `'active'` and resolves as `{ type: 'dismiss' }`.

### 2. `createTask: true` (the default) is the primary cause

By default, `promptAsync()` opens Chrome Custom Tabs with `FLAG_ACTIVITY_NEW_TASK`, putting the browser in a **separate Android task stack**. When Zitadel redirects back to `camerbay://oauth/callback`, Android resolves this as a new intent. Because the browser is in a different task, Android launches a **new Activity** for the app instead of bringing the existing one to the foreground.

This is the classic Android `singleTask` / `FLAG_ACTIVITY_NEW_TASK` problem:
- App Activity A starts → opens browser in Task B via `FLAG_ACTIVITY_NEW_TASK`
- Browser in Task B redirects to `camerbay://...`
- Android creates a **new** Activity A' in Task B (or a new Task C) instead of resuming Task A's Activity A
- The original Activity A (with the `Linking` listener) is orphaned

### 3. The Activity `launchMode` may not be set to `singleTask`

For the redirect to return to the existing instance, the main Activity needs `android:launchMode="singleTask"` in `AndroidManifest.xml`. Without it, Android defaults to `standard` launch mode, which creates a new Activity instance for every incoming intent. Expo's default prebuild may not set this.

### 4. `maybeCompleteAuthSession()` does nothing on mobile

The call `WebBrowser.maybeCompleteAuthSession()` at line 29 of `useAuth.tsx` has zero effect on Android or iOS. It only works for web popup windows. The comment `// Complete auth session for iOS` is misleading.

---

## Fixes (in order of priority)

### Fix 1 (Primary): Set `createTask: false` in `promptAsync()`

This is the **most important fix** and resolves the issue in most cases.

In `src/hooks/useAuth.tsx`, line 262, change:

```ts
// Before
promptAsync({
  // createTask: false  <-- currently commented out
});

// After
promptAsync({
  createTask: false
});
```

**Why this works:** With `createTask: false`, Chrome Custom Tabs opens in the **same** Android task stack as the app. When the redirect fires, Android brings the existing task (and its Activity) back to the foreground. The `Linking` event fires in the original instance, and `AuthSession` receives the callback correctly.

This is the most widely recommended fix in Expo GitHub issues (#18270, #22572, #23781).

### Fix 2: Set `singleTask` launch mode via `expo-build-properties`

If Fix 1 alone is not enough, ensure the main Activity uses `singleTask` launch mode so that incoming intents always route to the existing instance instead of creating a new one.

In `app.json`, update the `expo-build-properties` plugin:

```json
[
  "expo-build-properties",
  {
    "android": {
      "newArchEnabled": true,
      "compileSdkVersion": 36,
      "targetSdkVersion": 36,
      "minSdkVersion": 24,
      "buildToolsVersion": "35.0.0",
      "mainActivity": {
        "launchMode": "singleTask"
      }
    }
  }
]
```

If `expo-build-properties` does not support `mainActivity.launchMode`, you'll need to manually edit `android/app/src/main/AndroidManifest.xml` after prebuild:

```xml
<activity
  android:name=".MainActivity"
  android:launchMode="singleTask"
  ...
```

With `singleTask`, Android reuses the existing Activity and delivers the redirect URI via `onNewIntent()` instead of creating a new Activity.

### Fix 3: Remove `autoVerify` from intent filters

The current intent filter has `"autoVerify": true`, which is meant for Android App Links (`https://` URLs with a `/.well-known/assetlinks.json` file on the server). For custom URI schemes, `autoVerify` is irrelevant and can cause unexpected verification failures that interfere with intent resolution.

In `app.json`, change:

```json
// Before
"intentFilters": [
  {
    "action": "VIEW",
    "autoVerify": true,
    "data": [{ "scheme": "camerbay" }],
    "category": ["BROWSABLE", "DEFAULT"]
  }
]

// After
"intentFilters": [
  {
    "action": "VIEW",
    "data": [{ "scheme": "camerbay" }],
    "category": ["BROWSABLE", "DEFAULT"]
  }
]
```

### Fix 4 (Optional): Use a simpler scheme

Schemes with dots matching the package name can cause intent resolution ambiguity. Consider switching to a short distinctive scheme. **Only do this if Fixes 1-3 don't fully resolve the issue.**

**app.json** — change the top-level scheme:
```json
{
  "expo": {
    "scheme": "camerbay"
  }
}
```

Update `ios.infoPlist.CFBundleURLTypes` and `android.intentFilters` to match:
```json
"CFBundleURLTypes": [{ "CFBundleURLSchemes": ["camerbay"] }]
```
```json
"intentFilters": [{
  "action": "VIEW",
  "data": [{ "scheme": "camerbay" }],
  "category": ["BROWSABLE", "DEFAULT"]
}]
```

**src/config/auth.config.ts**:
```ts
redirectUrl: "camerbay://oauth/callback",
```

**src/hooks/useAuth.tsx** — update both `makeRedirectUri` calls (lines 93-95 and 150-152):
```ts
redirectUri: AuthSession.makeRedirectUri({
  scheme: "camerbay",
  native: "camerbay://oauth/callback"
})
```

**Zitadel console** — add `camerbay://oauth/callback` as an allowed redirect URI.

### Fix 5: Rebuild the native app

After any of the above changes, you **must** rebuild the native Android app because scheme and manifest changes are baked into `AndroidManifest.xml` at build time:

```bash
npx expo prebuild --clean
npx expo run:android
```

Or via EAS:
```bash
eas build --profile development --platform android
```

---

## Summary of changes

| File | Change | Priority |
|------|--------|----------|
| `src/hooks/useAuth.tsx` line 262 | Add `createTask: false` to `promptAsync()` | **Must do** |
| `app.json` → `android.intentFilters` | Remove `autoVerify: true` | Recommended |
| `AndroidManifest.xml` (post-prebuild) | Set `android:launchMode="singleTask"` on MainActivity | If Fix 1 alone isn't enough |
| `app.json` → `expo.scheme` | Change to `"camerbay"` (optional) | Only if still broken |
| `src/config/auth.config.ts` | Update `redirectUrl` (if scheme changed) | Only if scheme changed |
| `src/hooks/useAuth.tsx` lines 93-95, 150-152 | Update `makeRedirectUri` (if scheme changed) | Only if scheme changed |
| Zitadel console | Add new redirect URI (if scheme changed) | Only if scheme changed |
| Native build | Rebuild after changes (`npx expo prebuild --clean`) | **Must do** |

## Quick test

1. Add `createTask: false` to `promptAsync()` — this is a JS-only change, no rebuild needed
2. Test the login flow on Android
3. If it works, you're done. If not, proceed with Fix 2 (singleTask) and rebuild.

---

## Why this happens specifically on Android and not iOS

On iOS, `expo-web-browser` uses `ASWebAuthenticationSession`, which is a native API that handles the full redirect lifecycle within the same process. The browser is presented as a modal, and the redirect automatically returns to the presenting app. There is no task stack or Activity lifecycle to worry about.

On Android, there is no equivalent native API, so the polyfill relies on Chrome Custom Tabs + deep linking — which is subject to all of Android's Activity and Task management rules.

---

## References

- [expo/expo#18270](https://github.com/expo/expo/issues/18270) — Auth session Google login dev build Android issue
- [expo/expo#22572](https://github.com/expo/expo/issues/22572) — Sign in with Google not redirecting back to Android
- [expo/expo#23781](https://github.com/expo/expo/issues/23781) — expo-auth-session returns dismiss result on redirect, Android only
- [expo/expo#12462](https://github.com/expo/expo/pull/12462) — Add option to not open browser in new task
- [Expo AuthSession docs](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Expo Deep Linking docs](https://docs.expo.dev/linking/into-your-app/)
- [Android Tasks and Back Stack](https://developer.android.com/guide/components/activities/tasks-and-back-stack)
