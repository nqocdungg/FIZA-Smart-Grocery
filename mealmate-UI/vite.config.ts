import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "es-toolkit/compat/get",
        replacement: path.resolve(__dirname, "./src/shims/es-toolkit-compat/get.ts"),
      },
      {
        find: "es-toolkit/compat/isPlainObject",
        replacement: path.resolve(__dirname, "./src/shims/es-toolkit-compat/isPlainObject.ts"),
      },
      {
        find: "es-toolkit/compat/last",
        replacement: path.resolve(__dirname, "./src/shims/es-toolkit-compat/last.ts"),
      },
      {
        find: "es-toolkit/compat/maxBy",
        replacement: path.resolve(__dirname, "./src/shims/es-toolkit-compat/maxBy.ts"),
      },
      {
        find: "es-toolkit/compat/minBy",
        replacement: path.resolve(__dirname, "./src/shims/es-toolkit-compat/minBy.ts"),
      },
      {
        find: "es-toolkit/compat/omit",
        replacement: path.resolve(__dirname, "./src/shims/es-toolkit-compat/omit.ts"),
      },
      {
        find: "es-toolkit/compat/range",
        replacement: path.resolve(__dirname, "./src/shims/es-toolkit-compat/range.ts"),
      },
      {
        find: "es-toolkit/compat/sortBy",
        replacement: path.resolve(__dirname, "./src/shims/es-toolkit-compat/sortBy.ts"),
      },
      {
        find: "es-toolkit/compat/sumBy",
        replacement: path.resolve(__dirname, "./src/shims/es-toolkit-compat/sumBy.ts"),
      },
      {
        find: "es-toolkit/compat/throttle",
        replacement: path.resolve(__dirname, "./src/shims/es-toolkit-compat/throttle.ts"),
      },
      {
        find: "es-toolkit/compat/uniqBy",
        replacement: path.resolve(__dirname, "./src/shims/es-toolkit-compat/uniqBy.ts"),
      },
      {
        find: "@",
        replacement: path.resolve(__dirname, "./src"),
      },
    ],
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

