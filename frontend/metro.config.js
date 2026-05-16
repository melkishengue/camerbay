const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

// Force stream-chat-react-native-core to use the app's @gorhom/bottom-sheet v5
// instead of its own nested v4. v4 is incompatible with Reanimated v4 on real devices,
// causing AttachmentPicker's BottomSheet (index=-1) to render visible at ~45% screen height.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "@gorhom/bottom-sheet" &&
    context.originModulePath.includes("stream-chat-react-native-core")
  ) {
    // Resolve as if imported from app root → picks up app's v5 instead of nested v4
    return context.resolveRequest(
      { ...context, originModulePath: __filename },
      moduleName,
      platform
    );
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  dtsFile: "./src/uniwind-types.d.ts",
  extraThemes: [
    "lavender-light",
    "lavender-dark",
    "mint-light",
    "mint-dark",
    "sky-light",
    "sky-dark",
    "alpha-light",
    "alpha-dark"
  ]
});
