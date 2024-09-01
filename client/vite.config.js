import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    postcss: "./postcss.config.js",
  },
  define: {
    "process.env": {
      VITE_GA_MEASUREMENT_ID: JSON.stringify(
        process.env.VITE_GA_MEASUREMENT_ID,
      ),
    },
  },
});
