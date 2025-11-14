import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Replace with your current Replit dev host, or use 'all' for dynamic URLs
const replitHost =
  "17a1fe7b-9ee3-45af-bfdc-b799e98bce24-00-1a248dxlgvogk.janeway.replit.dev";

export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    host: "0.0.0.0", // bind to all network interfaces
    port: 5000, // Replit expects port 5000
    strictPort: true, // fail if port 5000 is busy
    allowedHosts: [replitHost], // allow Replit dev host
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@assets": path.resolve(__dirname, "./attached_assets"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
