const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");
const { withSentryConfig } = require("@sentry/react-native/metro");

const config = getDefaultConfig(__dirname);

const uniwindConfig = withUniwindConfig(config, {
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

module.exports = withSentryConfig(uniwindConfig);
