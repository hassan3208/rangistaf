import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "0.0.0.0",
    port: 8080,
    fs: {
      allow: [
        path.resolve(__dirname),        // Root folder allowed
        path.resolve(__dirname, "shared"),
      ],
      deny: [".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },

  build: {
    outDir: "dist/spa",   // Keep same output
    emptyOutDir: true,
  },

  plugins: [
    react(),
    expressPlugin(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname),      // IMPORTANT → root is the alias
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    configureServer(server) {
      const app = createServer();
      server.middlewares.use(app);
    },
  };
}
