import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.upgradez.app",
  appName: "studymate",
  webDir: "out",

  server: {
    url: "https://app.up-gradez.com",
  },

  plugins: {
    StatusBar: {
      backgroundColor: "#1C1C1B",
      style: "DARK",
      overlaysWebView: false,
    },
  },
};

export default config;