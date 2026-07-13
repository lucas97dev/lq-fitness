import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // manifest.json is already hand-written in /public, so the plugin
      // just needs to inject the service worker and link tag for it
      manifest: false,
      includeAssets: ["icon-192.png", "icon-512.png", "apple-touch-icon.png", "maskable-icon-512.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,jpg,jpeg,svg,json}"],
      },
    }),
  ],
});
