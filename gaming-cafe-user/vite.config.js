import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    server: {
      proxy: {
        "https://user-backend.up.railway.app/api": {
          target: mode === "development"
            ? "http://localhost:5000"
            : "https://e2425-wads-l4bcg4-server-monish.csbihub.id:3106",
          changeOrigin: true,
          secure: mode !== "development",
          ws: true,
        },
      },
    },
    build: {
      outDir: "dist",
    },
    plugins: [react(), tailwindcss()],
  }
})


