import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  define: {
    __APP_VERSION__: JSON.stringify(`v0.1.0-${new Date().getTime()}`),
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/Gemini_Live.png', 'icons/Gemini_Live_Logo.svg'],
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: [],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => true,
            handler: 'NetworkOnly'
          }
        ]
      },
      manifest: {
        name: "Gemini Live Voice",
        short_name: "Gemini Voice",
        description: "基于Gemini Live API的实时语音对话应用",
        id: "/",
        scope: "/",
        theme_color: "#1976d2",
        background_color: "#ffffff",
        display: "standalone",
        display_override: ["fullscreen", "standalone"],
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/icons/Gemini_Live.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/Gemini_Live.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/Gemini_Live.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/icons/Gemini_Live.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/icons/Gemini_Live_Logo.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
})
