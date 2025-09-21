export default {
  name: "5KI",
  slug: "55KI",
  plugins: [
    [
      "expo-image-picker",
      {
        "photosPermission": "The app accesses your photos to let you share them with your friends."
      }
    ],
    "expo-font",
    "expo-secure-store"
  ],
  // Disable New Architecture to avoid Reanimated native crashes on some devices/dev builds
  newArchEnabled: false,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/logo.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  ios: {
    supportsTablet: true
  },
  android: {
    permissions: [
      "android.permission.CAMERA",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.RECORD_AUDIO",
      "android.permission.CAMERA",
      "android.permission.USE_BIOMETRIC",
      "android.permission.USE_FINGERPRINT"
    ],
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.anonymous.x55KI"
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  extra: {
    // Environment variables (do not hardcode secrets)
    geminiApiKey: process.env.GEMINI_API_KEY,
  },
};