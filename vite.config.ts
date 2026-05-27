import { defineConfig } from 'electron-vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: 'electron/main.ts'
      }
    }
  },

  preload: {
    build: {
      rollupOptions: {
        input: path.resolve(__dirname, 'electron/preload.ts')
      }
    }
  },

  renderer: {
    plugins: [react()]
  }
})