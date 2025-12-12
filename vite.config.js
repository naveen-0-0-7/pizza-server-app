import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// this is added for routing
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  base: "./",
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/public": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  // added the TanStackRouterVite() in this
  plugins: [
    TanStackRouterVite(),
    react({
      babel: {
        plugins: [
          [
            "babel-plugin-react-compiler",
            {
              target: "19",
            },
          ],
        ],
      },
    }),
  ],
});
