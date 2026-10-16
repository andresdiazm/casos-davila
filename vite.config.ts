import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages sirve el sitio desde /<repo>/, no desde la raíz del dominio.
  // El workflow de Pages exporta GH_PAGES=true; Vercel y el dev local usan '/'.
  base: process.env.GH_PAGES === 'true' ? '/casos-davila/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
