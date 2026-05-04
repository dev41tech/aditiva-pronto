---
name: vercel-react-native-skills
description: React Native and Expo best practices optimized for AI agents. Use ONLY when the project involves mobile development, React Native components, or Expo applications. Do not apply to web-only React/Next.js code.
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# Vercel React Native Skills

Best practices for React Native and Expo development, covering performance, architecture, and platform-specific patterns.

## When to Apply

**Only use this skill for:**
- React Native components (`.tsx` files using RN APIs)
- Expo applications
- Cross-platform mobile code
- React Native-specific performance issues

**Do NOT apply to web-only React/Next.js projects.**

## Rule Categories by Priority

### 1. List Performance (CRITICAL)

- Use `FlashList` (from `@shopify/flash-list`) for all large lists — replaces FlatList
- Always provide `estimatedItemSize` to FlashList
- Memoize list item components with `React.memo`
- Use `keyExtractor` that returns stable string IDs
- Avoid anonymous functions in `renderItem`
- Use `getItemType` for heterogeneous lists

```tsx
// ✅ Correct
import { FlashList } from "@shopify/flash-list";

<FlashList
  data={items}
  renderItem={({ item }) => <ItemComponent item={item} />}
  estimatedItemSize={80}
  keyExtractor={(item) => item.id}
/>
```

### 2. Animations (HIGH)

- Animate ONLY `transform` and `opacity` — run on GPU
- Use `react-native-reanimated` for complex animations
- Use `react-native-gesture-handler` for gesture-driven animations
- Avoid `Animated.View` for frequent updates (prefer Reanimated)
- Use `useSharedValue` and `useAnimatedStyle` for worklet animations

```tsx
// ✅ GPU-accelerated animation
const scale = useSharedValue(1);
const style = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));
```

### 3. Navigation (HIGH)

- Use `react-navigation` with native stack navigators
- Prefer `createNativeStackNavigator` over JS stack
- Use deep linking configuration from day one
- Configure `headerBackTitle` for iOS UX consistency
- Use `useNavigation` hook, not prop drilling

### 4. UI Patterns (HIGH)

- Use `expo-image` for all images (better caching, formats)
- Use `expo-font` for custom fonts with `useFonts` hook
- Use `StyleSheet.create()` — never inline style objects in render
- Apply `Platform.select()` for platform-specific styles
- Respect safe areas with `useSafeAreaInsets` or `SafeAreaView`

```tsx
// ✅ StyleSheet pattern
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
```

### 5. State Management (MEDIUM)

- Use Zustand or Jotai for client state
- Use React Query / TanStack Query for server state
- Avoid Redux unless team already uses it
- Use `AsyncStorage` with a schema/key versioning strategy

### 6. Rendering (MEDIUM)

- Use `React.memo` on all pure components
- Use `useCallback` for event handlers passed as props
- Avoid large component trees — split into focused components
- Use `InteractionManager.runAfterInteractions` for deferred work

### 7. Configuration (LOW)

- Use `app.json` / `app.config.ts` for Expo configuration
- Use EAS Build for production builds
- Configure `metro.config.js` for monorepo support
- Use `babel-plugin-module-resolver` for clean imports

## Touch Target Requirements

All interactive elements must be minimum **44×44px** per Apple HIG and Android Material guidelines:

```tsx
<Pressable style={{ minWidth: 44, minHeight: 44 }}>
  <Icon size={24} />
</Pressable>
```
