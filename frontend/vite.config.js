import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Installability only: precache the static app shell, never API responses (plays are always fetched online).
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        runtimeCaching: [],
      },
      manifest: {
        name: 'HandLab',
        short_name: 'HandLab',
        description: 'Pizarra táctica de handball: crea, mira y comparte jugadas.',
        lang: 'es',
        start_url: '/',
        display: 'standalone',
        background_color: '#f7f7f5',
        theme_color: '#2f7d4f',
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
