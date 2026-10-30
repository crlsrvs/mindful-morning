import type { ExpoConfig } from "expo/config";
const config: ExpoConfig = {
  name: "Mindful Morning",
  slug: "mindful-morning",
  version: "0.1.0",
  scheme: "mindfulmorning",
  orientation: "portrait",
  userInterfaceStyle: "light",
  android: {
    package: "cl.mindfulmorning.app",
    allowBackup: false,
    blockedPermissions: [
      "android.permission.SCHEDULE_EXACT_ALARM",
      "android.permission.USE_EXACT_ALARM",
      "android.permission.RECORD_AUDIO",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
    ],
  },
  ios: {
    bundleIdentifier: "cl.mindfulmorning.app",
    supportsTablet: true,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  updates: { enabled: false },
  plugins: [
    "expo-router",
    ["expo-sqlite", { useSQLCipher: true }],
    ["expo-secure-store", { configureAndroidBackup: false }],
    "expo-localization",
    "expo-notifications",
    "./plugins/with-private-storage",
  ],
};
export default config;
