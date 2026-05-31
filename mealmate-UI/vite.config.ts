import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080", // Cổng Backend của bạn
        changeOrigin: true,
        secure: false,
        // Nếu Backend của bạn KHÔNG có tiền tố /api trong code Java
        // nhưng bạn muốn dùng /api ở FE cho gọn, hãy dùng rewrite:
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
});
