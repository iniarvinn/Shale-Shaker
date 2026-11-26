import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'
import { nitro } from 'nitro/vite'

// DEPLOY_TARGET menentukan output build:
//   - "node" (default): server Node (.output/server/index.mjs), dipakai Docker/VPS.
//   - "netlify": output khusus Netlify (lihat NETLIFY.md).
// Netlify perlu DEPLOY_TARGET=netlify (diset di netlify.toml).
const isNetlify = process.env.DEPLOY_TARGET === 'netlify'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    devtools(),
    isNetlify ? netlify() : nitro(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
