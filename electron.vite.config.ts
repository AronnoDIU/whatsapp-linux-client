import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
    main: {
        build: {
            lib: {
                entry: 'electron/main.ts'
            },
            outDir: 'dist-electron/main'
        }
    },

    preload: {
        build: {
            lib: {
                entry: path.resolve(__dirname, 'electron/preload.ts')
            },
            outDir: 'dist-electron/preload'
        }
    },

    renderer: {
        root: '.',
        build: {
            outDir: 'dist'
        },
        plugins: [react()]
    }
})