import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server proxies /api to the FastAPI backend on :8000, so the
// frontend can call same-origin relative paths (src/services/api.js
// just fetches "/api/..."), matching how it'll be served in production
// behind a single reverse proxy -- no CORS-specific code paths to
// diverge between dev and prod.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
