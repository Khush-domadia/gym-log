import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/gym-log/",
  
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      injectRegister: "auto",

      manifest: {
        name: "GymLog",
        short_name: "GymLog",

        description:
          "A simple offline workout tracker.",

        theme_color: "#121212",
        background_color: "#121212",

        display: "standalone",
        orientation: "portrait",

        start_url: "/",

        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        globPatterns: [
          "**/*.{js,css,html,png,svg,webp,ico}",
        ],
      },
    }),
  ],
});