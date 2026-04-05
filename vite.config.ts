import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/wedding_invitation/',
  plugins: [react()],
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  server: {
    // Default Vite dev port; change here if 5173 is busy (Vite will try 5174, 5175, …)
    port: 5173,
    strictPort: false,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
})

