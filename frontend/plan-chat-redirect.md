# Plan: Missing Back Button After "Contact Provider" Chat Redirect

## Problem

When a user views an offer detail page and taps "Contact provider", they are redirected to the chat screen with that provider. Once on the chat screen, there is no back button — the user cannot return to the offer detail page or to the inbox list.

## Root Cause

The app uses a **tab-based** Expo Router layout with three tabs: `offers`, `chat`, and `account`. Each tab has its own isolated `Stack` navigator (wrapped in `RootTabLayout`).

### Navigation flow

```
Offers Tab (Stack)             Chat Tab (Stack)
├── offers/index               ├── chat/index
└── offers/[id]  ──push──►     └── chat/[channelId]
     USER IS HERE                    USER LANDS HERE
```

In `useChannelById.tsx:93-96`, the navigation call is:

```tsx
router.push({
  pathname: "/(tabs)/chat/[channelId]",
  params: { channelId }
});
```

This `router.push()` **crosses tab boundaries**. When Expo Router navigates from one tab's stack to another tab's route, it performs a **tab switch** rather than pushing onto the current stack. The result:

1. The active tab changes from "offers" to "chat"
2. `chat/[channelId]` is pushed onto the **chat tab's stack** — but the chat stack may have no prior screen (if the user never visited the chat tab), or only `chat/index` as its root
3. The offers tab's stack is left behind entirely — there is no cross-tab back history

### Why the back button is missing

The chat screen's layout (`chat/_layout.tsx:11-18`) does configure a back button:

```tsx
<Stack.Screen
  name="[channelId]"
  options={{
    headerShown: true,
    headerBackTitle: "Retour",
    title: ""
  }}
/>
```

However, the back button only appears when there is a **previous screen in the same stack**. If `chat/[channelId]` is the first (or only) screen pushed onto the chat tab's stack, the native header shows no back button because there's nowhere to go back to within that stack.

**Scenario A** — User has never visited the chat tab: the chat stack is empty, `[channelId]` becomes the root → no back button.

**Scenario B** — User previously visited the chat tab (so `chat/index` is in the stack): a back button labeled "Retour" appears and goes to `chat/index` (the inbox) — but NOT back to `offers/[id]`.

In both cases, the user cannot return to the offer detail page.

## Key Files

| File | Role |
|------|------|
| `src/hooks/useChannelById.tsx` (line 93) | `router.push("/(tabs)/chat/[channelId]")` — the cross-tab navigation call |
| `src/app/(tabs)/_layout.tsx` | Tab navigator defining offers, chat, account tabs |
| `src/app/(tabs)/chat/_layout.tsx` | Chat tab Stack layout |
| `src/app/(tabs)/offers/_layout.tsx` | Offers tab Stack layout |
| `src/app/(tabs)/chat/[channelId].tsx` | Chat detail screen |
| `src/app/(tabs)/offers/[id].tsx` (line 117-119) | `contactProvider()` that calls `startChatChannel()` |
| `src/components/rootTabLayout.tsx` | Shared Stack wrapper used by all tab layouts |

## Possible Solutions

### 1. Push chat screen as a modal/stack screen outside the tab navigator

Instead of navigating to `/(tabs)/chat/[channelId]`, add a `chat/[channelId]` route **at the root Stack level** (in `src/app/_layout.tsx`). This way the chat screen is pushed on top of the entire tab navigator, preserving the back gesture and button.

```
Root Stack
├── (tabs)          ← tab navigator stays mounted underneath
└── chat/[channelId] ← new root-level route, pushed on top
```

- **Pros**: Native back button works out of the box. Offer detail stays mounted underneath. Clean separation — the same `[channelId]` screen component can be reused.
- **Cons**: The tab bar disappears while the chat screen is shown (since it's above the tab navigator). Need to create a new route file outside `(tabs)`.

### 2. Ensure `chat/index` is always in the chat stack before pushing `[channelId]`

Before navigating, first switch to the chat tab (ensuring `chat/index` is mounted), then push `[channelId]`. This guarantees a back button that goes to the inbox.

```tsx
router.navigate("/(tabs)/chat");           // switch to chat tab (index)
setTimeout(() => {
  router.push("/(tabs)/chat/" + channelId); // then push chat detail
}, 0);
```

- **Pros**: Minimal changes, back button goes to inbox which is useful
- **Cons**: Still no way to go back to `offers/[id]`. Slight flash/delay from the two-step navigation. Relies on timing.

### 3. Custom header back button with `router.back()` or `router.push(offers/[id])`

Add a manual back button to the chat screen header that explicitly navigates back to the offer detail (passing the offer ID as a param).

```tsx
// In useChannelById.tsx
router.push({
  pathname: "/(tabs)/chat/[channelId]",
  params: { channelId, returnTo: `/(tabs)/offers/${offerId}` }
});

// In chat/[channelId].tsx
navigation.setOptions({
  headerLeft: () => (
    <TouchableOpacity onPress={() => router.push(returnTo || "/(tabs)/chat")}>
      <ChevronLeft />
    </TouchableOpacity>
  )
});
```

- **Pros**: Full control over where back goes. No structural changes needed.
- **Cons**: Not truly "going back" (pushes a new screen). Loses the offer detail's scroll position and state. Doesn't feel native. `returnTo` param threading is fragile.

### 4. Hybrid: root-level chat route for cross-tab + tab-level for in-tab navigation

Keep `(tabs)/chat/[channelId]` for navigating within the chat tab (e.g. from inbox to a conversation). Add a separate `chat/[channelId]` route at the root stack level for cross-tab use (e.g. from offer detail → chat). Both route files can render the same `ChatScreen` component.

- **Pros**: Best of both worlds — native back works when coming from offers, tab navigation works within chat tab. No hacks.
- **Cons**: Two route files for the same screen (though they share the component). Need to update `useChannelById` to accept a `navigateAsModal` flag or create a separate navigation helper.

## Recommendation

**Option 1** (root-level stack screen) is the cleanest approach. It preserves native back navigation, keeps the offer detail mounted, and follows Expo Router conventions for cross-tab flows. The tab bar being hidden during chat is acceptable UX — most chat apps behave this way.

**Option 4** is ideal if you also want the chat tab's own inbox→chat flow to remain tab-scoped, but adds a second route file.
